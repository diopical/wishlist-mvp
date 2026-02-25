'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Item {
  asin: string
  title: string
  price: string
  img: string
  url: string
  affiliate: string
  reserved?: boolean
  reserved_by?: string
  reserved_at?: string
}

interface WishlistData {
  items: Item[]
  require_name_for_reserve?: boolean
  destination?: string
}

export default function PublicWishlist() {
  const [items, setItems] = useState<Item[]>([])
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [requireNameForReserve, setRequireNameForReserve] = useState(false)
  const [username, setUsername] = useState('')
  const [shortId, setShortId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const slug = params.slug as string[]

  useEffect(() => {
    if (!slug || slug.length === 0) {
      setLoading(false)
      setError('Invalid URL')
      return
    }

    let uname = ''
    let sid = ''

    // Handle both formats:
    // /w/short_id (old format)
    // /w/username/short_id (new format)
    if (slug.length === 1) {
      // Old format: /w/short_id
      sid = slug[0]
    } else if (slug.length === 2) {
      // New format: /w/username/short_id
      uname = slug[0]
      sid = slug[1]
    } else {
      setLoading(false)
      setError('Invalid URL format')
      return
    }

    setUsername(uname)
    setShortId(sid)

    // Determine which API endpoint to use
    const apiUrl = uname
      ? `/api/wishlists/public/${sid}?username=${encodeURIComponent(uname)}`
      : `/api/wishlists/public/${sid}`

    // Получаем вишлист через публичный API
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setItems(data.items)
          setDestination(data.destination || 'Мой вишлист')
          setRequireNameForReserve(data.require_name_for_reserve || false)
        } else {
          console.error('Ошибка загрузки вишлиста:', data.error)
          setError(data.error || 'Вишлист не найден')
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Ошибка запроса:', error)
        setError('Ошибка загрузки вишлиста')
        setLoading(false)
      })
  }, [slug])

  const toggleReserve = async (asin: string, index: number) => {
    const item = items[index]
    const isCurrentlyReserved = !!item.reserved_by

    // Если пытаемся зарезервировать и требуется имя - просим его
    if (!isCurrentlyReserved && requireNameForReserve && !userName) {
      setPendingIndex(index)
      setShowNameInput(true)
      return
    }

    // Определяем имя резервирующего (для снятия резервации имя не важно)
    const name = isCurrentlyReserved ? '' : ((requireNameForReserve) ? (userName || '') : 'Anonymous')

    const reserveUrl = username
      ? `/api/wishlists/public/${shortId}/reserve?username=${encodeURIComponent(username)}`
      : `/api/wishlists/public/${shortId}/reserve`

    try {
      const response = await fetch(reserveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin,
          name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Ошибка: ' + (data.error || 'Не удалось зарезервировать товар'))
        return
      }

      // Обновляем состояние товаров на основе ответа API
      const updatedItems = items.map((item, idx) => {
        if (idx === index) {
          if (data.reserved) {
            // Зарезервировано
            return {
              ...item,
              reserved: true,
              reserved_by: data.reserved_by,
              reserved_at: new Date().toISOString()
            }
          } else {
            // Резервация снята
            const { reserved, reserved_by, reserved_at, ...rest } = item
            return rest
          }
        }
        return item
      })
      setItems(updatedItems)
      setShowNameInput(false)
      setUserName('')
      setPendingIndex(null)
    } catch (error) {
      console.error('Ошибка при резервировании:', error)
      alert('Техническая ошибка при резервировании')
    }
  }

  const handleConfirmReserve = () => {
    if (pendingIndex !== null) {
      toggleReserve(items[pendingIndex].asin, pendingIndex)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Загрузка вишлиста...</p>
        </div>
      </div>
    )
  }

  if (error || !items.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-gray-600 font-medium">
            {error || 'Вишлист пуст или не найден'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {destination}
          </h1>
          <p className="text-gray-600">
            {items.length} товаров • {items.filter(i => i.reserved).length} зарезервировано
          </p>
        </div>

        {/* Модалка для ввода имени */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Как вас зовут?</h2>
              <p className="text-gray-600 mb-6">
                Укажите своё имя для подтверждения резервирования
              </p>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white mb-6"
                onKeyPress={e => e.key === 'Enter' && handleConfirmReserve()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNameInput(false)
                    setUserName('')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmReserve}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition transform hover:scale-105"
                >
                  Зарезервировать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Товары */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={item.asin}
              className={`flex flex-col rounded-2xl shadow-lg overflow-hidden transition-all transform hover:scale-105 ${
                item.reserved
                  ? 'bg-gray-100 border-2 border-gray-300 opacity-75'
                  : 'bg-white border-2 border-transparent hover:border-blue-300'
              }`}
            >
              {/* Изображение */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden group">
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}

                {/* Статус резервирования */}
                {item.reserved && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-2">✅</div>
                      <p className="text-white font-bold text-sm">Зарезервировано</p>
                      {item.reserved_by && (
                        <p className="text-white/90 text-xs">{item.reserved_by}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Информация о товаре */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold line-clamp-2 text-gray-900 mb-2">
                  {item.title}
                </h3>

                <p className="text-lg font-bold text-gray-900 mb-3">{item.price}</p>

                {/* Информация о резервировании */}
                {item.reserved && item.reserved_by && (
                  <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-100 rounded-lg">
                    Зарезервировано: <strong>{item.reserved_by}</strong>
                  </p>
                )}

                {/* Кнопки действий */}
                <div className="flex flex-col gap-2 mt-auto">
                  {/* Кнопка для магазина */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6 6m0 0l-6 6m6-6H3" />
                    </svg>
                    <span>Смотреть</span>
                  </a>

                  {/* Кнопка резервирования */}
                  <button
                    onClick={() => toggleReserve(item.asin, index)}
                    className={`w-full px-4 py-2 text-white font-semibold rounded-xl hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 text-sm ${
                      item.reserved
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    {item.reserved ? (
                      <>
                        <span>❌</span>
                        <span>Отменить</span>
                      </>
                    ) : (
                      <>
                        <span>🎁</span>
                        <span>Зарезервировать</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
