// src/lib/supabase-client.ts — ВАШ КОД + 'use client'
'use client'
import { createClient } from '@supabase/supabase-js'

// Lazily initialize the browser Supabase client at runtime. This avoids
// throwing during server-side prerender/build if the NEXT_PUBLIC_* env
// variables are not present in the build environment (e.g. Vercel).
let supabaseClient: ReturnType<typeof createClient> | null = null

if (typeof window !== 'undefined') {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseAnonKey) {
		console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in runtime')
	} else {
		supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
	}
}

export { supabaseClient }