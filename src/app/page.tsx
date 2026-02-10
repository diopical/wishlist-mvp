'use client'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎁 Wishlist MVP
        </h1>
        
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all">
              Войти через Google
            </button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          <div className="space-y-4">
            <UserButton />
            <a href="/dashboard" className="block w-full p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all">
              👉 Мои списки
            </a>
          </div>
        </SignedIn>
      </div>
    </main>
  )
}