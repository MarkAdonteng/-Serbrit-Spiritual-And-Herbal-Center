import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatCurrency } from '../lib/format'
import { withDefaultImageUrl } from '../lib/images'
import { useCart } from '../context/cart/useCart'
import type { OrderCustomer } from '../types'
import { Button, Input, Panel } from '../components/ui'

const emptyCustomer: OrderCustomer = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
}

export function CartCheckoutPage() {
  const { items, subtotal, setQty, removeItem, clear } = useCart()
  const [customer, setCustomer] = useState<OrderCustomer>(emptyCustomer)
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = useMemo(() => subtotal, [subtotal])

  const canCheckout = items.length > 0 && !placing

  const placeOrder = async () => {
    setError(null)
    if (!items.length) return
    const missing =
      !customer.fullName || !customer.email || !customer.phone || !customer.address || !customer.city || !customer.country
    if (missing) {
      setError('Please fill in all required customer fields.')
      return
    }

    setPlacing(true)
    try {
      const res = await api.orders.create({
        customer,
        items: items.map((it) => ({ productId: it.product._id, qty: it.qty })),
      })
      setOrderId(res.orderId)
      clear()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (orderId) {
    return (
      <Panel className="p-8">
        <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">CONFIRMED</div>
        <h1 className="mt-2 text-3xl font-extrabold">Order placed</h1>
        <div className="mt-3 text-sm text-white/70">
          Your order confirmation number is <span className="font-bold text-[#c9a227]">{orderId}</span>.
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/shop" className="sm:flex-1">
            <Button variant="gold" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/" className="sm:flex-1">
            <Button variant="ghost" className="w-full">
              Back Home
            </Button>
          </Link>
        </div>
      </Panel>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">CART</div>
          <h1 className="mt-1 text-3xl font-extrabold">Shopping Cart</h1>
        </div>

        {items.length ? (
          <div className="grid gap-3">
            {items.map((it) => (
              <Panel key={it.product._id} className="grid gap-4 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <div className="aspect-square overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={withDefaultImageUrl(it.product.imageUrl)}
                    alt={it.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grid gap-1">
                  <div className="text-sm font-extrabold">{it.product.name}</div>
                  <div className="text-xs font-semibold text-[#1f5f3a]">{it.product.category}</div>
                  <div className="text-sm font-black text-[#c9a227]">{formatCurrency(it.product.price)}</div>
                  <div className="mt-2 flex max-w-xs items-end gap-2">
                    <div className="w-24">
                      <div className="text-xs font-semibold text-white/60">Qty</div>
                      <Input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) =>
                          setQty(it.product._id, Math.max(1, Math.floor(Number(e.target.value) || 1)))
                        }
                      />
                    </div>
                    <Button variant="ghost" onClick={() => removeItem(it.product._id)}>
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="text-right text-sm font-black text-white sm:text-base">
                  {formatCurrency(it.qty * it.product.price)}
                </div>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel className="p-6 text-sm text-white/70">
            Your cart is empty. <Link to="/shop" className="font-semibold text-[#c9a227] hover:text-[#d8b441]">Shop now</Link>.
          </Panel>
        )}
      </div>

      <div className="grid gap-4">
        <Panel className="p-5">
          <div className="text-sm font-extrabold">Checkout Summary</div>
          <div className="mt-4 grid gap-2 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Total</span>
              <span className="text-base font-black text-[#c9a227]">{formatCurrency(total)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/45">
              <span>Total is based on items only.</span>
              <span>Taxes/shipping not included.</span>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="text-sm font-extrabold">Customer Information</div>
          <div className="mt-4 grid gap-3">
            <Input
              placeholder="Full name *"
              value={customer.fullName}
              onChange={(e) => setCustomer((c) => ({ ...c, fullName: e.target.value }))}
            />
            <Input
              placeholder="Email *"
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
            />
            <Input
              placeholder="Phone *"
              value={customer.phone}
              onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
            />
            <Input
              placeholder="Address *"
              value={customer.address}
              onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="City *"
                value={customer.city}
                onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))}
              />
              <Input
                placeholder="State"
                value={customer.state ?? ''}
                onChange={(e) => setCustomer((c) => ({ ...c, state: e.target.value }))}
              />
            </div>
            <Input
              placeholder="Country *"
              value={customer.country}
              onChange={(e) => setCustomer((c) => ({ ...c, country: e.target.value }))}
            />

            {error ? <div className="text-sm font-semibold text-[#c9a227]">{error}</div> : null}

            <Button variant="gold" onClick={placeOrder} disabled={!canCheckout}>
              {placing ? 'Placing order…' : 'Place Order'}
            </Button>
            <div className="text-xs text-white/45">
              Orders are saved for confirmation. Payment processing is not included in this starter checkout.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

