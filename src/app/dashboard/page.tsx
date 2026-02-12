import { createServerSupabase } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardContent from '../../components/DashboardContent'

/**
 * Страница dashboard пользователя
 * 
 * Server Component - загружает данные на сервере и проверяет авторизацию
 * Передает данные в клиентский компонент DashboardContent
 */
export default async function Dashboard() {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Проверяем авторизацию
  if (!user) {
    redirect('/')
  }

  // Загружаем вишлисты пользователя
  const { data: wishes, error: wishesError } = await supabase
    .from('wishes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const wishList = wishes || []

  // Рендерим клиентский компонент с данными
  return <DashboardContent wishlists={wishList} userEmail={user.email || ''} />
}