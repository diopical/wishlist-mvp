/**
 * Парсер для noon.com (UAE)
 * Извлекает информацию о товарах с noon.com
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

export interface NoonProduct {
  title: string
  price: string
  img: string
  url: string
  sku: string
  matchScore?: number  // Оценка соответствия 0-100
}

/**
 * Извлекает ключевые слова из названия товара
 */
function extractKeywords(title: string): string[] {
  // Удаляем размеры, цвета, специальные символы
  let cleaned = title
    .toLowerCase()
    .replace(/\b(new|used|refurbished|renewed)\b/gi, '')  // Состояние
    .replace(/\b\d+(\.\d+)?\s*(gb|tb|mb|kg|g|cm|mm|inch|"|')\b/gi, '')  // Размеры/вес
    .replace(/\b(black|white|red|blue|green|yellow|pink|purple|gray|silver|gold)\b/gi, '')  // Цвета
    .replace(/[^\w\s]/g, ' ')  // Спецсимволы
    .replace(/\s+/g, ' ')
    .trim()

  // Разбиваем на слова и фильтруем стоп-слова
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'pack', 'set', 'kit'])
  const words = cleaned.split(' ').filter(word => 
    word.length > 2 && !stopWords.has(word)
  )

  return words
}

/**
 * Извлекает бренд из названия товара
 */
function extractBrand(title: string): string | null {
  // Обычно бренд идет первым словом или в начале
  const commonBrands = [
    'funko', 'pop', 'lego', 'samsung', 'apple', 'sony', 'lg', 'philips',
    'nike', 'adidas', 'puma', 'reebok', 'converse',
    'logitech', 'razer', 'corsair', 'hyperx',
    'national', 'geographic', 'mattel', 'hasbro'
  ]
  
  const lowerTitle = title.toLowerCase()
  for (const brand of commonBrands) {
    if (lowerTitle.includes(brand)) {
      return brand
    }
  }
  
  // Попытка взять первое слово как бренд
  const firstWord = title.split(/[\s:,\-]/)[0]
  if (firstWord && firstWord.length > 2) {
    return firstWord.toLowerCase()
  }
  
  return null
}

/**
 * Очищает URL от параметров и мусора
 */
function cleanUrl(url: string): string {
  // Удаляем query параметры и фрагменты
  return url.split('?')[0].split('#')[0]
}

/**
 * Извлекает валюту из строки цены
 */
function extractCurrency(priceString: string): string {
  if (!priceString) return 'AED'
  
  // Ищем коды валют (английские коды)
  const currencyMatch = priceString.match(/\b(AED|USD|EUR|GBP|JPY|SAR|KWD|QAR|OMR|BHD)\b/i)
  if (currencyMatch) {
    return currencyMatch[1].toUpperCase()
  }
  
  // Ищем символы валют
  if (priceString.includes('$')) return 'USD'
  if (priceString.includes('€')) return 'EUR'
  if (priceString.includes('£')) return 'GBP'
  if (priceString.includes('¥')) return 'JPY'
  
  // Проверяем наличие любых символов > \u0600 (арабские/персидские символы)
  if (/[\u0600-\u06FF]/.test(priceString)) return 'AED'
  
  // По умолчанию для Noon (UAE) - AED
  return 'AED'
}

/**
 * Извлекает числовое значение цены из строки
 */
function extractPriceValue(priceString: string): number | null {
  if (!priceString) return null
  
  // Ищем первое число (целое или с десятичной точкой)
  // Используем более точное регулярное выражение
  const match = priceString.match(/\b(\d{1,6}(?:[.,]\d{2})?)\b/)
  if (match) {
    // Заменяем запятую на точку и конвертируем в число
    return parseFloat(match[1].replace(',', '.'))
  }
  
  return null
}

/**
 * Форматирует цену с валютой
 */
function formatPrice(priceString: string): string {
  if (!priceString) return 'N/A'
  
  // Очищаем строку от мусора (%, Off, etc)
  let cleaned = priceString
    .replace(/\b(Off|off|off$)/g, '')  // Удаляем "Off"
    .replace(/%.*$/g, '')  // Удаляем % и всё после неё
    .trim()
  
  const currency = extractCurrency(cleaned)
  const priceValue = extractPriceValue(cleaned)
  
  if (priceValue !== null) {
    // Форматируем до 2 знаков после точки
    const formattedPrice = priceValue.toFixed(2)
    return `${formattedPrice} ${currency}`
  }
  
  return priceString
}

