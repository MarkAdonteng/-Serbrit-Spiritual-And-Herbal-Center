import type { ProductCategory } from '../types'

export const BRAND = {
  name: 'Serbrit Spiritual And Herbal Center',
  tagline: 'Natural Healing. Spiritual Balance.',
  colors: {
    black: '#000000',
    white: '#FFFFFF',
    green: '#1f5f3a',
    gold: '#c9a227',
  },
} as const

export const PRODUCT_CATEGORIES: ProductCategory[] = ['Herbal Medicine', 'Herbal Food', 'Spiritual Products']

