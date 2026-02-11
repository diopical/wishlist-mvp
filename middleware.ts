import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parse } from 'cookie'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const cookies = {
    getAll: async () => {
      const raw = req.headers.get('cookie') ?? ''
      const parsed = parse(raw)
      return Object.keys(parsed).map(name => ({ name, value: parsed[name] }))
    },
    setAll: async (setCookies: Array<{ name: string; value: string; options?: any }>) => {
      for (const { name, value, options } of setCookies) {
        if (!value) {
          res.cookies.delete(name, options ?? {})
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