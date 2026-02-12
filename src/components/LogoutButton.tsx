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
      if (supabaseClient) await supabaseClient.auth.signOut()
    } catch (e) {
      console.warn('Client signOut failed', e)
    }

    router.replace('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="group px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
    >
      <span className="group-hover:rotate-12 transition-transform">🚪</span>
      Выход
    </button>
  )
}
