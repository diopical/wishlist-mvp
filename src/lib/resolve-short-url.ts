import axios from 'axios'
import { parserLogger } from './parser-logger'

/**
 * 📍 Получить реалистичные headers для запроса к Amazon
 */
export function getAmazonHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
  }
}

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
    parserLogger.warning(`Превышено максимальное количество редиректов для: ${url}`)
    return url
  }
  
  parserLogger.info(`Разрешаем короткую ссылку: ${url} (осталось попыток: ${maxRetries})`)
  
  try {
    const response = await axios.get(url, {
      maxRedirects: 0, // НЕ следовать редиректам автоматически
      validateStatus: () => true, // Не выбрасывать ошибку на ЛЮБОЙ статус
      headers: getAmazonHeaders(),
      timeout: 10000
    })
    
    const status = response.status
    parserLogger.info(`Статус: ${status}`)
    
    // Если это редирект (3xx)
    if (status >= 300 && status < 400) {
      const locationHeader = response.headers.location
      if (locationHeader) {
        parserLogger.info(`Редирект найден: ${url} -> ${locationHeader}`)
        
        // Рекурсивно разрешаем следующий URL
        return resolveShortUrl(locationHeader, maxRetries - 1)
      }
    }
    
    // Если это успешный ответ (2xx)
    if (status >= 200 && status < 300) {
      parserLogger.success(`Финальный URL разрешен: ${url}`)
      return url
    }
    
    // Для других статусов тоже возвращаем текущий URL
    parserLogger.warning(`Неожиданный статус ${status} для URL: ${url}`)
    return url
    
  } catch (error: any) {
    parserLogger.error(`Ошибка при разрешении ${url}: ${error.message}`)
    // В случае ошибки возвращаем исходный URL как fallback
    return url
  }
}
