// src/app/w/[short_id]/page.tsx — Красивая + Reserved
'use client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Item {
  asin: string
  title: string
  price: string
  img: string
  url: string
  affiliate: string
  reserved_by?: string
  reserved_at?: string
}

export default function Wishlist() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [reserved, setReserved] = useState<Set<string>>(new Set())
  const params = useParams()
  const short_id = params.short_id as string

  useEffect(() => {
    supabase
      .from('wishes')
      .select('items')
      .eq('short_id', short_id)
      .single()
      .then(({ data, error }) => {
        if (data?.items) {
          setItems(data.items)
        } else {
          console.error(error)
        }
        setLoading(false)
      })
  }, [short_id])

  const toggleReserve = async (asin: string, index: number) => {
    const newReserved = new Set(reserved)
    
    if (newReserved.has(asin)) {
      newReserved.delete(asin)
    } else {
      newReserved.add(asin)
    }
    
    setReserved(newReserved)
    
    // 🔥 Сохраняем в Supabase (опционально)
    await supabase
      .from('wishes')
      .update({ 
        items: items.map((item, i) => 
          i === index 
            ? { ...item, reserved_by: newReserved.has(asin) ? 'Anonymous' : null }
            : item
        )
      })
      .eq('short_id', short_id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-6 shadow-lg"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">Загружаем товары...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 py-8 md:py-12 relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 mb-6 sm:mb-8 transform hover:scale-105 transition-transform">
            <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-black bg-gradient-to-r from-rose-600 via-pink-600 to-orange-600 bg-clip-text text-transparent tracking-wider">
              {short_id.toUpperCase()}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight px-4 drop-shadow-lg">
            Wishlist ✨
          </h1>
          <div className="flex justify-center gap-3 sm:gap-4 text-sm sm:text-base text-gray-700 max-w-2xl mx-auto px-4 flex-wrap">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-rose-200">
              <span className="font-black text-rose-600">{items.length}</span>
              <span className="ml-1">товаров</span>
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-pink-200">
              <span className="font-black text-pink-600">{reserved.size}</span>
              <span className="ml-1">зарезервировано</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {items.map((item, i) => {
            const isReserved = reserved.has(item.asin)
            return (
              <div 
                key={item.asin || i} 
                className="group bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden border-2 border-white/50 hover:border-rose-200"
              >
                {/* Image + Reserve badge */}
                <div className="relative h-48 sm:h-64 md:h-72 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {item.img ? (
                    <img 
                      src={item.img.replace(/&quot;/g, '"')} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}
                  
                  {/* 🔥 Reserve badge */}
                  {isReserved && (
                    <div className="absolute inset-0 bg-rose-500/90 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="text-white text-xl sm:text-2xl md:text-3xl font-black tracking-wider animate-pulse">
                        RESERVED
                      </div>
                    </div>
                  )}
                  
                  {/* Reserve button */}
                  <button
                    onClick={() => toggleReserve(item.asin, i)}
                    className={`
                      absolute top-2 sm:top-4 right-2 sm:right-4 z-30 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 text-xs sm:text-sm
                      ${isReserved 
                        ? 'bg-white/90 hover:bg-white text-rose-600 shadow-rose-200' 
                        : 'bg-white/90 hover:bg-rose-500/90 hover:text-white shadow-white'
                      }
                      backdrop-blur-xl border-2 border-white/50 group-hover:scale-110
                    `}
                  >
                    {isReserved ? '❌ Отменить' : '❤️ Резерв'}
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="font-semibold text-base sm:text-lg md:text-xl leading-tight line-clamp-3 mb-3 text-gray-900 group-hover:text-rose-900 transition-colors break-words">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 tracking-tight break-all">
                      {item.price}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <a 
                      href={item.affiliate} 
                      target="_blank"
                      className="block w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-center font-semibold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                    >
                      🛒 Купить
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-32 relative">
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl"></div>
            <div className="relative z-10">
              <div className="w-32 h-32 bg-gradient-to-br from-rose-200 to-pink-300 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-12 transition-transform">
                <span className="text-6xl transform -rotate-6">📦</span>
              </div>
              <h2 className="text-4xl font-black bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-4">Пустой wishlist</h2>
              <p className="text-xl text-gray-600 max-w-md mx-auto">
                Добавьте товары в Amazon wishlist и создайте новую ссылку
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
