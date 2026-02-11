 'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Checking sign-in...')

  useEffect(() => {
    let mounted = true

    async function handleCallback() {
      try {
        // If there is a `code` param (PKCE flow), exchange it server-side via the client
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')

        if (code) {
          // exchange code for session
          await supabaseClient.auth.exchangeCodeForSession(code)
        } else {
          // For implicit/fragment flows, supabase-js detects session from URL automatically when the client initializes.
          // Give it a short moment to process the hash and persist the session, then read it.
          await new Promise((r) => setTimeout(r, 200))
        }

        const { data, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.error('Error getting session after callback:', error)
        }

        if (data?.session) {
          // Send session tokens to the server so it can set HTTP-only cookies
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              }),
            })
          } catch (e) {
            console.warn('Failed to set server session cookies:', e)
          }

          // Clean up URL fragments/search params then redirect
          try {
            url.hash = ''
            url.searchParams.delete('code')
            window.history.replaceState({}, '', url.toString())
          } catch (e) {}

          if (mounted) router.replace('/dashboard')
          return
        }

        setMessage('No session found after sign-in. Please try again.')
      } catch (err) {
        console.error('Callback handling error:', err)
        setMessage('Error processing sign-in callback')
      }
    }

    handleCallback()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-4">Processing sign-in...</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
