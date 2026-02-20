import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * GET /api/wishlists/check-short-id?short_id=value&exclude=id
 * 
 * Проверяет доступность custom_short_id для использования
 * Используется при редактировании адреса вишлиста
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shortId = searchParams.get('short_id')
    const exclude = searchParams.get('exclude') // ID текущего вишлиста для исключения

    if (!shortId) {
      return NextResponse.json(
        { available: true },
        { status: 200 }
      )
    }

    // Ищем вишлист с таким custom_short_id
    let query = supabase
      .from('wishes')
      .select('id', { count: 'exact', head: true })
      .eq('custom_short_id', shortId)

    if (exclude) {
      query = query.neq('id', exclude)
    }

    const { count } = await query

    return NextResponse.json({
      available: count === 0
    })

  } catch (error: any) {
    console.error('Ошибка проверки short_id:', error)
    return NextResponse.json(
      { available: false },
      { status: 500 }
    )
  }
}
