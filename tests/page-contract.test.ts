import { readFileSync, existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const PAGE = 'public/index.html'
const html = existsSync(PAGE) ? readFileSync(PAGE, 'utf8') : ''

describe('CONTRATO: página de download', () => {
  it('a página existe', () => {
    expect(existsSync(PAGE)).toBe(true)
  })

  it('nunca ensina o usuário a remover quarentena', () => {
    expect(html).not.toMatch(/xattr/i)
    expect(html).not.toMatch(/com\.apple\.quarantine/i)
  })

  it('nunca aponta para o mirror privado', () => {
    expect(html).not.toMatch(/notchagent-personal/)
  })

  it('o botão principal baixa um DMG (release do GitHub ou tracklink futuro)', () => {
    // Aceita os dois destinos: o direto de hoje e o /t/... do tracklink;
    // o que não pode faltar é o CTA de download do binário DMG.
    const direto = html.match(/href="(https:\/\/github\.com\/luisroquette\/notchagent\/releases\/download\/[^"]+\.dmg)"/)
    const tracklink = html.match(/href="(https:\/\/cfgauss\.com\.br\/t\/notchagent-download-dmg)"/)
    expect(direto ?? tracklink, 'nenhum CTA de download de DMG (direto ou tracklink)').not.toBeNull()
  })

  it('declara os requisitos de sistema antes do clique', () => {
    expect(html).toMatch(/macOS 14/)
    expect(html).toMatch(/Apple Silicon/i)
  })

  it('nunca serve o appcast a partir do domínio comprado', () => {
    expect(html).not.toMatch(/notchagent\.app\/appcast/)
  })

  it('o botão de download não depende do formulário', () => {
    const btn = html.indexOf('data-download')
    const form = html.indexOf('id="subscribe"')
    expect(btn, 'botão de download ausente').toBeGreaterThan(-1)
    if (form > -1) {
      expect(btn, 'download aparece depois do formulário').toBeLessThan(form)
    }
  })

  it('separa release notes de consentimento opcional de marketing', () => {
    expect(html).toContain('Sem newsletter, sem marketing — só release notes.')
    expect(html).toContain('id="marketing-consent"')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('Posso cancelar a qualquer momento.')
  })

  it('o contador de downloads não inventa número no HTML', () => {
    expect(html, 'elemento dl-count ausente').toMatch(/id="dl-count"/)
    const el = html.match(/id="dl-count"[^>]*>[^<]*</)?.[0] ?? ''
    expect(el).not.toMatch(/[0-9]/)
  })

  it('declara o app como SoftwareApplication gratuito no schema', () => {
    expect(html).toMatch(/"@type":\s*"SoftwareApplication"/)
    expect(html).toMatch(/"price":\s*"0"/)
    expect(html).toMatch(/"url":\s*"https:\/\/notchagent\.app\/"/)
  })
})
