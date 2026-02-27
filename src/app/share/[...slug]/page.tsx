'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getReservedOverlayStyle, getThemePatternStyle, resolveTheme, ThemeConfig } from '@/lib/theme'
import {
  DEFAULT_LANGUAGE,
  EVENT_TYPE_KEYS,
  LANGUAGE_OPTIONS,
  getEventKeyFromLabel,
  getEventLabelByValue,
  type Language
} from '@/lib/i18n'

interface AlternativeLink {
  store: string
  url: string
  price?: string
  img?: string
  matchScore?: number
}

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
  alternativeLinks?: AlternativeLink[]
  comment?: string
}

interface WishlistData {
  items: Item[]
  require_name_for_reserve?: boolean
  destination?: string
  event_type?: string
  theme?: ThemeConfig | null
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
  const [theme, setTheme] = useState<ThemeConfig | null>(null)
  const [eventType, setEventType] = useState('')
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const params = useParams()
  const slug = params.slug as string[]

  const resolvedTheme = resolveTheme(theme)
  const reservedOverlay = getReservedOverlayStyle(resolvedTheme)
  const backgroundPattern = getThemePatternStyle(resolvedTheme)
  const reservedIcon = resolvedTheme.reserved_overlay?.icon || '🔒'

  const translations = {
    en: {
      invalidUrl: 'Invalid URL',
      invalidUrlFormat: 'Invalid URL format',
      loadError: 'Failed to load wishlist',
      notFound: 'Wishlist not found',
      loading: 'Loading wishlist...',
      empty: 'Wishlist is empty or not found',
      items: 'items',
      reserved: 'reserved',
      nameTitle: 'What is your name?',
      nameBody: 'Please enter your name to confirm the reservation',
      namePlaceholder: 'Your name',
      cancel: 'Cancel',
      reserve: 'Reserve',
      reservedLabel: 'Reserved',
      reservedBy: 'Reserved by',
      wishLabel: 'Wish:',
      unreserve: 'Unreserve',
      reserveAction: 'Reserve',
      errorPrefix: 'Error: ',
      reserveFailed: 'Failed to reserve item',
      reserveTechError: 'Technical error while reserving'
    },
    ru: {
      invalidUrl: 'Некорректный URL',
      invalidUrlFormat: 'Неверный формат URL',
      loadError: 'Ошибка загрузки вишлиста',
      notFound: 'Вишлист не найден',
      loading: 'Загрузка вишлиста...',
      empty: 'Вишлист пуст или не найден',
      items: 'товаров',
      reserved: 'зарезервировано',
      nameTitle: 'Как вас зовут?',
      nameBody: 'Укажите свое имя для подтверждения резервирования',
      namePlaceholder: 'Ваше имя',
      cancel: 'Отмена',
      reserve: 'Зарезервировать',
      reservedLabel: 'Зарезервировано',
      reservedBy: 'Зарезервировано',
      wishLabel: 'Пожелание:',
      unreserve: 'Отменить',
      reserveAction: 'Зарезервировать',
      errorPrefix: 'Ошибка: ',
      reserveFailed: 'Не удалось зарезервировать товар',
      reserveTechError: 'Техническая ошибка при резервировании'
    }
  }

