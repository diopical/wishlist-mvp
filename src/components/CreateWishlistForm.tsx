'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  /**
   * Валидация Amazon URL
   * Проверяет, что URL содержит amazon.* или является валидным wishlist/product URL
   */
  const validateUrl = (url: string): boolean => {
    if (!url) return false
    
    try {
      const urlObj = new URL(url)
      // Проверяем, что это Amazon URL
      if (!urlObj.hostname.includes('amazon.')) {
        return false
      }
      
      // Проверяем, что это wishlist или product URL
      return urlObj.pathname.includes('/wishlist/') || 
             urlObj.pathname.includes('/dp/') ||
             urlObj.pathname.includes('/gp/product/')
    } catch {
      return false
    }
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
      setError('Укажите название вишлиста')
      return
    }

    if (!validateUrl(url)) {
      setError('Введите корректный URL Amazon вишлиста или товара')
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
          url: url.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания вишлиста')
      }

      console.log('✅ Вишлист создан:', data)
      setSuccess(true)

      // Перезагружаем страницу для обновления списка вишлистов
      setTimeout(() => {
        router.refresh() // Используем router.refresh() вместо reload
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('Ошибка создания вишлиста:', error)
      setError(error.message || 'Не удалось создать вишлист')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Создать новый вишлист</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Поле названия */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название вишлиста *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="День рождения, Новый год, Мой вишлист..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading}
            maxLength={100}
          />
        </div>

        {/* Поле URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Amazon URL (вишлист или товар) *
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/hz/wishlist/ls/..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Вставьте ссылку на ваш Amazon вишлист или страницу товара
          </p>
        </div>

        {/* Сообщения об ошибках/успехе */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm font-medium shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border-2 border-green-200 text-green-800 rounded-xl text-sm font-medium shadow-sm">
            ✅ Вишлист успешно создан! Перезагружаем страницу...
          </div>
        )}

        {/* Кнопка создания */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Создаем вишлист...</span>
            </>
          ) : (
            <>
              <span className="text-xl">✨</span>
              <span>Создать вишлист</span>
            </>
          )}
        </button>
      </form>

      {/* Подсказка */}
      <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <p className="text-sm text-gray-800 leading-relaxed">
          <strong className="text-blue-700 text-base">💡 Как это работает:</strong>
          <br />
          <span className="block mt-2 space-y-1">
            <span className="block">1️⃣ Создайте вишлист на Amazon.com (или любом другом Amazon)</span>
            <span className="block">2️⃣ Скопируйте ссылку на ваш вишлист или на конкретный товар</span>
            <span className="block">3️⃣ Введите название и вставьте ссылку в форму</span>
            <span className="block">4️⃣ Мы автоматически создадим ваш красивый вишлист! 🎉</span>
          </span>
        </p>
      </div>
    </div>
  )
}
