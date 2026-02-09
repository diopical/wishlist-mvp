import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import * as cheerio from 'cheerio'  // ← Named!
import axios from 'axios'

const TAG = 'diopical-21'

export async function POST(req: NextRequest) {
  try {
    const { urls }: { urls: string[] } = await req.json()
    const items = []

    for (const url of urls.slice(0,10)) {
      const { data: html } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const $ = cheerio.load(html)

      const asin = url.match(/dp\/([A-Z0-9]{10})/)?.[1] || ''
      const title = $('#productTitle, h1 span').text().trim().slice(0,100) || 'N/A'
      const price = $('.a-price-whole').text().trim() || 'N/A'
      const img = $('#landingImage').attr('src') || ''

      items.push({ asin, title, price, img, affiliate: `https://amazon.ae/dp/${asin}?tag=${TAG}` })
    }

    const short_id = nanoid(8)
    await supabase.from('wishlists').insert({ items, short_id })

    return NextResponse.json({ short_id })
  } catch (e) {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}