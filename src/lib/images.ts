export const DEFAULT_PRODUCT_IMAGE_URL = '/default.jpg'

export function withDefaultImageUrl(url: string | null | undefined) {
  const safe = (url ?? '').trim()
  return safe ? safe : DEFAULT_PRODUCT_IMAGE_URL
}

