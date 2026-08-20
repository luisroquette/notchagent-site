export const config = { runtime: 'edge' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  })
}
