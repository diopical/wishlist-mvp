export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name) cookies[name] = decodeURIComponent(value || '')
  })
  return cookies
}