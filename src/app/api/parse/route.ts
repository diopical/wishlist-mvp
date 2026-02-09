import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import { customAlphabet } from 'nanoid/non-secure'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)
const nanoid = customAlphabet('0123456789abcdef', 8)
const TAG = 'your-affiliate-tag-123' // твой тег

export async function POST(req: NextRequest) {
  try {
    // 1. Читаем body
    const body = await req.text()
    console.log('📥 Body:', body)
    
    const { urls }: { urls: string[] } = JSON.parse(body)
    console.log('🔗 URLs:', urls)
    
    if (!urls?.length) {
      return NextResponse.json({ error: 'No URLs' }, { status: 400 })
    }

    // 2. Парсим товары (макс 10)
    const items: any[] = []
    for (const url of urls.slice(0, 10)) {
      try {
        console.log(`🕷️ Парсим: ${url}`)
        
        const { data: html } = await axios.get(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        })
        
        const $ = cheerio.load(html)
        const asin = url.match(/dp\/([A-Z0-9]{10})/)?.[1] || ''
        const title = $('#productTitle, h1 span, .a-size-large').text().trim().slice(0, 100) || 'N/A'
        const price = $('.a-price-whole, .a-price-symbol').text().trim() || 'N/A'
        const img = $('#landingImage, .a-dynamic-image').attr('src') || ''

        items.push({ 
          asin, 
          title, 
          price, 
          img, 
          affiliate: `https://amazon.ae/dp/${asin}?tag=${TAG}` 
        })
        console.log(`✅ ${title.slice(0, 30)}...`)
        
      } catch (urlError) {
        console.log(`❌ ${url}: ${urlError}`)
        items.push({ asin: '', title: `Error: ${url.slice(-30)}`, price: 'N/A', img: '' })
      }
    }

    // 3. Сохраняем в Supabase
    const short_id = nanoid()
    console.log('💾 Saving short_id:', short_id, 'items:', items.length)
    
    const { error } = await supabase
      .from('wishlists')
      .insert({ items, short_id })
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('🎉 Saved!')
    return NextResponse.json({ short_id })

  } catch (error: any) {
    console.error('💥 Full error:', error.message, error.stack)
    return NextResponse.json({ error: error.message || 'Parse failed' }, { status: 500 })
  }
}