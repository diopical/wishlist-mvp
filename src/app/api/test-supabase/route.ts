import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return Response.json({ 
        error: 'Missing env vars',
        url: url ? 'present' : 'missing',
        key: key ? 'present' : 'missing',
      })
    }

    console.log('Testing Supabase connection with URL:', url)

    const client = createClient(url, key)
    
    // Try to get session (simple test)
    const { data, error } = await client.auth.getSession()

    return Response.json({
      success: !error,
      url: url,
      error: error?.message || null,
      hasSession: !!data?.session,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return Response.json({
      error: err.message,
      type: err.constructor.name,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
