import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler, { decidirLead, decidirResposta } from '../api/subscribe'

function req(email = 'ana@exemplo.com', marketingConsent = false): Request {
  return new Request('https://notchagent.app/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, marketingConsent }),
  })
}

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status })
}

// Fila de respostas por chamada: o handler faz 1 fetch (subscriber) ou 2
// (subscriber + lead). Sem resposta restante, devolve 500 — a contagem de
// chamadas é o que os testes do retry verificam.
function mockFetch(...respostas: Response[]) {
  const chamadas: Array<{ url: string; init?: RequestInit }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn((url: unknown, init?: RequestInit) => {
      chamadas.push({ url: String(url), init })
      return Promise.resolve(respostas.shift() ?? new Response(null, { status: 500 }))
    }),
  )
  return chamadas
}

function ambientesComLead() {
  vi.stubEnv('SUPABASE_URL', 'https://db.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'chave')
  vi.stubEnv('PRODUTO_LEAD_SECRET', 'segredo')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('decidirResposta', () => {
  it('200 quando o subscriber gravou, mesmo se o lead falhou', () => {
    expect(decidirResposta({ subscriberOk: true, leadOk: false }).status).toBe(200)
  })

  it('502 quando o subscriber falhou, mesmo se o lead foi', () => {
    expect(decidirResposta({ subscriberOk: false, leadOk: true }).status).toBe(502)
  })

  it('reporta o estado do lead no corpo, sem esconder a falha', () => {
    expect(decidirResposta({ subscriberOk: true, leadOk: false }).corpo).toEqual({
      ok: true,
      lead: false,
    })
  })
})

describe('decidirLead', () => {
  it('200 com ou sem dedup é sucesso', () => {
    expect(decidirLead(200, { ok: true, deduplicado: false, numero: 42 })).toEqual({ tipo: 'ok' })
    expect(decidirLead(200, { ok: true, deduplicado: true, numero: 7 })).toEqual({ tipo: 'ok' })
  })

  it('numeracao_falhou devolve o cardId para reconciliacao', () => {
    expect(decidirLead(502, { ok: false, motivo: 'numeracao_falhou', cardId: 'abc123' })).toEqual({
      tipo: 'numeracao_falhou',
      cardId: 'abc123',
    })
  })

  it('erros comuns carregam o motivo', () => {
    expect(decidirLead(401, { ok: false, motivo: 'nao_autorizado' })).toEqual({
      tipo: 'erro',
      motivo: 'nao_autorizado',
    })
  })

  it('corpo ausente nao derruba a decisao', () => {
    expect(decidirLead(502, null)).toEqual({ tipo: 'erro', motivo: undefined })
  })
})

describe('handler subscribe -> lead cfgauss', () => {
  it('subscriber ok + lead ok -> 200 com indicador de lead verdadeiro', async () => {
    ambientesComLead()
    const chamadas = mockFetch(
      json({ ok: true }, 201),
      json({ ok: true, deduplicado: false, numero: 42 }),
    )

    const res = await handler(req('ana@exemplo.com', true))
    const corpo = await res.json()

    expect(res.status).toBe(200)
    expect(corpo).toEqual({ ok: true, lead: true })
    expect(chamadas).toHaveLength(2)
    expect(chamadas[0].url).toContain('notchagent_subscribers')
    expect(chamadas[1].url).toBe('https://cfgauss.com.br/api/lead/produto')
    const leadBody = JSON.parse(String(chamadas[1].init?.body))
    expect(leadBody).toEqual({ email: 'ana@exemplo.com', produto: 'notchagent', marketingConsent: true, segredo: 'segredo' })
  })

  it('subscriber ok + lead falhou -> 200 com indicador falso', async () => {
    ambientesComLead()
    const chamadas = mockFetch(
      json({ ok: true }, 201),
      json({ ok: false, motivo: 'nao_autorizado' }, 401),
    )

    const res = await handler(req())
    const corpo = await res.json()

    expect(res.status).toBe(200)
    expect(corpo).toEqual({ ok: true, lead: false })
    expect(chamadas).toHaveLength(2)
  })

  it('payload legado continua release-only e nunca infere marketing', async () => {
    ambientesComLead()
    const chamadas = mockFetch(json({ ok: true }, 201), json({ ok: true }))
    const legacy = new Request('https://notchagent.app/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ana@exemplo.com' }),
    })

    await handler(legacy)

    expect(JSON.parse(String(chamadas[1].init?.body))).toMatchObject({ marketingConsent: false })
  })

  it('subscriber falhou -> 502, independente do lead', async () => {
    ambientesComLead()
    const chamadas = mockFetch(json({ ok: false }, 500))

    const res = await handler(req())
    const corpo = await res.json()

    expect(res.status).toBe(502)
    expect(corpo.ok).toBe(false)
    // Mesmo com segredo presente, o lead nao e chamado: nao ha email gravado.
    expect(chamadas).toHaveLength(1)
    expect(chamadas[0].url).toContain('notchagent_subscribers')
  })

  it('numeracao_falhou nao dispara segunda chamada ao lead', async () => {
    ambientesComLead()
    const chamadas = mockFetch(
      json({ ok: true }, 201),
      json({ ok: false, motivo: 'numeracao_falhou', cardId: 'abc123' }, 502),
    )

    const res = await handler(req())
    const corpo = await res.json()

    expect(res.status).toBe(200)
    expect(corpo).toEqual({ ok: true, lead: false })
    // Exatamente 2: subscriber + lead. Nunca um retry — o card ja existe no
    // Trello e um retry passaria pela dedup vazia criando um segundo card.
    expect(chamadas).toHaveLength(2)
    expect(chamadas[1].url).toBe('https://cfgauss.com.br/api/lead/produto')
  })

  it('segredo ausente no ambiente -> nem tenta chamar o cfgauss', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://db.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'chave')
    const chamadas = mockFetch(json({ ok: true }, 201))

    const res = await handler(req())
    const corpo = await res.json()

    expect(res.status).toBe(200)
    expect(corpo).toEqual({ ok: true, lead: false })
    expect(chamadas).toHaveLength(1)
    expect(chamadas[0].url).toContain('notchagent_subscribers')
  })
})

describe('timeout do fetch de lead', () => {
  it('tem timeout para o caso de o cfgauss pendurar', () => {
    const src = readFileSync(new URL('../api/subscribe.ts', import.meta.url), 'utf8')
    // 20s, nao 5s: o orcamento do servidor do outro lado chega a ~18s no pior
    // caso (POST do card 8s + RPC + PUT do titulo 8s). Com 5s o cliente
    // desistia antes e registrava lead:false para um lead que fora criado.
    expect(src).toMatch(/AbortSignal\.timeout\(20000\)/)
  })
})
