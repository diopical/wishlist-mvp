import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'

/**
 * Страница профиля пользователя
 * 
 * Server Component - проверяет авторизацию на сервере
 * Если пользователь не авторизован, перенаправляет на главную
 * Если авторизован, показывает форму редактирования профиля
 */
export default async function ProfilePage() {
  // Создаем серверный клиент Supabase
  const supabase = await createServerSupabase()
  
  // Проверяем, авторизован ли пользователь
  const { data: { user }, error } = await supabase.auth.getUser()

  // Если пользователь не авторизован, перенаправляем на главную страницу
  if (!user) {
    redirect('/')
  }

  // Рендерим клиентский компонент с формой
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <ProfileForm />
    </div>
  )
}
