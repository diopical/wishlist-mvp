'use client'

import { useRouter } from 'next/navigation'
import CreateWishlistForm from './CreateWishlistForm'
import LogoutButton from './LogoutButton'

/**
 * Интерфейс вишлиста
 */
interface Wishlist {
  id: string
  short_id: string
  destination: string
  items: any[]
  created_at: string
  event_type?: string
  event_date?: string
  custom_short_id?: string
  username?: string
  require_name_for_reserve?: boolean
}

interface Props {
  wishlists: Wishlist[]
  userEmail: string
}

/**
 * Клиентский компонент содержимого dashboard
 * 
 * Отображает:
 * - Форму создания нового вишлиста
 * - Список существующих вишлистов с кнопками управления
 */
export default function DashboardContent({ wishlists, userEmail }: Props) {
  const router = useRouter()

  /**
   * Генерирует публичную ссылку для вишлиста (относительный путь)
   * Всегда используем /share/ формат для единообразия
   */
  const getPublicUrl = (wishlist: Wishlist): string => {
    // Если есть username и custom_short_id, используем их
    if (wishlist.username && wishlist.custom_short_id) {
      return `/share/${wishlist.username}/${wishlist.custom_short_id}`
    }
    
    // Если есть только username, используем username + short_id
    if (wishlist.username) {
      return `/share/${wishlist.username}/${wishlist.short_id}`
    }
    
    // Если нет username, используем только short_id через /share/
    return `/share/${wishlist.custom_short_id || wishlist.short_id}`
  }

  /**
   * Обработка действия "Поделиться"
   */
  const handleShare = async (wishlist: Wishlist) => {
    const url = window.location.origin + getPublicUrl(wishlist)
    const shareData = {
      title: wishlist.destination || 'Мой вишлист',
      text: `Посмотрите мой вишлист "${wishlist.destination}"!`,
      url: url
    }

    try {
      // Проверяем поддержку Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback - копируем в буфер обмена
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована в буфер обмена!')
      }
    } catch (error) {
      // Пользователь отменил или произошла ошибка
      if ((error as Error).name !== 'AbortError') {
        // Пробуем просто скопировать в буфер обмена
        try {
          await navigator.clipboard.writeText(url)
          alert('Ссылка скопирована в буфер обмена!')
        } catch (clipboardError) {
          console.error('Share error:', error)
        }
      }
    }
  }

  const handleDeleteWishlist = async (id: string, name: string) => {
    if (!confirm(`Вы уверены? Вишлист "${name}" будет удален безвозвратно!`)) {
      return
    }

    try {
      const response = await fetch(`/api/wishlists/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить вишлист')
      }

      // Перезагружаем страницу для обновления списка
      router.refresh()
    } catch (error: any) {
      alert('Ошибка: ' + (error.message || 'Не удалось удалить вишлист'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      {/* Декоративные фоновые элементы */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Шапка с профилем и выходом */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 leading-tight">
              Мои вишлисты ✨
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Добро пожаловать</p>
                <p className="text-gray-900 font-semibold">{userEmail}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-purple-100">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-purple-600">{wishlists.length}</span>
              <span className="text-gray-600 text-sm">вишлистов</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="group px-6 py-3 bg-white hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 text-gray-700 hover:text-indigo-700 rounded-2xl transition-all font-semibold shadow-lg hover:shadow-xl border border-gray-100 hover:border-indigo-200 flex items-center gap-2 transform hover:scale-105"
            >
              <span className="group-hover:rotate-12 transition-transform">👤</span>
              Профиль
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* Список вишлистов */}
        {wishlists.length > 0 ? (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
              <span className="text-4xl">🎁</span>
              Ваши коллекции
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {wishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
                >
                  {/* Превью товаров */}
                  {wishlist.items?.length > 0 && (
                    <div className="relative h-48 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 overflow-hidden">
                      <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4">
                        {wishlist.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="relative bg-white rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                            {item.img ? (
                              <img
                                src={item.img}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl">
                                📦
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  )}

                  {/* Информация */}
                  <div className="p-6">
                    <h3 className="text-2xl font-black mb-4 line-clamp-2 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                      {wishlist.destination || 'Без названия'}
                    </h3>
                    
                    {/* Event info */}
                    {(wishlist.event_type || wishlist.event_date) && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                        {wishlist.event_type && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🎉</span>
                            <p className="text-sm font-bold text-purple-700">{wishlist.event_type}</p>
                          </div>
                        )}
                        {wishlist.event_date && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📅</span>
                            <p className="text-sm font-semibold text-gray-600">
                              {new Date(wishlist.event_date).toLocaleDateString('ru-RU', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg">
                          🔑
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Короткий ID</p>
                          <p className="font-mono font-bold text-gray-900">{wishlist.short_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-lg">
                          📦
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Товаров в списке</p>
                          <p className="text-2xl font-black bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">{wishlist.items?.length || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => router.push(`/wishlists/${wishlist.id}`)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-3 rounded-2xl text-center transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                        title="Редактировать вишлист"
                      >
                        <span>✏️</span>
                        <span className="hidden md:inline">Править</span>
                      </button>
                      <a
                        href={getPublicUrl(wishlist)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white py-3 px-3 rounded-2xl text-center transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                        title="Открыть публичную ссылку"
                      >
                        <span>🚀</span>
                        <span className="hidden md:inline">Открыть</span>
                      </a>
                      <button
                        onClick={() => handleShare(wishlist)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-3 rounded-2xl transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center text-sm"
                        title="Поделиться ссылкой"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={2}
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteWishlist(wishlist.id, wishlist.destination)}
                        className="bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600 text-white py-3 px-3 rounded-2xl transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center text-sm"
                        title="Удалить вишлист"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden text-center py-32 bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl shadow-2xl border border-gray-200">
            <div className="relative z-10">
              <div className="text-8xl mb-8 animate-bounce">🎁</div>
              <h3 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Начните свою коллекцию!
              </h3>
              <p className="text-gray-600 text-xl max-w-md mx-auto leading-relaxed">
                Создайте свой первый вишлист с помощью формы выше и поделитесь им с друзьями! ✨
              </p>
            </div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>
        )}

      {/* Форма создания нового вишлиста */}
      <div className="mt-16">
        <CreateWishlistForm />
      </div>
      </div>
    </div>
  )
}
