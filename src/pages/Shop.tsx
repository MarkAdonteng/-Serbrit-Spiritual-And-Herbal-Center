import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { PRODUCT_CATEGORIES } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import type { Product, ProductCategory } from '../types'
import { useCart } from '../context/CartContext'
import { Button, Input, Panel, cn } from '../components/ui'

export function ShopPage() {
  const { addItem } = useCart()
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') as ProductCategory | null) ?? null
  const [q, setQ] = useState(params.get('q') ?? '')
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  const queryKey = useMemo(() => ({ category, q: q.trim() || undefined }), [category, q])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.products
      .list(queryKey)
      .then(setProducts)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [queryKey])

  const applyCategory = (next: ProductCategory | null) => {
    const nextParams = new URLSearchParams(params)
    if (next) nextParams.set('category', next)
    else nextParams.delete('category')
    if (q.trim()) nextParams.set('q', q.trim())
    else nextParams.delete('q')
    setParams(nextParams, { replace: true })
  }

  const applySearch = () => {
    const nextParams = new URLSearchParams(params)
    if (q.trim()) nextParams.set('q', q.trim())
    else nextParams.delete('q')
    if (category) nextParams.set('category', category)
    else nextParams.delete('category')
    setParams(nextParams, { replace: true })
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">SHOP</div>
          <h1 className="mt-1 text-3xl font-extrabold">Herbal Store</h1>
          <p className="mt-2 max-w-prose text-sm text-white/65">
            Search herbal medicine, natural remedies, nourishing herbal food, and spiritual products.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch()
            }}
          />
          <Button variant="gold" onClick={applySearch}>
            Search
          </Button>
        </div>
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(
              'rounded-full px-3 py-2 text-sm font-semibold transition',
              !category ? 'bg-[#c9a227] text-black' : 'bg-white/5 text-white/80 hover:bg-white/10',
            )}
            onClick={() => applyCategory(null)}
          >
            All
          </button>
          {PRODUCT_CATEGORIES.map((c) => (
            <button
              key={c}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-semibold transition',
                category === c ? 'bg-[#c9a227] text-black' : 'bg-white/5 text-white/80 hover:bg-white/10',
              )}
              onClick={() => applyCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </Panel>

      {loading ? (
        <Panel className="p-6 text-sm text-white/70">Loading products…</Panel>
      ) : error ? (
        <Panel className="p-6 text-sm text-white/70">{error}</Panel>
      ) : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Panel key={p._id} className="group overflow-hidden">
              <Link to={`/product/${p._id}`} className="block">
                <div className="aspect-[4/3] bg-white/5">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </Link>
              <div className="grid gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-extrabold">{p.name}</div>
                  <div className="shrink-0 text-sm font-black text-[#c9a227]">{formatCurrency(p.price)}</div>
                </div>
                <div className="text-xs font-semibold text-[#1f5f3a]">{p.category}</div>
                <div className="text-sm text-white/65">{p.description}</div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => addItem(p, 1)}
                    disabled={p.stockQty <= 0}
                  >
                    Add to Cart
                  </Button>
                  <Link to={`/product/${p._id}`} className="flex-1">
                    <Button variant="ghost" className="w-full">
                      Details
                    </Button>
                  </Link>
                </div>
                {p.stockQty <= 0 ? <div className="text-xs font-semibold text-[#c9a227]">Out of stock</div> : null}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="p-6 text-sm text-white/70">No products match your search.</Panel>
      )}
    </div>
  )
}
