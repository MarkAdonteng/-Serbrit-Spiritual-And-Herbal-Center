import { createContext } from 'react'
import type { CartItem, Product } from '../../types'

export type CartState = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
}

export const CartContext = createContext<CartState | null>(null)

