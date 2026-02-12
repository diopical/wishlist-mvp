import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * API роут для работы с профилем пользователя
 * GET - получение данных профиля
 * PUT - обновление данных профиля
 */

/**
 * GET /api/profile
 * Получает данные профиля текущего пользователя из таблицы profiles
 * Возвращает: { first_name, last_name, phone, birth_date, email }
 */
export async function GET() {
  try {
    // Создаем клиент Supabase для серверных запросов
    const supabase = await createServerSupabase()
    
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Получаем данные профиля из таблицы profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, birth_date')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = запись не найдена, это нормально для нового пользователя
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Ошибка при получении профиля' },
        { status: 500 }
      )
    }

    // Возвращаем данные профиля вместе с email из auth
    return NextResponse.json({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      birth_date: profile?.birth_date || '',
      email: user.email || '',
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/profile:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile
 * Обновляет данные профиля пользователя в таблице profiles
 * Принимает: { first_name, last_name, phone, birth_date }
 * Возвращает: обновленные данные профиля или сообщение об ошибке
 */
export async function PUT(request: Request) {
  try {
    // Создаем клиент Supabase для серверных запросов
    const supabase = await createServerSupabase()
    
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Парсим данные из запроса
    const body = await request.json()
    const { first_name, last_name, phone, birth_date } = body

    // Валидация данных
    if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
      return NextResponse.json(
        { error: 'Неверный формат даты. Используйте YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Подготавливаем объект для обновления (только заполненные поля)
    const updateData: any = {
      id: user.id, // Нужен для upsert
      updated_at: new Date().toISOString(),
    }

    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (phone !== undefined) updateData.phone = phone
    if (birth_date !== undefined) updateData.birth_date = birth_date

    // Используем upsert - создаст запись если её нет, обновит если есть
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .upsert(updateData, { onConflict: 'id' })
      .select('first_name, last_name, phone, birth_date')
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Ошибка при обновлении профиля', details: updateError.message },
        { status: 500 }
      )
    }

    // Возвращаем обновленные данные
    return NextResponse.json({
      message: 'Профиль успешно обновлен',
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        birth_date: profile.birth_date,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Unexpected error in PUT /api/profile:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
