import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()
  const cookieAdapter = {
    getAll: async () => {
      const all = cookieStore.getAll ? cookieStore.getAll() : []
      return (all || []).map((c: any) => ({ name: c.name, value: c.value ?? '' }))
    },
    setAll: async (setCookies: Array<{ name: string; value: string; options?: any }>) => {
      // Server components cannot set response cookies here; this is a no-op.
      console.warn('@supabase/ssr: setAll called in server component adapter (no-op)')
    },
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  )
}