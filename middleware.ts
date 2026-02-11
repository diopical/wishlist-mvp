import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parse } from 'cookie'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const cookies = {
    // Provide the full adapter expected by `@supabase/ssr`:
    // - `get(name)` returns a single cookie or null
    // - `getAll()` returns an array of { name, value } with `value` always a string
    // - `setAll()` writes cookies to the NextResponse
    get: async (name: string) => {
      const raw = req.headers.get('cookie') ?? ''
      const parsed = parse(raw)
      const v = parsed[name]
      return v === undefined ? null : { name, value: String(v) }
    },
    getAll: async () => {
      const raw = req.headers.get('cookie') ?? ''
      const parsed = parse(raw)
      return Object.keys(parsed).map(name => ({ name, value: String(parsed[name]) }))
    },
    setAll: async (setCookies: Array<{ name: string; value: string; options?: any }>) => {
      for (const { name, value, options } of setCookies) {
        if (!value) {
          // `res.cookies.delete` expects either a single `name` or a single
          // options object; passing two args causes a TypeScript error in
          // newer Next.js versions. Pass an options object so path/domain
          // are preserved when deleting.
          try {
            res.cookies.delete({ name, path: options?.path ?? '/', domain: options?.domain })
          } catch (e) {
            // Fallback for runtimes that only accept the name
            try { res.cookies.delete(name) } catch (e) {}
          }
        } else {
          res.cookies.set({
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
    { cookies }
  )

  try {
    await supabase.auth.getSession()
  } catch (err) {
    console.error('Middleware supabase.getSession error', err)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]{2,4}).*)',
  ],
}