'use client'
import { useState } from 'react'

export default function Home() {
  const [urls, setUrls] = useState('')
  const [shortId, setShortId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const urlArray = urls.split('\n').filter(Boolean)  // Bulk lines

    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: urlArray })
    })

    const { short_id } = await res.json()
    setShortId(short_id)
    setLoading(false)
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Wishlist Creator</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Paste Amazon product URLs or wishlist link (one per line)"
            className="w-full p-4 border border-gray-300 rounded-lg h-40 resize-vertical bg-white text-gray-900"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Parsing...' : 'Create Wishlist'}
          </button>
        </form>
        {shortId && (
          <div className="mt-8 p-6 bg-green-100 rounded-lg border border-green-300">
            <h2 className="text-xl font-bold mb-2">Wishlist ready!</h2>
            <a
              href={`/${shortId}`}
              className="text-blue-600 hover:underline font-mono bg-white px-3 py-1 rounded text-sm"
            >
              {window.location.origin}/{shortId}
            </a>
          </div>
        )}
      </div>
    </main>
  )
}