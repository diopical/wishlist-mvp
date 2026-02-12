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
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/wishlists/${wishlist.id}`)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-2xl text-center transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                      >
                        <span>✏️</span>
                        Править
                      </button>
                      <a
                        href={`/w/${wishlist.short_id}`}
                        target="_blank"
                        className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white py-3 px-4 rounded-2xl text-center transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                      >
                        <span>🚀</span>
                        Открыть
                      </a>
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
