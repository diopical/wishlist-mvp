import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import EditWishlist from '@/components/EditWishlist'

/**
 * Страница редактирования вишлиста
 * 
 * Server Component - проверяет авторизацию
 * Рендерит клиентский компонент EditWishlist
 */
export default async function EditWishlistPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  // В Next.js 15 params стал Promise, нужно await
  const { id } = await params
  
  // Проверяем авторизацию
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <EditWishlist wishlistId={id} />
    </div>
  )
}
