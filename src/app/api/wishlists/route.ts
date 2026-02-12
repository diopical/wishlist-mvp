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
    const { url, title } = body

    if (!url || !title) {
      return NextResponse.json(
        { error: 'Необходимо указать URL и название вишлиста' },
        { status: 400 }
      )
    }

    console.log(`🔗 Creating wishlist: "${title}" from ${url}`)

    // Массив для спарсенных товаров
    const items: any[] = []

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

      console.log(`🛒 Найдено товаров в вишлисте: ${productUrls.length}`)

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

          // Извлекаем название товара
          const title = $product(
            '#productTitle, h1 span, .a-size-large, [data-testid="product-title"]'
          )
            .first()
            .text()
            .trim()
            .slice(0, 120) || 'N/A'

          // Извлекаем цену (целая часть + дробная часть)
          const priceWhole = $product('.a-price-whole, .price-whole').first().text().trim()
          const priceFraction = $product('.a-price-fraction, .price-fraction').first().text().trim()
          const price = `${priceWhole || ''}${priceFraction || ''}`.trim() || 'N/A'

          // Извлекаем изображение
          const img = $product(
            '#landingImage, .a-dynamic-image, img[src*="images-amazon"], [data-a-image-primary]'
          )
            .first()
            .attr('src') || ''

          // Если товар валидный, добавляем в список
          if (title !== 'N/A' && asin) {
            // Определяем домен Amazon для партнерской ссылки
            const domain = productUrl.includes('amazon.')
              ? new URL(productUrl).hostname
              : 'amazon.ae'

            items.push({
              asin,
              title,
              price,
              img,
              url: productUrl,
              affiliate: `https://${domain}/dp/${asin}?tag=${TAG}`
            })

            console.log(`✅ Добавлен товар: ${title.slice(0, 40)}...`)
          }
        } catch (productError: any) {
          // Пропускаем товары, которые не удалось спарсить
          console.log(`⚠️ Ошибка парсинга товара: ${productUrl}`)
        }
      }
    } catch (urlError: any) {
      console.error(`❌ Ошибка загрузки URL: ${urlError.message}`)
      return NextResponse.json(
        { error: `Не удалось загрузить страницу: ${urlError.message}` },
        { status: 500 }
      )
    }

    // Проверяем, что спарсили хотя бы один товар
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось найти товары на указанной странице' },
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
