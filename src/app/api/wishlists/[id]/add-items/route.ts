import { createServerSupabase } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { resolveShortUrl, getAmazonHeaders } from '@/lib/resolve-short-url'
import { parserLogger } from '@/lib/parser-logger'

const TAG = 'your-affiliate-tag-123'

/**
 * POST /api/wishlists/[id]/add-items
 * 
 * Добавляет новые товары в существующий вишлист
 * Автоматически игнорирует дубликаты по ASIN
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    parserLogger.info(`Добавление товаров в вишлист: ${id}`)
    
    // Проверяем авторизацию
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      parserLogger.error('Ошибка авторизации')
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Получаем данные запроса
    const body = await req.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      parserLogger.error('Нет URL в запросе')
      return NextResponse.json(
        { error: 'Необходимо указать массив URLs' },
        { status: 400 }
      )
    }

    // Загружаем текущий вишлист
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (wishlistError || !wishlist) {
      parserLogger.error('Вишлист не найден')
      return NextResponse.json(
        { error: 'Вишлист не найден' },
        { status: 404 }
      )
    }

    // Получаем существующие ASIN для проверки дубликатов
    const existingAsins = new Set(
      (wishlist.items || []).map((item: any) => item.asin)
    )

    parserLogger.info(`Существующих товаров в вишлисте: ${existingAsins.size}`)

    // Массив для новых товаров
    const newItems: any[] = []
    let duplicatesCount = 0

    // Обрабатываем каждый URL
    for (const url of urls) {
      try {
        parserLogger.info(`Обработка URL: ${url}`)
        // 🔗 Разрешаем короткие ссылки перед парсингом
        const resolvedUrl = await resolveShortUrl(url)
        
        const { data: html } = await axios.get(resolvedUrl, {
          headers: getAmazonHeaders(),
          timeout: 15000
        })

        const $ = cheerio.load(html)

        // Извлекаем ссылки на товары (специфичные селекторы для wishlist)
        let productUrls = $(
          // Товары в основном вишлисте
          '[data-item-index] a[href*="/dp/"], ' +
          '.g-item-sortable a[href*="/dp/"], ' +
          // Карусель товаров  
          '.a-carousel-viewport a[href*="/dp/"], ' +
          // Fallback для других страниц товаров
          'main a[href*="/dp/"]'
        )
          .not('[data-component-type="s-search-result"]') // Исключаем результаты поиска
          .not('.g-show-more-list a') // Исключаем "показать еще"
          .not('[data-feature-name="dp_feature_div"]') // Исключаем связанные товары
          .map((_, el) => {
            let href = $(el).attr('href') || $(el).attr('data-href')
            if (!href?.includes('http')) {
              // Получаем домен из разрешенного URL
              const domain = resolvedUrl.includes('amazon.') ? new URL(resolvedUrl).hostname : 'amazon.ae'
              href = `https://${domain}${href || ''}`
            }
            return href?.includes('/dp/') ? href : null
          })
          .get()
          .filter(Boolean)

        // Fallback для страницы товара
        if (productUrls.length === 0) {
          const asin = resolvedUrl.match(/dp\/([A-Z0-9]{10})/)?.[1]
          if (asin) {
            const domain = resolvedUrl.includes('amazon.') ? new URL(resolvedUrl).hostname : 'amazon.ae'
            productUrls = [`https://${domain}/dp/${asin}`]
          }
        }

        parserLogger.info(`Обработка URL: ${url}, найдено товаров: ${productUrls.length}`)

        // Парсим каждый товар
        for (const productUrl of productUrls.slice(0, 100)) {
          if (newItems.length >= 100) break

          try {
            const { data: productHtml } = await axios.get(productUrl, {
              headers: getAmazonHeaders(),
              timeout: 10000
            })

            const $product = cheerio.load(productHtml)

            const asin = productUrl.match(/dp\/([A-Z0-9]{10})/)?.[1] || ''

            // Проверяем дубликат
            if (existingAsins.has(asin)) {
              duplicatesCount++
              parserLogger.warning(`Пропущен дубликат товара: ${asin}`)
              continue
            }

            // Парсим название
            let title = $product('#productTitle').first().text().trim()
            if (!title) {
              title = $product('h1.product-title, h1 span.product-title-word-break').first().text().trim()
            }
            if (!title) {
              title = $product('[data-testid="product-title"]').first().text().trim()
            }
            title = title.replace(/\s*[\(|\[].+$/, '').slice(0, 120).trim() || 'N/A'

            // Парсим цену
            let price = ''
            let currency = ''

            const priceWhole = $product('.a-price[data-a-color="price"] .a-price-whole, .a-price .a-price-whole').first().text().trim()
            const priceFraction = $product('.a-price[data-a-color="price"] .a-price-fraction, .a-price .a-price-fraction').first().text().trim()
            const priceSymbol = $product('.a-price[data-a-color="price"] .a-price-symbol, .a-price .a-price-symbol').first().text().trim()

            if (priceWhole) {
              price = `${priceWhole}${priceFraction || ''}`
              currency = priceSymbol
            }

            if (!price) {
              const fullPrice = $product('.a-price[data-a-color="price"] .a-offscreen, #corePrice_feature_div .a-offscreen').first().text().trim()
              if (fullPrice) {
                const match = fullPrice.match(/([A-Z]{3}|[€$£¥₹])\s*([\d,\.]+)/)
                if (match) {
                  currency = match[1]
                  price = match[2]
                } else {
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

            if (!price) {
              const oldWhole = $product('.price-whole, span[aria-hidden="true"].a-price-whole').first().text().trim()
              const oldFraction = $product('.price-fraction').first().text().trim()
              if (oldWhole) {
                price = `${oldWhole}${oldFraction || ''}`
                currency = $product('.price-symbol, .a-price-symbol').first().text().trim()
              }
            }

            price = price.replace(/\s+/g, '').replace(/,/g, '.') || 'N/A'

            if (!currency && price !== 'N/A') {
              const domain = new URL(productUrl).hostname
              if (domain.includes('.ae')) currency = 'AED'
              else if (domain.includes('.com')) currency = 'USD'
              else if (domain.includes('.co.uk')) currency = 'GBP'
              else if (domain.includes('.de') || domain.includes('.fr') || domain.includes('.es') || domain.includes('.it')) currency = 'EUR'
              else if (domain.includes('.in')) currency = 'INR'
              else if (domain.includes('.jp')) currency = 'JPY'
            }

            const priceWithCurrency = currency && price !== 'N/A' ? `${currency} ${price}` : price

            const img = $product(
              '#landingImage, .a-dynamic-image, img[src*="images-amazon"], [data-a-image-primary]'
            )
              .first()
              .attr('src') || ''

            if (title !== 'N/A' && asin) {
              const domain = productUrl.includes('amazon.')
                ? new URL(productUrl).hostname
                : 'amazon.ae'

              newItems.push({
                asin,
                title,
                price: priceWithCurrency,
                img,
                url: productUrl,
                affiliate: `https://${domain}/dp/${asin}?tag=${TAG}`
              })

              existingAsins.add(asin) // Добавляем в set чтобы не добавить повторно
              console.log(`✅ Новый товар: ${title.slice(0, 40)}... - ${priceWithCurrency}`)
            }
          } catch (productError: any) {
            console.log(`⚠️ Ошибка парсинга товара: ${productUrl}`)
          }
        }
      } catch (urlError: any) {
        console.error(`❌ Ошибка загрузки URL ${url}: ${urlError.message}`)
      }
    }

    if (newItems.length === 0) {
      return NextResponse.json({
        added_count: 0,
        duplicates_count: duplicatesCount,
        message: duplicatesCount > 0 ? 'Все товары уже есть в списке' : 'Не удалось найти новые товары'
      })
    }

    // Обновляем вишлист - добавляем новые товары к существующим
    const updatedItems = [...wishlist.items, ...newItems]

    const { error: updateError } = await supabase
      .from('wishes')
      .update({ items: updatedItems })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Ошибка обновления вишлиста:', updateError)
      return NextResponse.json(
        { error: 'Ошибка сохранения товаров' },
        { status: 500 }
      )
    }

    console.log(`🎉 Добавлено ${newItems.length} товаров, пропущено ${duplicatesCount} дубликатов`)

    return NextResponse.json({
      added_count: newItems.length,
      duplicates_count: duplicatesCount,
      message: 'Товары успешно добавлены'
    })

  } catch (error: any) {
    console.error('💥 Ошибка добавления товаров:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
