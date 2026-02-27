'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_LANGUAGE,
  EVENT_TYPES,
  LANGUAGE_OPTIONS,
  getEventOptionLabel,
  type Language
} from '@/lib/i18n'

/**
 * Компонент формы создания нового вишлиста
 * 
 * Функциональность:
 * - Ввод названия вишлиста
 * - Ввод URL Amazon вишлиста или страницы товара
 * - Отправка на парсинг и создание вишлиста
 * - Отображение состояний загрузки и ошибок
 * - Автоматический редирект на страницу редактирования после создания
 */
export default function CreateWishlistForm() {
  const router = useRouter()
  
  // Состояния формы
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [eventType, setEventType] = useState('')
  const [customEvent, setCustomEvent] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Популярные типы событий
  const eventTypes = EVENT_TYPES
  
  /**
   * Валидация Amazon URL
   * Проверяет, что URL содержит amazon.* или является валидным wishlist/product URL
   * Также поддерживает короткие ссылки Amazon (a.co, amzn.to и т.д.)
   */
  const validateUrls = (urls: string[]): boolean => {
    if (!urls || urls.length === 0) return false
    
    // Список доменов-шортенеров Amazon
    const shortDomains = ['a.co', 'amzn.to', 'amzn.eu', 'amzn.com', 'amzn.asia']
    
    // Проверяем каждый URL
    for (const url of urls) {
      try {
        const urlObj = new URL(url.trim())
        const hostname = urlObj.hostname
        
        // Проверяем, что это Amazon URL (обычный или короткий)
        const isAmazonShort = shortDomains.some(domain => hostname.includes(domain))
        const isAmazonFull = hostname.includes('amazon.')
        
        if (!isAmazonShort && !isAmazonFull) {
          return false
        }
        
        // Если это короткая ссылка, она валидна (редирект разрешится на бэке)
        if (isAmazonShort) {
          continue
        }
        
        // Для полных Amazon ссылок проверяем паттерны
        const isValid = urlObj.pathname.includes('/wishlist/') || 
               urlObj.pathname.includes('/dp/') ||
               urlObj.pathname.includes('/gp/product/')
        
        if (!isValid) return false
      } catch {
        return false
      }
    }
    
    return true
  }

  /**
   * Обработчик отправки формы
   * Отправляет POST запрос на /api/wishlists для создания вишлиста
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Валидация
    if (!title.trim()) {
      setError('Please enter a wishlist title')
      return
    }

    // Парсим URLs из textarea (по строкам)
    const urls = url.split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urls.length === 0) {
      setError('Add at least one Amazon product or wishlist link')
      return
    }

    if (!validateUrls(urls)) {
      setError('All links must be valid Amazon URLs (products or wishlists)')
      return
    }

    if (eventType === 'other' && !customEvent.trim()) {
      setError('Please enter a custom event name')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          urls: urls,
          event_type: eventType === 'other' ? customEvent.trim() : (eventType || null),
          event_date: eventDate || null,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wishlist')
      }

      console.log('✅ Wishlist created:', data)
      setSuccess(true)

      // Перезагружаем страницу для обновления списка вишлистов
      setTimeout(() => {
        router.refresh() // Используем router.refresh() вместо reload
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('Error creating wishlist:', error)
      setError(error.message || 'Failed to create wishlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-12 border border-gray-200 overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
            ✨
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create a new wishlist
            </h2>
          </div>
        </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Поле названия */}
          <div className="group">
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <span>🎯</span>
              Wishlist title
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My gift list"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Поле типа события */}
          <div className="group">
            <label htmlFor="event-type" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <span>🎉</span>
              Event type
            </label>
            <select
              id="event-type"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value)
                if (e.target.value !== 'other') {
                  setCustomEvent('')
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm appearance-none cursor-pointer"
              disabled={loading}
            >
              <option value="">Choose an event type (optional)</option>
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {getEventOptionLabel(type.value, 'en')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Поле для своего варианта события */}
        {eventType === 'other' && (
          <div className="group animate-fadeIn">
            <label htmlFor="custom-event" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <span>✏️</span>
              Custom event name
            </label>
            <input
              type="text"
              id="custom-event"
              value={customEvent}
              onChange={(e) => setCustomEvent(e.target.value)}
              placeholder="For example: Housewarming, Company anniversary..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm"
              disabled={loading}
              maxLength={50}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Поле даты события */}
          <div className="group">
            <label htmlFor="event-date" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <span>📅</span>
              Event date
            </label>
            <input
              type="date"
              id="event-date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm"
              disabled={loading}
            />
          </div>
        </div>

        {/* Поле URLs */}
        <div className="group">
          <label htmlFor="url" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <span>🔗</span>
            Amazon links (wishlists or products)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/dp/B08N5WRWNW&#x0a;https://www.amazon.com/hz/wishlist/ls/...&#x0a;https://www.amazon.ae/dp/B0CX2LWHLL"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm font-mono text-sm resize-y min-h-[100px]"
            disabled={loading}
            rows={4}
          />
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span>💡</span>
            One link per line. You can mix product and wishlist URLs.
          </p>
        </div>

      <div className="group">
        <label htmlFor="language" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <span>🌐</span>
          Public page language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 font-medium bg-white shadow-sm appearance-none cursor-pointer"
          disabled={loading}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <span>💡</span>
          The public link opens in this language by default.
        </p>
      </div>

        {/* Сообщения об ошибках/успехе */}
        {error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-800 rounded-xl text-sm font-semibold shadow-lg animate-shake flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 rounded-xl text-sm font-semibold shadow-lg flex items-start gap-3">
            <span className="text-xl flex-shrink-0 animate-bounce">✅</span>
            <span>Wishlist created! Reloading...</span>
          </div>
        )}

        {/* Кнопка создания */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98] text-base"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating your wishlist...</span>
            </>
          ) : (
            <>
              <span className="text-xl">🎉</span>
              <span>Create wishlist</span>
            </>
          )}
        </button>
      </form>
      </div>
    </div>
  )
}
