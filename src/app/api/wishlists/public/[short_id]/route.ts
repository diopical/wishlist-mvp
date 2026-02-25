import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * GET /api/wishlists/public/[short_id]
 * 
 * Получает вишлист по short_id БЕЗ авторизации
 * Поддерживает оба формата:
 * - /api/wishlists/public/{short_id}
 * - /api/wishlists/public/{short_id}?username={username}
 * 
 * Query params:
 * - username (optional): проверить что вишлист принадлежит этому пользователю
 * 
 * Возвращает:
 * - items (товары в вишлисте)
 * - destination (название вишлиста)
 * - event_type, event_date
 * 
 * НЕ возвращает:
 * - user_id
 * - id (внутренний ID)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ short_id: string }> }
) {
  try {
    const { short_id } = await params
    const { searchParams } = new URL(req.url)
    const usernameParam = searchParams.get('username')

    let query = supabase
      .from('wishes')
      .select('items, destination, event_type, event_date, created_at, short_id, custom_short_id, require_name_for_reserve, user_id')
      .or(`short_id.eq.${short_id},custom_short_id.eq.${short_id}`)
      .single()

    // Если передано username, проверяем что вишлист принадлежит этому пользователю
    if (usernameParam) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameParam)
        .single()

      if (!profile) {
        // Если username не найден, пытаемся найти по short_id/custom_short_id без привязки к пользователю
        // Это помогает старым вишлистам, у которых username еще не установлен
        query = supabase
          .from('wishes')
          .select('items, destination, event_type, event_date, created_at, short_id, custom_short_id, require_name_for_reserve')
          .or(`short_id.eq.${short_id},custom_short_id.eq.${short_id}`)
          .single()
      } else {
        query = supabase
          .from('wishes')
          .select('items, destination, event_type, event_date, created_at, short_id, custom_short_id, require_name_for_reserve')
          .or(`short_id.eq.${short_id},custom_short_id.eq.${short_id}`)
          .eq('user_id', profile.id)
          .single()
      }
    }

    const { data: wishlist, error } = await query

    if (error || !wishlist) {
      console.error('Ошибка получения вишлиста:', error)
      return NextResponse.json(
        { error: 'Вишлист не найден' },
        { status: 404 }
      )
    }

    // Возвращаем только публичные данные
    return NextResponse.json({
      short_id: wishlist.short_id,
      destination: wishlist.destination,
      items: wishlist.items || [],
      event_type: wishlist.event_type,
      event_date: wishlist.event_date,
      created_at: wishlist.created_at,
      require_name_for_reserve: wishlist.require_name_for_reserve || false
    })

  } catch (error: any) {
    console.error('Ошибка публичного получения вишлиста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
