import axios from 'axios'

/**
 * 🔗 Утилита для разрешения коротких ссылок Amazon
 * Поддерживает: a.co, amzn.to, amzn.eu, amzn.com, amzn.asia
 */
export async function resolveShortUrl(url: string, maxRetries = 5): Promise<string> {
  // Проверяем, является ли это короткой ссылкой Amazon
  const shortDomains = ['a.co', 'amzn.to', 'amzn.eu', 'amzn.com', 'amzn.asia']
  const isShortUrl = shortDomains.some(domain => url.includes(domain))
  
  if (!isShortUrl) {
    return url // Обычная ссылка, возвращаем как есть
  }
  
  if (maxRetries <= 0) {
    console.log(`⚠️ Превышено максимальное количество редиректов для: ${url}`)
    return url
  }
  
  console.log(`🔄 Разрешаем короткую ссылку: ${url} (осталось попыток: ${maxRetries})`)
  
  try {
    const response = await axios.get(url, {
      maxRedirects: 0, // НЕ следовать редиректам автоматически
      validateStatus: () => true, // Не выбрасывать ошибку на ЛЮБОЙ статус
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    })
    
    const status = response.status
    console.log(`📊 Статус: ${status}`)
    
    // Если это редирект (3xx)
    if (status >= 300 && status < 400) {
      const locationHeader = response.headers.location
      if (locationHeader) {
        console.log(`📍 Редирект найден: ${url} -> ${locationHeader}`)
        
        // Рекурсивно разрешаем следующий URL
        return resolveShortUrl(locationHeader, maxRetries - 1)
      }
    }
    
    // Если это успешный ответ (2xx)
    if (status >= 200 && status < 300) {
      console.log(`✅ Финальный URL разрешен: ${url}`)
      return url
    }
    
    // Для других статусов тоже возвращаем текущий URL
    console.log(`⚠️ Неожиданный статус ${status} для URL: ${url}`)
    return url
    
  } catch (error: any) {
    console.log(`❌ Ошибка при разрешении ${url}: ${error.message}`)
    // В случае ошибки возвращаем исходный URL как fallback
    return url
  }
}
