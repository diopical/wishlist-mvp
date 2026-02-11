'use client'
import { useEffect, useState } from 'react'
// import { useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-client'

export default function Home() {
  // read search params on client instead of using `useSearchParams`
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [errorParam, setErrorParam] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    let unsubscribe: (() => void) | null = null

    const checkSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession()
        if (data?.session) {
          console.log('✅ Active session found, going to dashboard')
          setHasSession(true)
          // Don't redirect yet - let user see the button
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
    }

    checkSession()

    // Only listen for sign-in events, not initial state
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🏠 Auth event:', event, { hasSession: !!session })
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User just signed in, redirecting...')
        setHasSession(true)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    })
    

    unsubscribe = authListener.subscription.unsubscribe

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Read URL search params on client without relying on next/navigation
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const err = sp.get('error')
      if (err) setErrorParam(err)
    } catch (e) {}
  }, [mounted])

  if (!mounted) {
    return null
  }

  // If already has session, show dashboard button
  if (hasSession) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-12 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          WishList MVP
        </h1>
        <p className="text-lg text-green-600 mb-8">✅ You are logged in!</p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all"
        >
          📊 Go to Dashboard
        </button>
        <button 
          onClick={async () => {
            await supabaseClient.auth.signOut()
            window.location.href = '/'
          }}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold"
        >
          ❌ Sign Out
        </button>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setMessage('Введите email')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback` 
        }
      })

      if (error) {
        console.error('Login error:', error)
        setMessage(`❌ Error: ${error.message}`)
      } else {
        setMessage(`✅ Magic link sent to ${email}`)
        setEmail('')
      }
    } catch (err) {
      console.error('Login exception:', err)
      setMessage('❌ Error sending email')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })

      if (error) {
        console.error('Google sign-in error:', error)
        setMessage(`❌ ${error.message}`)
      } else {
        setMessage('Redirecting to Google...')
      }
    } catch (err) {
      console.error('Google sign-in exception:', err)
      setMessage('❌ Error starting Google sign-in')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto text-center">
      <h1 className="text-5xl font-bold mb-12 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        WishList MVP
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
        Создавайте вишлисты из Amazon и делитесь друзьям!
      </p>
      
      {errorParam && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md mx-auto">
          ❌ {errorParam}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all"
        >
          {loading ? '⏳ Sending...' : '🚀 Sign In (Magic Link)'}
        </button>
      </form>

      <div className="mt-6 max-w-sm mx-auto">
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.9 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l5.6-5.6C33.6 6.7 29.1 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l5.6-5.6C33.6 6.7 29.1 5 24 5 16.7 5 10.3 8.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43c5.1 0 9.6-1.9 13-5.2l-6-4.9C29.9 33.9 27.1 35 24 35c-6 0-10.7-3.1-12.9-7.7l-6.6 5C7.9 36.9 15.9 43 24 43z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.7-6.6 7.4l.1-.1 6 4.9C38.9 40.8 48 33.8 48 25c0-1.3-.1-2.6-.4-3.5z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
      
      {message && (
        <div className="mt-4 p-3 rounded-lg max-w-md mx-auto bg-blue-100 text-blue-700">
          {message}
        </div>
      )}
      
      <p className="mt-12 text-sm text-gray-500">
        1. Enter email → Click "Sign In"<br/>
        2. Check your email for magic link<br/>
        3. Click the link → Dashboard
      </p>
    </div>
  )
}