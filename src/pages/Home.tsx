import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { BRAND } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import { withDefaultImageUrl } from '../lib/images'
import type { Product } from '../types'
import { Button, Panel } from '../components/ui'
import { useCart } from '../context/cart/useCart'

export function HomePage() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const featured = useMemo(() => products.slice(0, 4), [products])

  useEffect(() => {
    let mounted = true
    api.products
      .list()
      .then((data) => {
        if (!mounted) return
        setProducts(data)
      })
      .catch(() => {
        if (!mounted) return
        setProducts([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="grid gap-10">
      <section className="relative overflow-hidden rounded-3xl bg-white/4 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(31,95,58,0.35),transparent_50%),radial-gradient(circle_at_75%_40%,rgba(201,162,39,0.25),transparent_55%)]" />
        <div className="relative grid gap-8 px-6 py-12 md:grid-cols-2 md:items-center md:px-10">
          <div className="grid gap-5">
            <div className="inline-flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.2)]">
                <img src="/serbit.jpeg" alt={`${BRAND.name} logo`} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.2em] text-[#c9a227]">SERBRIT</div>
                <div className="text-sm font-semibold text-white/70">Spiritual And Herbal Center</div>
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              <span className="text-white">{BRAND.tagline.split('.')[0]}.</span>{' '}
              <span className="text-white/80">{BRAND.tagline.split('.')[1]}</span>
            </h1>

            <p className="max-w-prose text-base text-white/70">
              A spiritual, natural, and professional space for herbal medicine, natural remedies, and nourishing herbal
              foods — crafted for balance, vitality, and inner peace.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/shop">
                <Button variant="gold" className="w-full sm:w-auto">
                  Shop Now
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:justify-items-end">
            <Panel className="grid gap-3 p-5 md:max-w-md">
              <div className="text-sm font-bold text-white">Why Serbrit</div>
              <div className="grid gap-2 text-sm text-white/65">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1f5f3a]" />
                  <span>Herbal blends inspired by nature and tradition</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c9a227]" />
                  <span>Spiritual balance and premium quality standards</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white/60" />
                  <span>Clean ingredients, clear guidance, and modern convenience</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">FEATURED</div>
            <h2 className="mt-1 text-2xl font-extrabold">Herbal Products</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-[#c9a227] hover:text-[#d8b441]">
            View all
          </Link>
        </div>

        {loading ? (
          <Panel className="p-6 text-sm text-white/70">Loading featured products…</Panel>
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <Panel key={p._id} className="group overflow-hidden">
                <Link to={`/product/${p._id}`} className="block">
                  <div className="aspect-square bg-white/5">
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
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="shrink-0 text-sm font-black text-[#c9a227]">{formatCurrency(p.price)}</div>
                  </div>
                  <div className="text-sm text-white/65">{p.description}</div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="primary" className="flex-1" onClick={() => addItem(p, 1)} disabled={p.stockQty <= 0}>
                      Add to Cart
                    </Button>
                    <Link to={`/product/${p._id}`} className="flex-1">
                      <Button variant="ghost" className="w-full">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel className="p-6 text-sm text-white/70">
            No products yet. Add items from the admin dashboard to populate the shop.
          </Panel>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Panel className="p-6">
          <div className="text-sm font-extrabold text-[#c9a227]">Customer Words</div>
          <div className="mt-3 text-sm text-white/70">
            “I felt calmer within days. The quality is exceptional and the guidance is clear.”
          </div>
          <div className="mt-4 text-xs font-semibold text-white/50">— Amina K.</div>
        </Panel>
        <Panel className="p-6">
          <div className="text-sm font-extrabold text-[#c9a227]">Natural Remedies</div>
          <div className="mt-3 text-sm text-white/70">
            “The herbal food products are delicious and nourishing. It’s become part of my weekly routine.”
          </div>
          <div className="mt-4 text-xs font-semibold text-white/50">— Daniel M.</div>
        </Panel>
        <Panel className="p-6">
          <div className="text-sm font-extrabold text-[#c9a227]">Spiritual Balance</div>
          <div className="mt-3 text-sm text-white/70">
            “A beautiful blend of wellness and spirituality. The store experience is clean and professional.”
          </div>
          <div className="mt-4 text-xs font-semibold text-white/50">— Grace O.</div>
        </Panel>
      </section>
    </div>
  )
}
