import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  const { url } = await request.json()  // Amazon wishlist URL

  // TODO: Cheerio scrape ASINs
  const items = []  // [{asin, title, price, img}]

  const short_id = nanoid(8)
  const { data, error } = await supabase
    .from('wishlists')
    .insert({ items, short_id })
    .select()
    .single()

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ short_id: data.short_id })
}