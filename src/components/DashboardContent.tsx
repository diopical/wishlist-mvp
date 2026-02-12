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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка с профилем и выходом */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Мои вишлисты ({wishlists.length})
            </h1>
            <p className="text-gray-700 font-medium flex items-center gap-2">
              <span className="text-lg">👤</span>
              {userEmail}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="px-5 py-2.5 text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 rounded-xl transition font-semibold shadow-md hover:shadow-lg border border-blue-100"
            >
              👤 Профиль
            </a>
            <LogoutButton />
          </div>
        </div>

      {/* Форма создания нового вишлиста */}
      <CreateWishlistForm />

        {/* Список вишлистов */}
        {wishlists.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📚 Ваши вишлисты</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="bg-white border-2 border-gray-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-1 duration-300"
                >
                  {/* Превью товаров */}
                  {wishlist.items?.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 p-3 bg-gradient-to-br from-gray-50 to-blue-50">
                      {wishlist.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
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
                  )}

                  {/* Информация */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-3 line-clamp-1 text-gray-900">
                      {wishlist.destination || 'Без названия'}
                    </h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="font-semibold">🔑 ID:</span>
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{wishlist.short_id}</span>
                      </p>
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="font-semibold">📦 Товаров:</span>
                        <span className="font-bold text-blue-600">{wishlist.items?.length || 0}</span>
                      </p>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/wishlists/${wishlist.id}`)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 px-4 rounded-xl text-center transition-all font-semibold shadow-md hover:shadow-lg"
                      >
                        ✏️ Редактировать
                      </button>
                      <a
                        href={`/w/${wishlist.short_id}`}
                        target="_blank"
                        className="flex-1 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-800 py-2.5 px-4 rounded-xl text-center transition-all font-semibold shadow-md hover:shadow-lg"
                      >
                        🔗 Открыть
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200">
            <div className="text-7xl mb-6">🎁</div>
            <p className="text-2xl font-bold text-gray-800 mb-3">
              У вас пока нет вишлистов
            </p>
            <p className="text-gray-600 text-lg">
              Создайте свой первый вишлист, заполнив форму выше! 👆
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
