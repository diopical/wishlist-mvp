let authErrors: Array<{ timestamp: string; type: string; error: string }> = []

export async function GET() {
  return Response.json({
    envVars: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...',
    },
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrlRaw: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    recentErrors: authErrors.slice(-10),
    allEnvKeys: Object.keys(process.env)
      .filter(k => k.includes('SUPABASE') || k.includes('NEXT'))
      .reduce((acc, key) => {
        acc[key] = key.includes('KEY') ? '***' : process.env[key]?.substring?.(0, 50)
        return acc
      }, {} as Record<string, any>),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    authErrors.push({
      timestamp: new Date().toISOString(),
      type: body.type || 'unknown',
      error: JSON.stringify(body.error || body.message),
    })
    
    // Keep only last 20 errors
    if (authErrors.length > 20) {
      authErrors = authErrors.slice(-20)
    }
    
    return Response.json({ 
      logged: true, 
      totalErrors: authErrors.length 
    })
  } catch (err) {
    return Response.json({ error: 'Failed to log error' }, { status: 500 })
  }
}
