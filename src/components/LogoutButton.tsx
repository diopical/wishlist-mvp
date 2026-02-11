"use client"
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    try {
      // Ask server to clear HTTP-only auth cookies
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.warn('Logout request failed', e)
    }

    try {
      // Ensure client-side session/local storage is cleared
      await supabaseClient.auth.signOut()
    } catch (e) {
      console.warn('Client signOut failed', e)
    }

    router.replace('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="ml-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
    >
      Sign out
    </button>
  )
}
