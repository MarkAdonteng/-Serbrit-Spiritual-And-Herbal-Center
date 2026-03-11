/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import type { CartItem, Product } from '../types'

type CartState = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartState | null>(null)

const STORAGE_KEY = 'serbrit_cart_v1'

function clampQty(qty: number) {
  if (!Number.isFinite(qty)) return 1
  return Math.max(1, Math.floor(qty))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as CartItem[]
      if (Array.isArray(parsed)) setItems(parsed)
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const value = useMemo<CartState>(() => {
    const itemCount = items.reduce((sum, it) => sum + it.qty, 0)
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.product.price, 0)

    return {
      items,
      itemCount,
      subtotal,
      addItem: (product, qty = 1) => {
        const safeQty = clampQty(qty)
        setItems((prev) => {
          const existing = prev.find((p) => p.product._id === product._id)
          if (!existing) return [...prev, { product, qty: safeQty }]
          return prev.map((p) => (p.product._id === product._id ? { ...p, qty: p.qty + safeQty } : p))
        })
      },
      removeItem: (productId) => setItems((prev) => prev.filter((p) => p.product._id !== productId)),
      setQty: (productId, qty) => {
        const safeQty = clampQty(qty)
        setItems((prev) =>
          prev.map((p) => (p.product._id === productId ? { ...p, qty: safeQty } : p)),
        )
      },
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
