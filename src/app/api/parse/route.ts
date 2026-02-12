// src/app/api/parse/route.ts — БЕЗ ЛИМИТОВ + ЛЮБОЙ AMAZON
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import { customAlphabet } from 'nanoid/non-secure'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)
const nanoid = customAlphabet('0123456789abcdef', 8)
const TAG = 'your-affiliate-tag-123'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    console.log('📥 Body:', body)
    
    const { urls }: { urls: string[] } = JSON.parse(body)
    console.log('🔗 URLs:', urls)
    
    if (!urls?.length) {
      return NextResponse.json({ error: 'No URLs' }, { status: 400 })
    }

    const items: any[] = []

    for (const url of urls.slice(0, 10)) {  // 10 wishlist max
      try {
        console.log(`🕷️ Парсим: ${url}`)
        
        const { data: html } = await axios.get(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 15000
        })
        
        const $ = cheerio.load(html)

        // 🛒 Wishlist → ВСЕ product ссылки (без .slice!)
        let productUrls = $('.a-carousel-viewport a[href*="/dp/"], a[href*="/gp/product/"], .a-link-normal[href*="/dp/"], a[data-asin]').map((_, el) => {
          let href = $(el).attr('href') || $(el).attr('data-href')
          if (!href?.includes('http')) href = `https://www.amazon.ae${href || ''}`
          return href?.includes('/dp/') ? href : null
        }).get().filter(Boolean)

        // 📱 Product page fallback
        if (productUrls.length === 0) {
          const asin = url.match(/dp\/([A-Z0-9]{10})/)?.[1]
          if (asin) productUrls = [`${url.includes('amazon.') ? url : `https://www.amazon.ae/dp/${asin}`}`]
        }

        console.log(`🛒 Найдено товаров: ${productUrls.length}`)

        // ✨ Парсим ВСЕ товары (max 100)
        for (const productUrl of productUrls.slice(0, 100)) {
          if (items.length >= 100) break  // защита
          
          try {
            const { data: productHtml } = await axios.get(productUrl, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, 
              timeout: 10000 
            })
            const $product = cheerio.load(productHtml)
            
            const asin = productUrl.match(/dp\/([A-Z0-9]{10})/)?.[1] || ''
            const title = $product('#productTitle, h1 span, .a-size-large, [data-testid="product-title"]').first().text().trim().slice(0, 120) || 'N/A'
            
            // 💰 Цена (whole + fraction)
            const priceWhole = $product('.a-price-whole, .price-whole').first().text().trim()
            const priceFraction = $product('.a-price-fraction, .price-fraction').first().text().trim()
            const price = `${priceWhole || ''}${priceFraction || ''}`.trim() || 'N/A'
            
            const img = $product('#landingImage, .a-dynamic-image, img[src*="images-amazon"], [data-a-image-primary]').first().attr('src') || ''

            if (title !== 'N/A' && asin) {
              // 🌍 Универсальный affiliate
              const domain = productUrl.includes('amazon.') ? new URL(productUrl).hostname : 'amazon.ae'
              items.push({ 
                asin, 
                title, 
                price, 
                img, 
                url: productUrl,
                affiliate: `https://${domain}/dp/${asin}?tag=${TAG}` 
              })
              console.log(`✅ ${title.slice(0, 40)}... ${asin}`)
            }
          } catch (productError: any) {
            // Тихо пропускаем битые товары
          }
        }

      } catch (urlError: any) {
        console.log(`❌ ${url.slice(0, 80)}...: ${urlError.message}`)
        items.push({ asin: '', title: `Error: ${url.slice(-60)}`, price: 'N/A', img: '' })
      }
    }

    const short_id = nanoid()
    console.log('💾 Saving:', short_id, items.length, 'товаров')
    
    const { error } = await supabase
      .from('wishlists')
      .insert({ items, short_id })
    
    if (error) {
      console.error('❌ Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('🎉 Saved! Всего товаров:', items.length)
    return NextResponse.json({ short_id })

  } catch (error: any) {
    console.error('💥 Full ERROR:', error.message)
    return NextResponse.json({ error: error.message || 'Parse failed' }, { status: 500 })
  }
}