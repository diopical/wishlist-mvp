import axios from 'axios'
import { parserLogger } from './parser-logger'

/**
 * 📍 Получить реалистичные headers для запроса к Amazon
 * Используется ротация User-Agent для избежания блокировок
 */
function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ]
  return agents[Math.floor(Math.random() * agents.length)]
}

export function getAmazonHeaders() {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Referer': 'https://www.amazon.com/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
  }
}

/**
 * 🔗 Утилита для разрешения коротких ссылок Amazon
 * Поддерживает: a.co, amzn.to, amzn.eu, amzn.com, amzn.asia
 * С retry логикой и поддержкой различных методов для Vercel
 */
export async function resolveShortUrl(url: string, maxRetries = 5, attempt = 1): Promise<string> {
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
  
  parserLogger.info(`Разрешаем короткую ссылку (попытка ${attempt}): ${url}`)
  
  try {
    // Небольшая задержка между попытками для избежания rate limit
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt - 1)))
    }

    const response = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: () => true,
      headers: getAmazonHeaders(),
      timeout: 15000
    })
    
    const status = response.status
    parserLogger.info(`Статус ответа: ${status} для ${url}`)
    
    // Если это редирект (3xx)
    if (status >= 300 && status < 400) {
      const locationHeader = response.headers.location
      if (locationHeader) {
        parserLogger.info(`Редирект найден: ${url} -> ${locationHeader}`)
        
        // Рекурсивно разрешаем следующий URL
        return resolveShortUrl(locationHeader, maxRetries - 1, attempt + 1)
      }
    }
    
    // Если это успешный ответ (2xx)
    if (status >= 200 && status < 300) {
      parserLogger.success(`Финальный URL разрешен: ${url} (попытка ${attempt})`)
      return url
    }
    
    // Если Amazon блокирует (429 Too Many Requests, 403 Forbidden)
    if ((status === 429 || status === 403) && maxRetries > 1) {
      parserLogger.warning(`Amazon блокирует (статус ${status}), повторяем с другим User-Agent...`)
      // Рекурсивно пробуем еще раз с другим User-Agent
      return resolveShortUrl(url, maxRetries - 1, attempt + 1)
    }
    
    // Для других статусов возвращаем текущий URL
    parserLogger.warning(`Неожиданный статус ${status} для URL: ${url}`)
    return url
    
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error'
    parserLogger.error(`Ошибка при разрешении ${url} (попытка ${attempt}): ${errorMessage}`)
    
    // Если есть еще попытки, пробуем еще раз
    if ((errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) && maxRetries > 1) {
      parserLogger.warning(`Сетевая ошибка, повторяем попытку ${attempt + 1}/${5 - maxRetries + 2}...`)
      return resolveShortUrl(url, maxRetries - 1, attempt + 1)
    }
    
    // В случае ошибки возвращаем исходный URL как fallback
    return url
  }
}
