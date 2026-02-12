import { createServerSupabase } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { customAlphabet } from 'nanoid/non-secure'

// Генератор уникальных коротких ID для вишлистов
const nanoid = customAlphabet('0123456789abcdef', 8)

// Тег для партнерских ссылок Amazon
const TAG = 'your-affiliate-tag-123'

/**
 * POST /api/wishlists
 * 
 * Создает новый вишлист из Amazon URL
 * 
 * Процесс:
 * 1. Проверяет авторизацию пользователя
 * 2. Парсит Amazon URL и извлекает товары
 * 3. Создает запись в таблице `wishes` с привязкой к пользователю
 * 4. Возвращает short_id нового вишлиста
 * 
 * Body: { url: string, title: string }
 * Response: { short_id: string, items_count: number }
 */
export async function POST(req: NextRequest) {
  try {
    // Проверяем авторизацию
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Парсим данные запроса
    const body = await req.json()
    const { urls, title, event_type, event_date } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0 || !title) {
      return NextResponse.json(
        { error: 'Необходимо указать массив URLs и название вишлиста' },
        { status: 400 }
      )
    }

    console.log(`🔗 Creating wishlist: "${title}" from ${urls.length} URLs`)

    // Массив для спарсенных товаров
    const items: any[] = []
    const seenAsins = new Set<string>() // Для отслеживания дубликатов

    // Обрабатываем каждый URL
    for (const url of urls) {
      try {
        // Получаем HTML страницы Amazon
        const { data: html } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 15000
        })

        const $ = cheerio.load(html)

        // Извлекаем все ссылки на товары из вишлиста
        let productUrls = $(
          '.a-carousel-viewport a[href*="/dp/"], a[href*="/gp/product/"], .a-link-normal[href*="/dp/"], a[data-asin]'
        )
          .map((_, el) => {
            let href = $(el).attr('href') || $(el).attr('data-href')
            if (!href?.includes('http')) {
              href = `https://www.amazon.ae${href || ''}`
            }
            return href?.includes('/dp/') ? href : null
          })
          .get()
          .filter(Boolean)

        // Fallback: если это страница одного товара
        if (productUrls.length === 0) {
          const asin = url.match(/dp\/([A-Z0-9]{10})/)?.[1]
          if (asin) {
            productUrls = [`${url.includes('amazon.') ? url : `https://www.amazon.ae/dp/${asin}`}`]
          }
        }

        console.log(`🛒 URL: ${url}, найдено товаров: ${productUrls.length}`)

      // Парсим каждый товар (максимум 100)
      for (const productUrl of productUrls.slice(0, 100)) {
        if (items.length >= 100) break

        try {
          // Получаем страницу товара
          const { data: productHtml } = await axios.get(productUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
          })

          const $product = cheerio.load(productHtml)

          // Извлекаем ASIN (уникальный идентификатор товара Amazon)
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

          // Извлекаем изображение
          const img = $product(
            '#landingImage, .a-dynamic-image, img[src*="images-amazon"], [data-a-image-primary]'
          )
            .first()
            .attr('src') || ''

          // Если товар валидный и не дубликат, добавляем в список
          if (title !== 'N/A' && asin && !seenAsins.has(asin)) {
            seenAsins.add(asin) // Отмечаем ASIN как увиденный
            
            // Определяем домен Amazon для партнерской ссылки
            const domain = productUrl.includes('amazon.')
              ? new URL(productUrl).hostname
              : 'amazon.ae'

            items.push({
              asin,
              title,
              price: priceWithCurrency,
              img,
              url: productUrl,
              affiliate: `https://${domain}/dp/${asin}?tag=${TAG}`
            })

            console.log(`✅ Добавлен товар: ${title.slice(0, 40)}... - ${priceWithCurrency}`)
          } else if (seenAsins.has(asin)) {
            console.log(`⏭️ Пропущен дубликат: ${asin}`)
          }
        } catch (productError: any) {
          // Пропускаем товары, которые не удалось спарсить
          console.log(`⚠️ Ошибка парсинга товара: ${productUrl}`)
        }
      }
      } catch (urlError: any) {
        console.error(`❌ Ошибка загрузки URL ${url}: ${urlError.message}`)
        // Продолжаем со следующим URL вместо возврата ошибки
      }
    }

    // Проверяем, что спарсили хотя бы один товар
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось найти товары ни на одной из указанных страниц' },
        { status: 400 }
      )
    }

    // Генерируем уникальный short_id
    const short_id = nanoid()

    // Сохраняем вишлист в базу данных
    const { error: insertError } = await supabase
      .from('wishes')
      .insert({
        user_id: user.id,
        short_id,
        destination: title, // Название вишлиста
        items, // JSON с товарами
        event_type: event_type || null,
        event_date: event_date || null,
      })

    if (insertError) {
      console.error('❌ Ошибка сохранения в БД:', insertError)
      return NextResponse.json(
        { error: 'Ошибка сохранения вишлиста', details: insertError.message },
        { status: 500 }
      )
    }

    console.log(`🎉 Вишлист создан: ${short_id} (${items.length} товаров)`)

    return NextResponse.json({
      short_id,
      items_count: items.length,
      message: 'Вишлист успешно создан'
    })

  } catch (error: any) {
    console.error('💥 Ошибка создания вишлиста:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
