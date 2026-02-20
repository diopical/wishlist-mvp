'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Интерфейс данных профиля пользователя
 */
interface ProfileData {
  first_name: string
  last_name: string
  phone: string
  birth_date: string
  username: string
  email: string
}

/**
 * Компонент формы редактирования профиля пользователя
 * 
 * Функциональность:
 * - Загружает текущие данные профиля при монтировании
 * - Позволяет редактировать имя, фамилию, телефон и дату рождения
 * - Email отображается только для чтения (управляется через Supabase Auth)
 * - Показывает состояния загрузки и ошибок
 * - Отображает сообщения об успехе/ошибке
 */
export default function ProfileForm() {
  const router = useRouter()
  
  // Состояние для данных формы
  const [formData, setFormData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    username: '',
    email: '',
  })

  // Состояния UI
  const [loading, setLoading] = useState(true) // Загрузка данных профиля
  const [saving, setSaving] = useState(false) // Сохранение изменений
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /**
   * Загружает данные профиля при монтировании компонента
   */
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile')
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить профиль')
        }

        const data = await response.json()
        setFormData(data)
      } catch (error) {
        console.error('Error loading profile:', error)
        setMessage({
          type: 'error',
          text: 'Ошибка загрузки профиля. Попробуйте обновить страницу.',
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  /**
   * Обработчик изменения значений в полях формы
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * Обработчик отправки формы
   * Отправляет PUT запрос на /api/profile для обновления данных
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          birth_date: formData.birth_date,
          username: formData.username,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении')
      }

      // Показываем сообщение об успехе
      setMessage({
        type: 'success',
        text: 'Профиль успешно обновлен!',
      })

      // Обновляем данные формы из ответа сервера
      if (data.profile) {
        setFormData((prev) => ({
          ...prev,
          ...data.profile,
        }))
      }

      // Автоматически скрываем сообщение через 3 секунды
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Не удалось сохранить изменения',
      })
    } finally {
      setSaving(false)
    }
  }

  // Показываем скелетон во время загрузки
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl">
            👤
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Мой профиль
          </h1>
        </div>

        {/* Сообщения об успехе/ошибке */}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email (только для чтения) */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed font-medium"
            />
            <p className="mt-2 text-sm text-gray-600">
              💡 Email управляется через настройки аутентификации
            </p>
          </div>

          {/* Username для публичной ссылки */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2">
              🔗 Username для публичных вишлистов
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="ваше_имя"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-blue-300"
              pattern="^[a-zA-Z0-9_-]{3,20}$"
              title="Только буквы, цифры, подчеркивание и дефис (3-20 символов)"
              maxLength={20}
            />
            <p className="mt-2 text-sm text-gray-600">
              💡 Используется в публичных ссылках: example.com/w/{formData.username}/wishlist
            </p>
          </div>
          <div>
            <label htmlFor="first_name" className="block text-sm font-semibold text-gray-800 mb-2">
              👤 Имя
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Введите ваше имя"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-300"
              maxLength={50}
            />
          </div>

          {/* Фамилия */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-semibold text-gray-800 mb-2">
              👥 Фамилия
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Введите вашу фамилию"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-300"
              maxLength={50}
            />
          </div>

          {/* Телефон */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2">
              📱 Телефон
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (999) 123-45-67"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-300"
              maxLength={20}
            />
          </div>

          {/* Дата рождения */}
          <div>
            <label htmlFor="birth_date" className="block text-sm font-semibold text-gray-800 mb-2">
              🎂 Дата рождения
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-gray-900 font-medium shadow-sm hover:border-gray-300"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {saving ? '💾 Сохранение...' : '💾 Сохранить изменения'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3.5 px-6 rounded-xl transition disabled:bg-gray-100 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              ← Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
