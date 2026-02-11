import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { access_token, refresh_token } = body || {}

    if (!access_token || !refresh_token || typeof access_token !== 'string' || typeof refresh_token !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid tokens' }), { status: 400 })
    }

    const cookieStore = await cookies()

    const cookieAdapter = {
      getAll: async () => [] as Array<{ name: string; value: string }>,
      setAll: async (setCookies: Array<{ name: string; value: string; options?: any }>) => {
        for (const { name, value, options } of setCookies) {
          if (!value) {
            try { cookieStore.delete(name) } catch (e) {}
          } else {
            cookieStore.set({
              name,
              value,
              path: options?.path ?? '/',
              httpOnly: options?.httpOnly ?? true,
              sameSite: options?.sameSite ?? 'lax',
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
              maxAge: options?.maxAge,
              domain: options?.domain,
            })
          }
        }
      },
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieAdapter }
    )

    // Set session on server; this will invoke cookieAdapter.setAll
    await supabase.auth.setSession({ access_token, refresh_token })

    // Validate tokens by fetching the user; if invalid, clear cookies and reject
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      try { await supabase.auth.signOut() } catch (e) {}
      return new Response(JSON.stringify({ error: 'Invalid session tokens' }), { status: 401 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('API /auth/session error', err)
    return new Response(JSON.stringify({ error: 'failed' }), { status: 500 })
  }
}