/**
 * Вычисляет оценку соответствия двух товаров (0-100)
 */
function calculateMatchScore(
  amazonTitle: string,
  noonTitle: string,
  amazonPrice?: string,
  noonPrice?: string
): number {
  let score = 0

  // 1. Сравнение ключевых слов (макс 50 баллов)
  const amazonKeywords = extractKeywords(amazonTitle)
  const noonKeywords = extractKeywords(noonTitle)
  
  const matchedKeywords = amazonKeywords.filter(word => 
    noonKeywords.some(noonWord => 
      noonWord.includes(word) || word.includes(noonWord)
    )
  )
  
  const keywordMatchRatio = matchedKeywords.length / Math.max(amazonKeywords.length, 1)
  score += keywordMatchRatio * 50

  // 2. Сравнение брендов (макс 20 баллов)
  const amazonBrand = extractBrand(amazonTitle)
  const noonBrand = extractBrand(noonTitle)
  
  if (amazonBrand && noonBrand && amazonBrand === noonBrand) {
    score += 20
  } else if (amazonBrand && noonBrand) {
    // Частичное совпадение бренда
    if (amazonBrand.includes(noonBrand) || noonBrand.includes(amazonBrand)) {
      score += 10
    }
  }

  // 3. Сравнение цен (макс 30 баллов)
  if (amazonPrice && noonPrice) {
    const amazonValue = extractPriceValue(amazonPrice)
    const noonValue = extractPriceValue(noonPrice)
    
    if (amazonValue && noonValue) {
      const priceDiff = Math.abs(amazonValue - noonValue) / amazonValue
      // Если разница в цене меньше 50%, даем баллы
      if (priceDiff < 0.5) {
        score += (1 - priceDiff) * 30
      }
    }
  }

  console.log('[Match Score]', {
    amazonTitle: amazonTitle.substring(0, 50),
    noonTitle: noonTitle.substring(0, 50),
    score: Math.round(score),
    keywordMatches: matchedKeywords.length,
    totalKeywords: amazonKeywords.length,
    brandMatch: amazonBrand === noonBrand
  })

  return Math.round(score)
}

/**
 * Получает заголовки для запросов к noon.com
 */
export function getNoonHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  }
}

/**
 * Ищет товар на noon.com по названию
 * @param query - поисковый запрос (например, название товара)
 * @param amazonPrice - цена на Amazon для сравнения (опционально)
 * @param minMatchScore - минимальный порог соответствия (по умолчанию 40)
 * @returns объект с информацией о найденном товаре или null
 */
