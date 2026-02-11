import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const cookieAdapter = {
      getAll: async () => [] as Array<{ name: string; value: string }>,
      setAll: async (setCookies: Array<{ name: string; value: string; options?: any }>) => {
        for (const { name } of setCookies) {
          try { cookieStore.delete(name) } catch (e) {}
        }
      },
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieAdapter }
    )

    // This will instruct the adapter to clear auth cookies
    try { await supabase.auth.signOut() } catch (e) { /* ignore */ }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('API /auth/logout error', err)
    return new Response(JSON.stringify({ error: 'failed' }), { status: 500 })
  }
}
