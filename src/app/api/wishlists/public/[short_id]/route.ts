import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const EVENT_TYPE_TO_KEY: Record<string, string> = {
  'birthday': 'birthday',
  'new-year': 'new-year',
  'christmas': 'christmas',
  'wedding': 'wedding',
  'anniversary': 'anniversary',
  'valentines': 'valentines',
  'womens-day': 'womens-day',
  'mens-day': 'mens-day',
  'graduation': 'graduation',
  'baby-shower': 'baby-shower',
  'день рождения': 'birthday',
  'новый год': 'new-year',
  'рождество': 'christmas',
  'свадьба': 'wedding',
  'годовщина': 'anniversary',
  'день святого валентина': 'valentines',
  '8 марта': 'womens-day',
  '23 февраля': 'mens-day',
  'выпускной': 'graduation',
  'рождение ребенка': 'baby-shower',
  'birthday': 'birthday',
  'new year': 'new-year',
  'christmas': 'christmas',
  'wedding': 'wedding',
  'anniversary': 'anniversary',
  "valentine's day": 'valentines',
  "women's day": 'womens-day',
  "men's day": 'mens-day',
  'graduation': 'graduation',
  'baby shower': 'baby-shower'
}

const EVENT_TYPE_KEYS = new Set([
  'birthday',
  'new-year',
  'christmas',
  'wedding',
  'anniversary',
  'valentines',
  'womens-day',
  'mens-day',
  'graduation',
  'baby-shower'
])

const normalizeEventType = (eventType?: string | null) => (eventType || '').trim()

const resolveEventKey = (eventType?: string | null) => {
  const trimmed = normalizeEventType(eventType)
  const normalized = trimmed.toLowerCase()
  if (!normalized) return 'default'
  if (EVENT_TYPE_KEYS.has(normalized)) return normalized
  return EVENT_TYPE_TO_KEY[normalized] || 'default'
}

async function fetchThemeForEvent(eventType?: string | null) {
  try {
    const normalized = normalizeEventType(eventType)
    const eventKey = resolveEventKey(eventType)

    if (eventKey && eventKey !== 'default') {
      const { data } = await supabase
        .from('event_themes')
        .select('theme')
        .eq('event_key', eventKey)
        .eq('is_active', true)
        .maybeSingle()

      if (data?.theme) return data.theme
    }

    if (normalized) {
      const { data } = await supabase
        .from('event_themes')
        .select('theme')
        .eq('event_label', normalized)
        .eq('is_active', true)
        .maybeSingle()

      if (data?.theme) return data.theme
    }

    const { data } = await supabase
      .from('event_themes')
      .select('theme')
      .eq('event_key', 'default')
      .eq('is_active', true)
      .maybeSingle()

    return data?.theme || null
  } catch (error) {
    console.warn('Theme lookup failed:', error)
    return null
  }
}

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
      .select('items, destination, event_type, event_date, created_at, short_id, custom_short_id, require_name_for_reserve, user_id, language')
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
          .select('items, destination, event_type, event_date, created_at, short_id, custom_short_id, require_name_for_reserve, language')
          .or(`short_id.eq.${short_id},custom_short_id.eq.${short_id}`)
          .single()
      } else {
        query = supabase
          .from('wishes')
          .select('items, destination, event_type, event_date, created_at, short_id, custom_short_id, require_name_for_reserve, language')
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

    const theme = await fetchThemeForEvent(wishlist.event_type)

    // Возвращаем только публичные данные
    return NextResponse.json({
      short_id: wishlist.short_id,
      destination: wishlist.destination,
      items: wishlist.items || [],
      event_type: wishlist.event_type,
      event_date: wishlist.event_date,
      created_at: wishlist.created_at,
      require_name_for_reserve: wishlist.require_name_for_reserve || false,
      language: wishlist.language || 'en',
      theme
    })

  } catch (error: any) {
    console.error('Ошибка публичного получения вишлиста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
