import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import type { CartItem, Product } from '../../types'
import { CartContext } from './context'

const STORAGE_KEY = 'serbrit_cart_v1'

function clampQty(qty: number) {
  if (!Number.isFinite(qty)) return 1
  return Math.max(1, Math.floor(qty))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as CartItem[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      void 0
    }
  }, [items])

  const value = useMemo(() => {
    const itemCount = items.length
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.product.price, 0)

    return {
      items,
      itemCount,
      subtotal,
      addItem: (product: Product, qty = 1) => {
        const safeQty = clampQty(qty)
        setItems((prev) => {
          const existing = prev.find((p) => p.product._id === product._id)
          if (!existing) return [...prev, { product, qty: safeQty }]
          return prev.map((p) => (p.product._id === product._id ? { ...p, qty: p.qty + safeQty } : p))
        })
      },
      removeItem: (productId: string) => setItems((prev) => prev.filter((p) => p.product._id !== productId)),
      setQty: (productId: string, qty: number) => {
        const safeQty = clampQty(qty)
        setItems((prev) => prev.map((p) => (p.product._id === productId ? { ...p, qty: safeQty } : p)))
      },
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
