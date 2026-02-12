import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * API для получения альтернативных изображений товара с Amazon
 * 
 * POST /api/images
 * Body: { url: string }
 * 
 * Возвращает массив URL изображений
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL не указан' }, { status: 400 })
    }

    // Запрашиваем страницу товара
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    })

    const $ = cheerio.load(html)
    const images: string[] = []

    // Ищем основное изображение
    const mainImage = $('#landingImage, .a-dynamic-image').first().attr('src')
    if (mainImage) {
      images.push(mainImage)
    }

    // Ищем миниатюры в карусели
    $('.imageThumbnail img, #altImages img, .item img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-old-hires') || $(el).attr('data-a-hires')
      if (src && !images.includes(src)) {
        // Пытаемся получить изображение в высоком разрешении
        const hiResSrc = src
          .replace(/\._.*?_\./, '.')  // Убираем размерные суффиксы
          .replace(/\/thumb\//, '/')  // Убираем thumb
        images.push(hiResSrc)
      }
    })

    // Ищем в data атрибутах
    $('[data-a-dynamic-image]').each((_, el) => {
      try {
        const data = $(el).attr('data-a-dynamic-image')
        if (data) {
          const imageData = JSON.parse(data)
          Object.keys(imageData).forEach(url => {
            if (!images.includes(url)) {
              images.push(url)
            }
          })
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    })

    // Убираем дубликаты и пустые строки
    const uniqueImages = Array.from(new Set(images.filter(Boolean)))

    // Ограничиваем до 10 изображений
    const limitedImages = uniqueImages.slice(0, 10)

    console.log(`✅ Найдено ${limitedImages.length} изображений для ${url}`)

    return NextResponse.json({ images: limitedImages })
  } catch (error: any) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: 'Не удалось загрузить изображения', details: error.message },
      { status: 500 }
    )
  }
}
