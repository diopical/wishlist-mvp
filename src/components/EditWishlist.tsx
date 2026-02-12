'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Интерфейс товара в вишлисте
 */
interface WishlistItem {
  asin: string
  title: string
  price: string
  img: string
  url: string
  affiliate: string
}

/**
 * Интерфейс данных вишлиста
 */
interface Wishlist {
  id: string
  short_id: string
  destination: string
  items: WishlistItem[]
  created_at: string
  updated_at: string
}

interface Props {
  wishlistId: string
}

/**
 * Компонент редактирования вишлиста
 * 
 * Функциональность:
 * - Редактирование названия вишлиста
 * - Просмотр списка товаров
 * - Редактирование полей товара (название, цена)
 * - Удаление товаров из вишлиста
 * - Удаление всего вишлиста
 */
export default function EditWishlist({ wishlistId }: Props) {
  const router = useRouter()
  
  // Состояния
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Состояние для редактирования названия
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  
  // Состояние для редактирования товаров
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [tempItems, setTempItems] = useState<WishlistItem[]>([])

  /**
   * Загружаем вишлист при монтировании
   */
  useEffect(() => {
    loadWishlist()
  }, [wishlistId])

  /**
   * Загрузка данных вишлиста
   */
  const loadWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`)
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить вишлист')
      }
      
      const data = await response.json()
      setWishlist(data)
      setTitle(data.destination || '')
      setTempItems(data.items || [])
    } catch (error: any) {
      console.error('Error loading wishlist:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Сохранение изменений названия
   */
  const saveTitle = async () => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Название не может быть пустым' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: title.trim() }),
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить название')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setEditingTitle(false)
      setMessage({ type: 'success', text: 'Название обновлено!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Сохранение изменений товаров
   */
  const saveItems = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: tempItems }),
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить товары')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setEditingItem(null)
      setMessage({ type: 'success', text: 'Изменения сохранены!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  /**
   * Удаление товара
   */
  const deleteItem = async (asin: string) => {
    if (!confirm('Удалить этот товар из вишлиста?')) return

    const newItems = tempItems.filter(item => item.asin !== asin)
    setTempItems(newItems)
    
    // Сразу сохраняем в БД
    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить товар')
      }

      const data = await response.json()
      setWishlist(data.wishlist)
      setMessage({ type: 'success', text: 'Товар удален!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      // Восстанавливаем товар в случае ошибки
      setTempItems(wishlist?.items || [])
    } finally {
      setSaving(false)
    }
  }

  /**
   * Удаление всего вишлиста
   */
  const deleteWishlist = async () => {
    if (!confirm('Вы уверены? Вишлист будет удален безвозвратно!')) return

    setSaving(true)
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить вишлист')
      }

      // Перенаправляем на dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  /**
   * Обновление поля товара во временном стейте
   */
  const updateItemField = (asin: string, field: keyof WishlistItem, value: string) => {
    setTempItems(prev =>
      prev.map(item =>
        item.asin === asin ? { ...item, [field]: value } : item
      )
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-3">⚠️ Ошибка загрузки</h2>
            <p className="mb-4 text-lg">{error || 'Вишлист не найден'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition"
            >
              ← Вернуться к списку
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold bg-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition border border-blue-100"
          >
            ← Назад к списку
          </button>
          
          <button
            onClick={deleteWishlist}
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition disabled:from-gray-400 disabled:to-gray-400 font-semibold shadow-md hover:shadow-lg"
          >
            🗑️ Удалить вишлист
          </button>
        </div>

        {/* Сообщения */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl shadow-md font-semibold ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-2 border-green-200'
                : 'bg-red-50 text-red-800 border-2 border-red-200'
            }`}
          >
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        {/* Название вишлиста */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">📝 Название вишлиста</h2>
          {editingTitle ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-semibold shadow-sm"
                maxLength={100}
              />
              <button
                onClick={saveTitle}
                disabled={saving}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition disabled:from-gray-400 disabled:to-gray-400 font-semibold shadow-md"
              >
                ✓ Сохранить
              </button>
              <button
                onClick={() => {
                  setEditingTitle(false)
                  setTitle(wishlist.destination)
                }}
                disabled={saving}
                className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition disabled:bg-gray-100 font-semibold shadow-md"
              >
                ✕ Отмена
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-black text-gray-900">{wishlist.destination}</h1>
              <button
                onClick={() => setEditingTitle(true)}
                className="px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-xl transition font-semibold"
              >
                ✏️ Редактировать
              </button>
            </div>
          )}
        
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <span>Short ID: <strong>{wishlist.short_id}</strong></span>
          <span>•</span>
          <span>Товаров: <strong>{tempItems.length}</strong></span>
          <span>•</span>
          <a
            href={`/w/${wishlist.short_id}`}
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            🔗 Публичная ссылка
          </a>
        </div>
      </div>

      {/* Список товаров */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Товары ({tempItems.length})</h2>
        
        {tempItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">В вишлисте пока нет товаров</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tempItems.map((item) => (
              <div
                key={item.asin}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
              >
                <div className="flex gap-4">
                  {/* Изображение */}
                  <div className="w-24 h-24 flex-shrink-0">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Информация */}
                  <div className="flex-1 min-w-0">
                    {editingItem === item.asin ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Название
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateItemField(item.asin, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Цена
                          </label>
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => updateItemField(item.asin, 'price', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveItems}
                            disabled={saving}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition disabled:bg-gray-400"
                          >
                            ✓ Сохранить
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(null)
                              setTempItems(wishlist.items)
                            }}
                            disabled={saving}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm transition"
                          >
                            ✕ Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-lg font-bold text-emerald-600 mb-2">
                          {item.price}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500">ASIN: {item.asin}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            🔗 Amazon
                          </a>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Действия */}
                  {editingItem !== item.asin && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setEditingItem(item.asin)}
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm transition"
                      >
                        ✏️ Изменить
                      </button>
                      <button
                        onClick={() => deleteItem(item.asin)}
                        disabled={saving}
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm transition disabled:text-gray-400"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
