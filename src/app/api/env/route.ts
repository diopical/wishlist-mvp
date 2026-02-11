export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return new Response(JSON.stringify({
    NEXT_PUBLIC_SUPABASE_URL: url ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? (`SET (${String(anon).slice(0,8)}...)`) : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || null,
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
