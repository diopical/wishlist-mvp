import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * POST /api/wishlists/public/[short_id]/reserve
 * 
 * Резервирует товар анонимно БЕЗ необходимости авторизации
 * Поддерживает оба формата:
 * - /api/wishlists/public/{short_id}/reserve
 * - /api/wishlists/public/{short_id}/reserve?username={username}
 * 
 * Body: { 
 *   asin: string,        // ASIN товара
 *   name?: string        // имя того, кто резервирует (опционально)
 * }
 * 
 * Query params:
 * - username (optional): проверить что вишлист принадлежит этому пользователю
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ short_id: string }> }
) {
  try {
    const { short_id } = await params
    const { searchParams } = new URL(req.url)
    const usernameParam = searchParams.get('username')
    
    const body = await req.json()
    const { asin, name = 'Anonymous' } = body

    if (!asin) {
      return NextResponse.json(
        { error: 'ASIN товара обязателен' },
        { status: 400 }
      )
    }

    // Если передано username, сначала проверяем пользователя
    let userId: string | undefined
    if (usernameParam) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameParam)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        )
      }
      userId = profile.id
    }

    // Получаем текущий вишлист
    let query = supabase
      .from('wishes')
      .select('items, require_name_for_reserve, user_id')
      .eq('short_id', short_id)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: wishlist, error: fetchError } = await query.single()

    if (fetchError || !wishlist) {
      return NextResponse.json(
        { error: 'Вишлист не найден' },
        { status: 404 }
      )
    }

    // Если требуется имя - проверяем что оно заполнено
    if (wishlist.require_name_for_reserve && (!name || name === 'Anonymous')) {
      return NextResponse.json(
        { error: 'Для резервирования товара требуется указать своё имя' },
        { status: 400 }
      )
    }

    // Обновляем статус резервирования товара по ASIN
    const updatedItems = (wishlist.items || []).map((item: any) => {
      if (item.asin === asin) {
        return {
          ...item,
          reserved: true,
          reserved_by: name,
          reserved_at: new Date().toISOString()
        }
      }
      return item
    })

    // Сохраняем обновленный список в БД
    const { error: updateError } = await supabase
      .from('wishes')
      .update({ items: updatedItems })
      .eq('short_id', short_id)

    if (updateError) {
      console.error('Ошибка обновления резервирования:', updateError)
      return NextResponse.json(
        { error: 'Ошибка сохранения резервирования' },
        { status: 500 }
      )
    }

    // Возвращаем обновленный список товаров
    return NextResponse.json({
      success: true,
      asin,
      reserved_by: name,
      message: 'Товар успешно зарезервирован'
    })

  } catch (error: any) {
    console.error('Ошибка резервирования:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
