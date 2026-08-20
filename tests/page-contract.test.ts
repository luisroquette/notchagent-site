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

  it('o botão principal baixa um DMG de um release do GitHub', () => {
    const dmg = html.match(/href="(https:\/\/github\.com\/luisroquette\/notchagent\/releases\/download\/[^"]+\.dmg)"/)
    expect(dmg, 'nenhum link de DMG encontrado').not.toBeNull()
  })

  it('declara os requisitos de sistema antes do clique', () => {
    expect(html).toMatch(/macOS 14/)
    expect(html).toMatch(/Apple Silicon/i)
  })

  it('nunca serve o appcast a partir do domínio comprado', () => {
    expect(html).not.toMatch(/notchagent\.app\/appcast/)
  })
})
