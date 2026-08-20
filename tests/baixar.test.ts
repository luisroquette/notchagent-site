import { describe, expect, it } from 'vitest'
import { escolherAsset } from '../api/baixar'

const ASSETS = [
  { name: 'NotchAgent-3.5.1.dmg', browser_download_url: 'https://x/dmg' },
  { name: 'NotchAgent-3.5.1.zip', browser_download_url: 'https://x/zip' },
  { name: 'source.tar.gz', browser_download_url: 'https://x/src' },
]

describe('escolherAsset', () => {
  it('acha o dmg independente da versao no nome', () => {
    expect(escolherAsset(ASSETS, 'dmg')).toBe('https://x/dmg')
  })

  it('acha o zip e nao confunde com source.tar.gz', () => {
    expect(escolherAsset(ASSETS, 'zip')).toBe('https://x/zip')
  })

  it('devolve null quando o formato nao existe, em vez de undefined', () => {
    expect(escolherAsset([], 'dmg')).toBeNull()
  })

  it('recusa formato fora da lista', () => {
    expect(escolherAsset(ASSETS, 'exe' as never)).toBeNull()
  })
})
