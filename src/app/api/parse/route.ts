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
            
            // 📝 Название - избегаем скидок и промо-блоков
            let title = $product('#productTitle').first().text().trim()
            if (!title) {
              title = $product('h1.product-title, h1 span.product-title-word-break').first().text().trim()
            }
            if (!title) {
              title = $product('[data-testid="product-title"]').first().text().trim()
            }
            // Обрезаем до первой скобки/запятой если слишком длинное
            title = title.replace(/\s*[\(|\[].+$/, '').slice(0, 120).trim() || 'N/A'
            
            // 💰 Цена - улучшенный парсинг с несколькими подходами
            let price = ''
            let currency = ''
            
            // Подход 1: целая цена + дробная часть
            const priceWhole = $product('.a-price[data-a-color="price"] .a-price-whole, .a-price .a-price-whole').first().text().trim()
            const priceFraction = $product('.a-price[data-a-color="price"] .a-price-fraction, .a-price .a-price-fraction').first().text().trim()
            const priceSymbol = $product('.a-price[data-a-color="price"] .a-price-symbol, .a-price .a-price-symbol').first().text().trim()
            
            if (priceWhole) {
              price = `${priceWhole}${priceFraction || ''}`
              currency = priceSymbol
            }
            
            // Подход 2: полная цена одним элементом
            if (!price) {
              const fullPrice = $product('.a-price[data-a-color="price"] .a-offscreen, #corePrice_feature_div .a-offscreen').first().text().trim()
              if (fullPrice) {
                // Извлекаем валюту и число: "AED 299.00" -> currency="AED", price="299.00"
                const match = fullPrice.match(/([A-Z]{3}|[€$£¥₹])\s*([\d,\.]+)/)
                if (match) {
                  currency = match[1]
                  price = match[2]
                } else {
                  // Если символ в конце: "299.00 AED"
                  const matchEnd = fullPrice.match(/([\d,\.]+)\s*([A-Z]{3}|[€$£¥₹])/)
                  if (matchEnd) {
                    price = matchEnd[1]
                    currency = matchEnd[2]
                  } else {
                    price = fullPrice.replace(/[^\d,\.]/g, '')
                    currency = fullPrice.replace(/[\d,\.\s]/g, '')
                  }
                }
              }
            }
            
            // Подход 3: старые селекторы (fallback)
            if (!price) {
              const oldWhole = $product('.price-whole, span[aria-hidden="true"].a-price-whole').first().text().trim()
              const oldFraction = $product('.price-fraction').first().text().trim()
              if (oldWhole) {
                price = `${oldWhole}${oldFraction || ''}`
                currency = $product('.price-symbol, .a-price-symbol').first().text().trim()
              }
            }
            
            // Очистка цены от лишних символов (оставляем только цифры, точки и запятые)
            price = price.replace(/\s+/g, '').replace(/,/g, '.') || 'N/A'
            
            // Определение валюты если еще не определена
            if (!currency && price !== 'N/A') {
              // Пробуем определить по домену
              const domain = new URL(productUrl).hostname
              if (domain.includes('.ae')) currency = 'AED'
              else if (domain.includes('.com')) currency = 'USD'
              else if (domain.includes('.co.uk')) currency = 'GBP'
              else if (domain.includes('.de') || domain.includes('.fr') || domain.includes('.es') || domain.includes('.it')) currency = 'EUR'
              else if (domain.includes('.in')) currency = 'INR'
              else if (domain.includes('.jp')) currency = 'JPY'
            }
            
            // Форматируем цену с валютой
            const priceWithCurrency = currency && price !== 'N/A' ? `${currency} ${price}` : price
            
            const img = $product('#landingImage, .a-dynamic-image, img[src*="images-amazon"], [data-a-image-primary]').first().attr('src') || ''

            if (title !== 'N/A' && asin) {
              // 🌍 Универсальный affiliate
              const domain = productUrl.includes('amazon.') ? new URL(productUrl).hostname : 'amazon.ae'
              items.push({ 
                asin, 
                title, 
                price: priceWithCurrency, 
                img, 
                url: productUrl,
                affiliate: `https://${domain}/dp/${asin}?tag=${TAG}` 
              })
              console.log(`✅ ${title.slice(0, 40)}... ${asin} - ${priceWithCurrency}`)
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
      .from('wishes')
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