'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [shortId, setShortId] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const createWishlist = async () => {
    setLoading(true)
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean)
    
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: urlList })
    })
    
    const { short_id, error } = await res.json()
    setLoading(false)
    
    if (short_id) {
      setShortId(short_id)
      navigator.clipboard.writeText(`http://localhost:3000/w/${short_id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      alert(error || 'Ошибка парсинга')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mx-auto mb-6 shadow-2xl"></div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-black bg-clip-text text-transparent mb-4">
            Amazon Wishlist
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Вставь wishlist или product ссылки → получи красивую страницу
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12">
          <textarea
            ref={textareaRef}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://amazon.ae/dp/B07LCXR28D
https://amazon.ae/hz/wishlist/ls/152BOWUZZJ231"
            className="w-full p-6 border-2 border-dashed border-gray-200 rounded-2xl h-64 resize-vertical text-lg focus:border-gradient-to-r focus:border-blue-400 focus:outline-none transition-all bg-gradient-to-b from-white to-gray-50"
            disabled={loading}
          />
          
          <button
            onClick={createWishlist}
            disabled={loading || !urls.trim()}
            className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white py-6 px-8 rounded-2xl text-xl font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
          >
            {loading ? '🔄 Парсим товары...' : '✨ Create Wishlist'}
          </button>
          
          {shortId && (
            <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border-2 border-dashed border-emerald-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-sm font-mono bg-white px-3 py-1 rounded-full border">{shortId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`localhost:3000/w/${shortId}`)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="text-sm bg-emerald-500 text-white px-4 py-1 rounded-full hover:bg-emerald-600"
                >
                  {copied ? '✅ Скопировано!' : '📋 Копировать'}
                </button>
              </div>
              <p className="text-center text-sm text-gray-600">
                Поделись ссылкой: localhost:3000/w/{shortId}
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 space-y-1">
          <p>Поддерживает Amazon.ae wishlist и product страницы</p>
          <p>Авто-копирует ссылку + показывает цены/картинки</p>
        </div>
      </div>
    </main>
  )
}