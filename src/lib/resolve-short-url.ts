import axios from 'axios'

/**
 * 🔗 Утилита для разрешения коротких ссылок Amazon
 * Поддерживает: a.co, amzn.to, amzn.eu, amzn.com, amzn.asia
 */
export async function resolveShortUrl(url: string): Promise<string> {
  // Проверяем, является ли это короткой ссылкой Amazon
  const shortDomains = ['a.co', 'amzn.to', 'amzn.eu', 'amzn.com', 'amzn.asia']
  const isShortUrl = shortDomains.some(domain => url.includes(domain))
  
  if (!isShortUrl) {
    return url // Обычная ссылка, возвращаем как есть
  }
  
  console.log(`🔄 Разрешаем короткую ссылку: ${url}`)
  
  try {
    // Делаем GET запрос с отключением автоматического следования редиректам
    const response = await axios.get(url, {
      maxRedirects: 0, // Останавливаемся на первом редиректе
      validateStatus: (status) => status >= 200 && status < 400,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    })
    
    // Если есть редирект, сразу получим location header
    let finalUrl = response.headers.location || response.config.url || url
    
    // В случае если это уже финальная страница (без редиректа)
    if (!finalUrl || finalUrl === url) {
      finalUrl = response.config.url || url
    }
    
    console.log(`✅ Разрешена короткая ссылка: ${url} -> ${finalUrl}`)
    
    // Если всё ещё является редиректом, пробуем ещё раз
    if (finalUrl.includes('amzn.') || finalUrl.includes('a.co')) {
      console.log(`🔄 Пробуем разрешить следующий уровень редиректа: ${finalUrl}`)
      const response2 = await axios.get(finalUrl, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      })
      finalUrl = response2.headers.location || response2.config.url || finalUrl
      console.log(`✅ Финальный URL: ${finalUrl}`)
    }
    
    return finalUrl
  } catch (error: any) {
    // Если получили редирект через ошибку (301/302), ловим его here
    if (error.response?.headers?.location) {
      const redirectUrl = error.response.headers.location
      console.log(`🔄 Редирект через ошибку: ${url} -> ${redirectUrl}`)
      
      // Рекурсивно разрешаем, если это снова редирект
      if (redirectUrl.includes('amzn.') || redirectUrl.includes('a.co')) {
        return resolveShortUrl(redirectUrl)
      }
      return redirectUrl
    }
    
    console.log(`⚠️ Ошибка разрешения короткой ссылки: ${error.message}`)
    return url // Возвращаем исходную ссылку как fallback
  }
}
