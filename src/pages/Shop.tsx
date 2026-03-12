/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { PRODUCT_CATEGORIES } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import { withDefaultImageUrl } from '../lib/images'
import type { Product, ProductCategory } from '../types'
import { useCart } from '../context/cart/useCart'
import { Button, Input, Panel } from '../components/ui'
import { cn } from '../components/cn'

const PAGE_SIZE = 8

function SkeletonProductCard() {
  return (
    <Panel className="overflow-hidden">
      <div className="animate-pulse">
        <div className="aspect-[4/3] bg-white/10" />
        <div className="grid gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="h-4 w-12 rounded bg-white/10" />
          </div>
          <div className="h-3 w-1/2 rounded bg-white/10" />
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-4/5 rounded bg-white/10" />
          <div className="mt-1 flex gap-2">
            <div className="h-10 flex-1 rounded-xl bg-white/10" />
            <div className="h-10 flex-1 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function ShopPage() {
  const { addItem } = useCart()
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') as ProductCategory | null) ?? null
  const [q, setQ] = useState(params.get('q') ?? '')
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const queryKey = useMemo(() => ({ category: category ?? undefined, q: q.trim() || undefined }), [category, q])
  const totalPages = useMemo(() => Math.max(1, Math.ceil(products.length / PAGE_SIZE)), [products.length])
  const currentPage = useMemo(() => Math.min(Math.max(1, page), totalPages), [page, totalPages])
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [products, currentPage])

  useEffect(() => {
    let cancelled = false

    void Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
    })

    api.products
      .list(queryKey)
      .then((data) => {
        if (cancelled) return
        setProducts(data)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load products')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [queryKey])

  useEffect(() => {
    setPage(1)
  }, [queryKey])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])

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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Panel className="p-6 text-sm text-white/70">{error}</Panel>
      ) : products.length ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {pageItems.map((p) => (
              <Panel key={p._id} className="group overflow-hidden">
                <Link to={`/product/${p._id}`} className="block">
                  <div className="aspect-[4/3] bg-white/5">
                    <img
                      src={withDefaultImageUrl(p.imageUrl)}
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

          {totalPages > 1 ? (
            <Panel className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-white/70">
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, products.length)}
                  </span>{' '}
                  of <span className="font-semibold text-white">{products.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <div className="px-2 text-sm font-semibold text-white/70">
                    Page <span className="text-white">{currentPage}</span> / <span className="text-white">{totalPages}</span>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      ) : (
        <Panel className="p-6 text-sm text-white/70">No products match your search.</Panel>
      )}
    </div>
  )
}
