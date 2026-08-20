export const config = { runtime: 'edge' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Resposta ao navegador: o subscriber manda, o estado do lead é informativo.
// O e-mail gravado nunca se perde por causa do lead.
export function decidirResposta(r: { subscriberOk: boolean; leadOk: boolean }) {
  return {
    status: r.subscriberOk ? 200 : 502,
    corpo: { ok: r.subscriberOk, lead: r.leadOk },
  }
}

export type DecisaoLead =
  | { tipo: 'ok' }
  | { tipo: 'numeracao_falhou'; cardId?: string }
  | { tipo: 'erro'; motivo?: string }

// Classifica a resposta da rota de lead do cfgauss (POST /api/lead/produto).
// 200 é sucesso com ou sem dedup. numeracao_falhou é terminal: o card já
// existe no Trello, e retentar criaria um segundo card — a deduplicação
// consulta o banco, onde ainda não há linha. Registramos o cardId para
// reconciliação e seguimos.
export function decidirLead(status: number, corpo: unknown): DecisaoLead {
  if (status === 200) return { tipo: 'ok' }
  const obj = typeof corpo === 'object' && corpo !== null ? (corpo as Record<string, unknown>) : {}
  if (obj.motivo === 'numeracao_falhou') {
    return {
      tipo: 'numeracao_falhou',
      cardId: typeof obj.cardId === 'string' ? obj.cardId : undefined,
    }
  }
  return { tipo: 'erro', motivo: typeof obj.motivo === 'string' ? obj.motivo : undefined }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), { status: 405 })
  }

  let email: unknown
  try {
    ;({ email } = await req.json())
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 })
  }

  if (typeof email !== 'string' || !EMAIL.test(email)) {
    return new Response(JSON.stringify({ ok: false }), { status: 400 })
  }

  const key = process.env.SUPABASE_SERVICE_KEY
  if (!process.env.SUPABASE_URL || !key) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 })
  }

  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/notchagent_subscribers`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({ email: email.toLowerCase().trim(), source: 'notchagent.app' }),
  })

  // Lead no pipeline do cfgauss: passo secundário, best-effort. Falha aqui
  // nunca vira erro do formulário — o e-mail já está gravado.
  let leadOk = false
  const segredo = process.env.PRODUTO_LEAD_SECRET
  if (res.ok && segredo) {
    try {
      const leadRes = await fetch('https://cfgauss.com.br/api/lead/produto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), produto: 'notchagent', segredo }),
        // 20s, nao 5s: a rota do outro lado tem orcamento proprio de ate ~18s
        // (POST do card com 8s + RPC + PUT do titulo com 8s) e ja devolve 502
        // sozinha quando estoura. Com 5s o cliente desistia ANTES do servidor
        // terminar — o lead era criado mas registrado aqui como `lead:false`,
        // e no pior caso o card ficava orfao num board que nenhum cron varre.
        signal: AbortSignal.timeout(20000),
      })
      const corpo = await leadRes.json().catch(() => null)
      const decisao = decidirLead(leadRes.status, corpo)
      if (decisao.tipo === 'ok') {
        leadOk = true
      } else if (decisao.tipo === 'numeracao_falhou') {
        console.error('[subscribe] lead numeracao_falhou — card para reconciliar:', decisao.cardId)
      } else {
        console.error('[subscribe] lead falhou:', leadRes.status, decisao.motivo)
      }
    } catch (erro) {
      console.error('[subscribe] lead inalcançavel:', erro)
    }
  } else if (res.ok) {
    console.error('[subscribe] PRODUTO_LEAD_SECRET ausente — lead pulado')
  }

  const { status, corpo } = decidirResposta({ subscriberOk: res.ok, leadOk })
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
