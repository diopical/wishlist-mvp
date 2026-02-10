import { auth } from '@clerk/nextjs/server'

export default async function Dashboard() {
  const { userId } =await auth()
  
  if (!userId) {
    return <div>Не авторизован</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Мои списки желаний
          </h1>
          <div>Профиль</div>
        </div>
        
        <div className="grid gap-6">
          <a href="/lists/new" className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                ➕
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Новый список</h3>
              <p className="text-gray-600">День рождения, свадьба или просто желания</p>
            </div>
          </a>
          
          <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg text-center col-span-full">
            <p className="text-xl text-gray-500">📭 Пока пусто</p>
            <p className="text-gray-400 mt-2">Создай первый список желаний!</p>
          </div>
        </div>
      </div>
    </div>
  )
}