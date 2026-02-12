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
        if (!supabaseClient) return
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
    if (supabaseClient) {
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
    }

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl transform rotate-6 hover:rotate-12 transition-transform shadow-2xl">
              ✨
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            WishList MVP
          </h1>
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-green-200">
            <p className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
              <span className="animate-bounce">✅</span>
              Вы вошли в систему!
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-5 px-8 rounded-2xl font-black text-xl shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 mb-4 flex items-center justify-center gap-3"
          >
            <span>🚀</span>
            Открыть панель
          </button>
          <button 
            onClick={async () => {
              try { if (supabaseClient) await supabaseClient.auth.signOut() } catch (e) {}
              window.location.href = '/'
            }}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-2xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            Выйти
          </button>
        </div>
      </div>
    )
  }

  const logError = async (type: string, error: any) => {
    console.error(`❌ [${type}]`, error)
    try {
      await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          error: {
            message: error?.message || String(error),
            status: error?.status,
            cause: error?.cause?.toString?.(),
            stack: error?.stack?.substring?.(0, 200),
          },
        }),
      })
    } catch (logErr) {
      console.error('Failed to send error log:', logErr)
    }
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
      if (!supabaseClient) {
        const err = new Error('Supabase client not initialized')
        logError('LOGIN_NO_CLIENT', err)
        throw err
      }
      
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('🔐 [LOGIN] Sending magic link with redirect:', redirectUrl)
      console.log('🔐 [LOGIN] Email:', email)
      
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: redirectUrl
        }
      })

      if (error) {
        logError('LOGIN_OTP_ERROR', error)
        setMessage(`❌ Error: ${error.message}`)
      } else {
        console.log('✅ [LOGIN] Magic link sent successfully')
        setMessage(`✅ Magic link sent to ${email}. Check redirect: ${redirectUrl}`)
        setEmail('')
      }
    } catch (err) {
      logError('LOGIN_EXCEPTION', err)
      setMessage('❌ Error sending email')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      if (!supabaseClient) {
        const err = new Error('Supabase client not initialized')
        logError('GOOGLE_NO_CLIENT', err)
        throw err
      }
      
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('🔑 [GOOGLE] Attempting sign-in with redirect:', redirectUrl)
      
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      })

      if (error) {
        logError('GOOGLE_OAUTH_ERROR', error)
        setMessage(`❌ ${error.message}`)
      } else {
        setMessage('Redirecting to Google...')
      }
    } catch (err) {
      logError('GOOGLE_EXCEPTION', err)
      setMessage('❌ Error starting Google sign-in')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Логотип */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl transform hover:rotate-12 transition-transform shadow-2xl">
              🎁
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            WishList MVP
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 font-medium max-w-sm mx-auto">
            Создавайте красивые вишлисты из Amazon и делитесь с друзьями! ✨
          </p>
        </div>
        
        {/* Сообщение об ошибке */}
        {errorParam && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-800 rounded-2xl shadow-lg flex items-center gap-3 animate-shake">
            <span className="text-2xl">❌</span>
            <span className="font-semibold">{errorParam}</span>
          </div>
        )}
        
        {/* Форма */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-gray-200">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>📧</span>
                Email адрес
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 font-medium shadow-sm transition-all"
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 text-white py-5 px-8 rounded-2xl font-black text-lg shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">✨</span>
                  <span>Войти через Email</span>
                </>
              )}
            </button>
          </form>

          {/* Разделитель */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="text-sm font-bold text-gray-500">ИЛИ</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Google вход */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-800 py-4 px-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.9 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l5.6-5.6C33.6 6.7 29.1 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l5.6-5.6C33.6 6.7 29.1 5 24 5 16.7 5 10.3 8.9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43c5.1 0 9.6-1.9 13-5.2l-6-4.9C29.9 33.9 27.1 35 24 35c-6 0-10.7-3.1-12.9-7.7l-6.6 5C7.9 36.9 15.9 43 24 43z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.7-6.6 7.4l.1-.1 6 4.9C38.9 40.8 48 33.8 48 25c0-1.3-.1-2.6-.4-3.5z"/>
            </svg>
            Войти через Google
          </button>
          
          {/* Сообщение */}
          {message && (
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 text-blue-800 font-semibold shadow-md">
              {message}
            </div>
          )}
        </div>
        
        {/* Инструкция */}
        <div className="mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 text-center">
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            <span className="block mb-2 font-bold text-purple-700">📝 Как войти:</span>
            1️⃣ Введите email → Нажмите "Войти"<br/>
            2️⃣ Проверьте почту и найдите письмо<br/>
            3️⃣ Кликните по ссылке → Готово! 🎉
          </p>
        </div>
      </div>
    </div>
  )
}