  const t = translations[language]
  const eventKey = eventType
    ? (EVENT_TYPE_KEYS.has(eventType) ? eventType : getEventKeyFromLabel(eventType))
    : null
  const eventLabel = eventKey ? getEventLabelByValue(eventKey, language) : eventType

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  useEffect(() => {
    if (!slug || slug.length === 0) {
      setLoading(false)
      setError(t.invalidUrl)
      return
    }

    let uname = ''
    let sid = ''

    // Handle both formats:
    // /share/short_id (old format)
    // /share/username/short_id (new format)
    if (slug.length === 1) {
      // Old format: /share/short_id
      sid = slug[0]
    } else if (slug.length === 2) {
      // New format: /share/username/short_id
      uname = slug[0]
      sid = slug[1]
    } else {
      setLoading(false)
      setError(t.invalidUrlFormat)
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
          setDestination(data.destination || 'My wishlist')
          setRequireNameForReserve(data.require_name_for_reserve || false)
          setTheme(data.theme || null)
          setEventType(data.event_type || '')
          setLanguage(data.language === 'ru' ? 'ru' : 'en')
        } else {
          console.error('Ошибка загрузки вишлиста:', data.error)
          setError(data.error || t.notFound)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Ошибка запроса:', error)
        setError(t.loadError)
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
        alert(t.errorPrefix + (data.error || t.reserveFailed))
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
      alert(t.reserveTechError)
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
          <p className="text-gray-600 font-medium">{t.loading}</p>
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
            {error || t.empty}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-8 px-4 relative overflow-hidden"
      style={{ background: resolvedTheme.palette.page_bg }}
    >
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg p-1">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setLanguage(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                language === option.value
                  ? 'bg-gray-900 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: backgroundPattern.backgroundImage,
          backgroundSize: backgroundPattern.backgroundSize,
          backgroundPosition: backgroundPattern.backgroundPosition,
          opacity: backgroundPattern.opacity
        }}
      />
      {resolvedTheme.decorations && resolvedTheme.decorations.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {resolvedTheme.decorations.map((decoration, index) => (
            <div
              key={`${resolvedTheme.key}-${index}`}
              className="absolute select-none"
              style={
                decoration.kind === 'emoji'
                  ? {
                      left: decoration.x,
                      top: decoration.y,
                      fontSize: decoration.size,
                      opacity: decoration.opacity ?? 0.25,
                      transform: `rotate(${decoration.rotate || 0}deg)`
                    }
                  : {
                      left: decoration.x,
                      top: decoration.y,
                      width: decoration.size,
                      height: decoration.size,
                      opacity: decoration.opacity ?? 0.2,
                      filter: `blur(${decoration.blur || 0}px)`,
                      transform: `rotate(${decoration.rotate || 0}deg)`,
                      borderRadius: '999px',
                      background: decoration.gradient || decoration.color || 'rgba(255,255,255,0.25)'
                    }
              }
            >
              {decoration.kind === 'emoji' ? decoration.emoji : null}
            </div>
          ))}
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl md:text-5xl font-black bg-clip-text text-transparent mb-2"
            style={{ backgroundImage: resolvedTheme.palette.title_gradient }}
          >
            {destination}
          </h1>
          <p className="text-gray-600">
            {items.length} {t.items} • {items.filter(i => i.reserved).length} {t.reserved}
          </p>
          {eventLabel && (
            <p className="mt-2 text-sm font-semibold text-gray-500">{eventLabel}</p>
          )}
        </div>

        {/* Модалка для ввода имени */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.nameTitle}</h2>
              <p className="text-gray-600 mb-6">
                {t.nameBody}
              </p>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder={t.namePlaceholder}
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
                  {t.cancel}
                </button>
                <button
                  onClick={handleConfirmReserve}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition transform hover:scale-105"
                >
                  {t.reserve}
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
                  : 'border-2 border-transparent hover:border-blue-300'
              }`}
              style={!item.reserved ? { background: resolvedTheme.palette.card_bg, borderColor: resolvedTheme.palette.border } : undefined}
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
                  <div className="absolute inset-0">
                    {reservedOverlay && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: reservedOverlay.backgroundImage,
                          backgroundSize: reservedOverlay.backgroundSize,
                          backgroundPosition: reservedOverlay.backgroundPosition,
                          opacity: reservedOverlay.opacity
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-center flex flex-col items-center gap-2">
                        <div
                          className="px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-lg"
                          style={{ background: resolvedTheme.palette.accent }}
                        >
                          <span className="mr-1">{reservedIcon}</span>
                          <span>{t.reservedLabel}</span>
                        </div>
                        {requireNameForReserve && item.reserved_by && item.reserved_by !== 'Anonymous' && (
                          <p className="text-white/90 text-xs">{item.reserved_by}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Информация о товаре */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold line-clamp-2 text-gray-900 mb-2">
                  {item.title}
                </h3>

                {/* Информация о резервировании */}
                {item.reserved && requireNameForReserve && item.reserved_by && item.reserved_by !== 'Anonymous' && (
                  <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-100 rounded-lg">
                    {t.reservedBy}: <strong>{item.reserved_by}</strong>
                  </p>
                )}

                {/* Комментарий к товару */}
                {item.comment && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-400">
                    <p className="text-xs font-semibold text-amber-900 mb-1">💬 {t.wishLabel}</p>
                    <p className="text-sm text-amber-900">{item.comment}</p>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="flex flex-col gap-2 mt-auto">
                  {/* Кнопки для магазинов */}
                  <div className="flex flex-col gap-2">
                    {/* Основная ссылка Amazon */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6 6m0 0l-6 6m6-6H3" />
                      </svg>
                      <span>Amazon</span>
                      <span className="text-xs opacity-75">({item.price})</span>
                    </a>
                    
                    {/* Альтернативные ссылки */}
                    {item.alternativeLinks && item.alternativeLinks.map((link) => (
                      <a
                        key={link.store}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6 6m0 0l-6 6m6-6H3" />
                        </svg>
                        <span>{link.store === 'noon' ? 'Noon' : link.store}</span>
                        {link.price && <span className="text-xs opacity-75">({link.price})</span>}
                      </a>
                    ))}
                  </div>

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
                        <span>{t.unreserve}</span>
                      </>
                    ) : (
                      <>
                        <span>🎁</span>
                        <span>{t.reserveAction}</span>
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