export async function searchNoonProduct(
  query: string, 
  amazonPrice?: string,
  minMatchScore: number = 40
): Promise<NoonProduct | null> {
  try {
    // Формируем URL для поиска на noon.com
    const searchUrl = `https://www.noon.com/uae-en/search?q=${encodeURIComponent(query)}`
    
    console.log('[Noon Parser] Поиск товара:', query)
    console.log('[Noon Parser] Amazon цена:', amazonPrice)
    console.log('[Noon Parser] URL:', searchUrl)

    const { data: html } = await axios.get(searchUrl, {
      headers: getNoonHeaders(),
      timeout: 15000
    })

    const $ = cheerio.load(html)

    // Собираем несколько кандидатов для сравнения
    const candidates: NoonProduct[] = []

    // Метод 1: через data-qa атрибуты
    $('[data-qa="product-name"]').each((index, el) => {
      if (index >= 5) return false  // Берем первые 5 результатов
      
      const productLink = $(el).closest('a')
      const productCard = $(el).closest('[data-qa], .productContainer, [class*="product"]')
      
      const title = $(el).text().trim()
      const href = productLink.attr('href') || ''
      const url = href.startsWith('http') ? href : `https://www.noon.com${href}`
      
      const skuMatch = url.match(/\/([A-Z0-9-]+)\/p\/?/)
      const sku = skuMatch ? skuMatch[1] : ''
      
      const priceElement = productCard.find('[data-qa="product-price"], [class*="price"]').first()
      const price = priceElement.text().trim()
      
      const imgElement = productCard.find('img').first()
      let img = imgElement.attr('src') || imgElement.attr('data-src') || ''
      if (img) {
        img = img.split('?')[0]
      }

      if (title && url) {
        const cleanedUrl = cleanUrl(url)
        const formattedPrice = formatPrice(price)
        const matchScore = calculateMatchScore(query, title, amazonPrice, price)
        candidates.push({ title, price: formattedPrice, img, url: cleanedUrl, sku, matchScore })
      }
    })

    // Метод 2: альтернативный поиск через ссылки на продукты
    if (candidates.length === 0) {
      $('a[href*="/p/"]').each((index, el) => {
        if (index >= 5) return false
        
        const href = $(el).attr('href') || ''
        if (!href.includes('/p/') || href.includes('/brand/')) return
        
        const url = href.startsWith('http') ? href : `https://www.noon.com${href}`
        const skuMatch = url.match(/\/([A-Z0-9-]+)\/p\/?/)
        const sku = skuMatch ? skuMatch[1] : ''
        
        const container = $(el).closest('div').parent()
        const title = container.find('h2, h3, [class*="title"], [class*="name"]').first().text().trim() || 
                     $(el).text().trim()
        
        if (!title || title.length < 5) return
        
        const price = container.find('[class*="price"]').first().text().trim() || 'Price not available'
        const img = (container.find('img').first().attr('src') || 
                    container.find('img').first().attr('data-src') || '').split('?')[0]

        const cleanedUrl = cleanUrl(url)
        const formattedPrice = formatPrice(price)
        const matchScore = calculateMatchScore(query, title, amazonPrice, price)
        candidates.push({ title, price: formattedPrice, img, url: cleanedUrl, sku, matchScore })
      })
    }

    console.log(`[Noon Parser] Найдено кандидатов: ${candidates.length}`)

    // Выбираем лучший результат
    if (candidates.length > 0) {
      // Сортируем по оценке соответствия
      candidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      
      const bestMatch = candidates[0]
      console.log('[Noon Parser] Лучшее совпадение:', {
        title: bestMatch.title.substring(0, 60),
        score: bestMatch.matchScore,
        price: bestMatch.price
      })

      // Проверяем минимальный порог
      if ((bestMatch.matchScore || 0) >= minMatchScore) {
        return bestMatch
      } else {
        console.log(`[Noon Parser] Оценка соответствия слишком низкая: ${bestMatch.matchScore} < ${minMatchScore}`)
        return null
      }
    }

    console.log('[Noon Parser] Товар не найден')
    return null

  } catch (error: any) {
    console.error('[Noon Parser] Ошибка поиска:', error.message)
    return null
  }
}

/**
 * Парсит страницу товара на noon.com
 * @param url - URL страницы товара
 */
export async function parseNoonProduct(url: string): Promise<NoonProduct | null> {
  try {
    console.log('[Noon Parser] Парсинг товара:', url)

    const { data: html } = await axios.get(url, {
      headers: getNoonHeaders(),
      timeout: 15000
    })

    const $ = cheerio.load(html)

    // Извлекаем SKU из URL
    const skuMatch = url.match(/\/([A-Z0-9-]+)\/p\/?/)
    const sku = skuMatch ? skuMatch[1] : ''

    // Ищем название
    const title = $('h1').first().text().trim() || 
                 $('[data-qa="product-name"]').first().text().trim() ||
                 $('meta[property="og:title"]').attr('content') || 
                 ''

    // Ищем цену
    const price = $('[data-qa="product-price"]').first().text().trim() ||
                 $('[class*="sellingPrice"]').first().text().trim() ||
                 $('meta[property="product:price:amount"]').attr('content') || 
                 'Price not available'

    // Ищем изображение
    const img = $('[data-qa="product-image"]').first().attr('src') ||
               $('meta[property="og:image"]').attr('content') || 
               ''

    if (title) {
      const cleanedUrl = cleanUrl(url)
      const formattedPrice = formatPrice(price)
      console.log('[Noon Parser] Товар распарсен:', { title, price: formattedPrice, sku })
      return {
        title,
        price: formattedPrice,
        img: img.split('?')[0],
        url: cleanedUrl,
        sku
      }
    }

    return null

  } catch (error: any) {
    console.error('[Noon Parser] Ошибка парсинга:', error.message)
    return null
  }
}
