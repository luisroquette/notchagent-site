// tests/ctas.test.ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')

const PERMITIDOS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://www.googletagmanager.com',
  'https://notchagent.app/',
  'https://schema.org',
]

describe('CTAs do site', () => {
  it('nenhum link de saida escapa do tracklink', () => {
    const externos = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((u) => !PERMITIDOS.some((p) => u.startsWith(p)))
      .filter((u) => !u.startsWith('https://cfgauss.com.br/t/'))
    expect(externos).toEqual([])
  })

  it('nao aponta para uma versao fixa do binario', () => {
    expect(html).not.toMatch(/releases\/download\/v\d+\.\d+\.\d+/)
  })

  it('a secao de captura nao esta oculta', () => {
    expect(html).not.toMatch(/<section[^>]+id="subscribe"[^>]*\shidden/)
  })
})
