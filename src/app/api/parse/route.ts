import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import cheerio from 'cheerio'
import axios from 'axios'

const TAG = 'diopical-21'  // Твой tag

export async function POST(req: NextRequest) {
  try {
    const { urls }: { urls: string[] } = await req.json()

    const items = []
    for (const url of urls.slice(0,10)) {
      const { data: html } = await axios.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      })
      const $ = cheerio.load(html)

      const asin = url.match(/dp\/([A-Z0-9]{10})/)?.[1] || ''
      const title = $('#productTitle, h1 span').text().trim().slice(0,100) || 'N/A'
      const price = $('.a-price-whole + .a-price-fraction').text().trim() || 'N/A'
      const img = $('#landingImage').attr('src') || ''

      const affiliate = `https://amazon.ae/dp/${asin}?tag=${TAG}`
      items.push({ asin, title, price, img, url: affiliate })
    }

    const short_id = nanoid(8)
    const { error } = await supabase.from('wishlists').insert({ items, short_id })

    if (error) throw error

    return NextResponse.json({ short_id })
  } catch (error) {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}