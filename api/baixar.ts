export const config = { runtime: 'edge' }

const FORMATOS = ['dmg', 'zip'] as const
type Formato = (typeof FORMATOS)[number]

// Pacotes de fonte chegam nomeados `v3.5.1.zip` / `v3.5.1.tar.gz` e nunca
// são o binário do app — mesmo critério do api/downloads.ts.
const FONTE = /^v[\d.]+\.(zip|tar\.gz)$/

export function escolherAsset(
  assets: Array<{ name: string; browser_download_url: string }>,
  formato: string,
): string | null {
  if (!(FORMATOS as readonly string[]).includes(formato)) return null
  const achado = assets.find(
    (a) => !FONTE.test(a.name) && a.name.toLowerCase().endsWith(`.${formato}`),
  )
  return achado ? achado.browser_download_url : null
}

const FALLBACK = 'https://github.com/luisroquette/notchagent/releases/latest'

export default async function handler(req: Request): Promise<Response> {
  const formato = new URL(req.url).searchParams.get('f') ?? 'dmg'
  try {
    const res = await fetch('https://api.github.com/repos/luisroquette/notchagent/releases/latest', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'notchagent-site' },
    })
    if (!res.ok) return Response.redirect(FALLBACK, 302)
    const { assets = [] } = await res.json()
    const url = escolherAsset(assets, formato)
    return Response.redirect(url ?? FALLBACK, 302)
  } catch {
    return Response.redirect(FALLBACK, 302)
  }
}
