import { describe, it, expect } from 'vitest'

const FEED = 'https://raw.githubusercontent.com/luisroquette/notchagent/master/appcast.xml'

describe('CONTRATO: canal de atualização', () => {
  it('o feed responde e é XML de appcast Sparkle', async () => {
    const res = await fetch(FEED)
    expect(res.status).toBe(200)
    const xml = await res.text()
    expect(xml).toMatch(/<rss[^>]+sparkle/)
  }, 15000)

  it('o feed anuncia uma versão acima do build 5 (o 3.1.2 congelado)', async () => {
    const xml = await (await fetch(FEED)).text()
    const build = xml.match(/<sparkle:version>(\d+)<\/sparkle:version>/)
    expect(build, 'appcast sem sparkle:version').not.toBeNull()
    expect(Number(build![1])).toBeGreaterThan(5)
  }, 15000)

  it('todo item do feed carrega assinatura EdDSA', async () => {
    const xml = await (await fetch(FEED)).text()
    const items = (xml.match(/<item>/g) ?? []).length
    const signed = (xml.match(/sparkle:edSignature=/g) ?? []).length
    expect(signed).toBe(items)
  }, 15000)
})
