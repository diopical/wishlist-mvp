import { createServerSupabase } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API для управления конкретным вишлистом
 * 
 * GET - получить вишлист
 * PUT - обновить название и/или айтемы
 * DELETE - удалить вишлист
 */

/**
 * GET /api/wishlists/[id]
 * Получает полную информацию о вишлисте
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15 params стал Promise
    const { id } = await params
    
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем вишлист по ID
    const { data: wishlist, error } = await supabase
      .from('wishes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Проверяем, что вишлист принадлежит пользователю
      .single()

    if (error) {
      console.error('Error fetching wishlist:', error)
      return NextResponse.json(
        { error: 'Вишлист не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(wishlist)
  } catch (error: any) {
    console.error('GET wishlist error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/wishlists/[id]
 * Обновляет вишлист (название и/или айтемы)
 * 
 * Body: { destination?: string, items?: Array }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15 params стал Promise
    const { id } = await params
    
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { destination, items } = body

    // Подготавливаем объект для обновления
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Обновляем только те поля, которые переданы
    if (destination !== undefined) {
      updateData.destination = destination
    }
    if (items !== undefined) {
      updateData.items = items
    }

    // Проверяем, что есть что обновлять
    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      )
    }

    // Обновляем вишлист
    const { data: wishlist, error } = await supabase
      .from('wishes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Проверяем владельца
      .select()
      .single()

    if (error) {
      console.error('Error updating wishlist:', error)
      return NextResponse.json(
        { error: 'Не удалось обновить вишлист', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Вишлист успешно обновлен',
      wishlist
    })
  } catch (error: any) {
    console.error('PUT wishlist error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wishlists/[id]
 * Удаляет вишлист
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15 params стал Promise
    const { id } = await params
    
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Удаляем вишлист
    const { error } = await supabase
      .from('wishes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Проверяем владельца

    if (error) {
      console.error('Error deleting wishlist:', error)
      return NextResponse.json(
        { error: 'Не удалось удалить вишлист', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Вишлист успешно удален'
    })
  } catch (error: any) {
    console.error('DELETE wishlist error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
