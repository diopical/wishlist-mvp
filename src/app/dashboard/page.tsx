import { createServerSupabase } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import LogoutButton from '../../components/LogoutButton'

export default async function Dashboard() {
  const supabase = await createServerSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()

  // Server-side debug removed; keep a minimal error check
  const sessionExists = !!session

  if (!session) {
    redirect('/')
  }

  // Load wishes server-side as before (session guaranteed)
  const { data: wishes, error: wishesError } = await supabase
    .from('wishes')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const wishList = wishes || []

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Wishlists ({wishList.length})</h1>
        <LogoutButton />
      </div>
      {wishList.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {wishList.map((wish: any) => (
            <div key={wish.id} className="p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">/{wish.short_id}</h3>
              <p className="text-gray-600 mb-2">
                {wish.destination || 'Подарок'}
              </p>
              <p className="mb-4">
                Товаров: <span className="font-bold">{wish.items?.length || 0}</span>
              </p>
              <a 
                href={`/w/${wish.short_id}`}
                className="w-full block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center transition"
              >
                Поделиться вишлистом
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-500 mb-4">
            Пока нет вишлистов
          </p>
          <p>Создайте на главной из Amazon!</p>
        </div>
      )}
    </div>
  )
}