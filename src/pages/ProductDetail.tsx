/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { formatCurrency } from '../lib/format'
import { withDefaultImageUrl } from '../lib/images'
import type { Product } from '../types'
import { useCart } from '../context/cart/useCart'
import { Button, Input, Panel } from '../components/ui'

export function ProductDetailPage() {
  const { id } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const productId = useMemo(() => id ?? '', [id])

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    setError(null)
    api.products
      .get(productId)
      .then((p) => setProduct(p))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load product'))
      .finally(() => setLoading(false))
  }, [productId])

  if (!productId) {
    return <Panel className="p-6 text-sm text-white/70">Missing product id.</Panel>
  }

  if (loading) return <Panel className="p-6 text-sm text-white/70">Loading product…</Panel>
  if (error) return <Panel className="p-6 text-sm text-white/70">{error}</Panel>
  if (!product) return <Panel className="p-6 text-sm text-white/70">Product not found.</Panel>

  return (
    <div className="grid gap-6">
      <div className="text-sm text-white/60">
        <Link to="/shop" className="hover:text-white">
          Shop
        </Link>{' '}
        <span className="text-white/30">/</span> <span className="text-white/80">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <div className="aspect-square bg-white/5">
            <img src={withDefaultImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
          </div>
        </Panel>

        <div className="grid content-start gap-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">{product.category}</div>
            <h1 className="mt-2 text-3xl font-extrabold">{product.name}</h1>
            <div className="mt-3 text-2xl font-black text-[#c9a227]">{formatCurrency(product.price)}</div>
          </div>

          <Panel className="p-5">
            <div className="text-sm text-white/70">{product.description}</div>
          </Panel>

          <div className="grid gap-3">
            <div className="flex items-end gap-3">
              <div className="w-28">
                <div className="text-xs font-semibold text-white/60">Quantity</div>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                />
              </div>
              <div className="text-xs text-white/50">In stock: {product.stockQty}</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="gold"
                className="w-full sm:w-auto sm:flex-1"
                onClick={() => addItem(product, qty)}
                disabled={product.stockQty <= 0}
              >
                Add to Cart
              </Button>
              <Link to="/cart" className="sm:flex-1">
                <Button variant="ghost" className="w-full">
                  Go to Cart
                </Button>
              </Link>
            </div>

            {product.stockQty <= 0 ? (
              <div className="text-sm font-semibold text-[#c9a227]">Out of stock</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
