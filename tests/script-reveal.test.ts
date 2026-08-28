import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const js = readFileSync(new URL('../public/script.js', import.meta.url), 'utf8')

// A5: querySelector('[data-download]') pegava só o botão do topbar —
// os outros 6 CTAs de download nunca revelavam o formulário de captura.
describe('REGRESSÃO A5: todo CTA de download revela o formulário', () => {
  it('escuta todos os [data-download], não só o primeiro', () => {
    expect(js).toMatch(/querySelectorAll\('\[data-download\]'\)/)
    expect(js).not.toMatch(/document\.querySelector\('\[data-download\]'\)/)
  })

  it('ao revelar, leva o usuário até o formulário (scroll + foco)', () => {
    expect(js).toMatch(/scrollIntoView/)
    expect(js).toMatch(/email\.focus\(\)/)
  })

  it('confirma a escolha de comunicação sem mensagem enganosa', () => {
    expect(js).toContain('marketingConsent')
    expect(js).toContain('Avisaremos sobre versões e conteúdos da CF Gauss.')
    expect(js).toContain('Avisamos só quando sair versão nova.')
  })
})
