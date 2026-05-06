import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { PRODUCT_CATEGORIES } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import { withDefaultImageUrl } from '../lib/images'
import { useAdminAuth } from '../context/admin/useAdminAuth'
import type { Order, Product, ProductCategory } from '../types'
import { Button, Input, Panel } from '../components/ui'

export function AdminDashboardPage() {
  const { token, logout } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const selected = useMemo(() => products.find((p) => p._id === selectedId) ?? null, [products, selectedId])

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Herbal Medicine')
  const [price, setPrice] = useState<number>(24.99)
  const [description, setDescription] = useState('')
  const [stockQty, setStockQty] = useState<number>(10)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imagePath, setImagePath] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.admin.listProducts(token)
      setProducts(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setOrdersLoading(false)
      return
    }
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const data = await api.admin.listOrders(token)
      setOrders(data)
    } catch (e: unknown) {
      setOrdersError(e instanceof Error ? e.message : 'Failed to load orders')
    } finally {
      setOrdersLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'orders') {
      void fetchOrders()
    }
  }, [tab, fetchOrders])

  useEffect(() => {
    if (!selected) return
    setName(selected.name)
    setCategory(selected.category)
    setPrice(selected.price)
    setDescription(selected.description)
    setStockQty(selected.stockQty)
    setImageUrl(selected.imageUrl)
    setImagePath(selected.imagePath)
  }, [selected])

  useEffect(() => {
    if (!deleteTarget) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteTarget(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteTarget])

  const resetForm = () => {
    setSelectedId(null)
    setName('')
    setCategory('Herbal Medicine')
    setPrice(24.99)
    setDescription('')
    setStockQty(10)
    setImageUrl('')
    setImagePath(undefined)
  }

  const onUpload = async (file: File | null) => {
    if (!file || !token) return
    setUploading(true)
    setError(null)
    try {
      const res = await api.admin.uploadImage(token, file)
      setImageUrl(res.imageUrl)
      setImagePath(res.imagePath)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    void onUpload(file).finally(() => {
      e.target.value = ''
    })
  }

  const errorText = (e: unknown) => {
    if (e && typeof e === 'object' && 'code' in e && typeof (e as { code: unknown }).code === 'string') {
      const code = (e as { code: string }).code
      const msg = e instanceof Error ? e.message : 'Unknown error'
      return `${code}: ${msg}`
    }
    return e instanceof Error ? e.message : 'Unknown error'
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Not authenticated. Please login again.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (!name.trim() || !description.trim()) {
        setError('Name and description are required.')
        return
      }

      if (selectedId) {
        const updated = await api.admin.updateProduct(token, selectedId, {
          name: name.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          imageUrl: imageUrl.trim() || '',
          imagePath: imageUrl.trim() ? imagePath : undefined,
          stockQty: Math.max(0, Math.floor(Number(stockQty) || 0)),
        })
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
      } else {
        const created = await api.admin.createProduct(token, {
          name: name.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          imageUrl: imageUrl.trim() || '',
          imagePath: imageUrl.trim() ? imagePath : undefined,
          stockQty: Math.max(0, Math.floor(Number(stockQty) || 0)),
        })
        setProducts((prev) => [created, ...prev])
        resetForm()
      }

      await fetchProducts()
    } catch (e: unknown) {
      const msg = errorText(e)
      if (msg.includes('permission-denied')) {
        setError(`${msg}. Check Firestore rules (write permission required).`)
      } else {
        setError(msg || 'Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!token) return
    setError(null)
    try {
      await api.admin.deleteProduct(token, id)
      setProducts((prev) => prev.filter((p) => p._id !== id))
      if (selectedId === id) resetForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget._id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">ADMIN</div>
          <h1 className="mt-1 text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-2 max-w-prose text-sm text-white/70">
            Add products, upload images, edit details, and manage stock. New products instantly appear in the customer
            shop.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/shop" className="sm:flex-1">
            <Button variant="ghost" className="w-full" type="button">
              View Shop
            </Button>
          </Link>
          <Button variant="gold" className="sm:flex-1" type="button" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'products' ? 'gold' : 'ghost'} type="button" onClick={() => setTab('products')}>
          Products
        </Button>
        <Button variant={tab === 'orders' ? 'gold' : 'ghost'} type="button" onClick={() => setTab('orders')}>
          Orders
        </Button>
      </div>

      {error && tab === 'products' ? <Panel className="p-4 text-sm font-semibold text-[#c9a227]">{error}</Panel> : null}
      {ordersError && tab === 'orders' ? <Panel className="p-4 text-sm font-semibold text-[#c9a227]">{ordersError}</Panel> : null}

      {tab === 'products' ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold">{selectedId ? 'Edit Product' : 'Add Product'}</div>
            {selectedId ? (
              <Button variant="ghost" type="button" onClick={resetForm}>
                New
              </Button>
            ) : null}
          </div>

          <form onSubmit={save} className="mt-4 grid gap-3">
            <Input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-white/60">Category</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] outline-none focus:ring-2 focus:ring-[#c9a227]/60"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-black">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-white/60">Price</div>
                <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-xs font-semibold text-white/60">Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-28 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 shadow-[0_0_0_1px_rgba(255,255,255,0.15)] outline-none focus:ring-2 focus:ring-[#c9a227]/60"
                placeholder="Full product description"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-white/60">Stock quantity</div>
                <Input
                  type="number"
                  min={0}
                  value={stockQty}
                  onChange={(e) => setStockQty(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                />
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold text-white/60">Product image</div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onImageFileChange}
                  disabled={uploading || saving}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
              <img src={withDefaultImageUrl(imageUrl)} alt="Product preview" className="h-56 w-full object-cover" />
            </div>
            {uploading ? <div className="text-xs font-semibold text-white/60">Uploading image…</div> : null}

            <Button variant="gold" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving…' : selectedId ? 'Save Changes' : 'Add Product'}
            </Button>
          </form>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold">Product List</div>
            <Button variant="ghost" type="button" onClick={() => void fetchProducts()} disabled={loading}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-white/70">Loading…</div>
          ) : products.length ? (
            <div className="mt-4 grid gap-3">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="grid gap-3 rounded-2xl bg-white/4 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] sm:grid-cols-[88px_1fr_auto] sm:items-center"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-white/5">
                    <img src={withDefaultImageUrl(p.imageUrl)} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="text-sm font-extrabold">{p.name}</div>
                      <div className="text-xs font-semibold text-[#1f5f3a]">{p.category}</div>
                    </div>
                    <div className="text-sm font-black text-[#c9a227]">{formatCurrency(p.price)}</div>
                    <div className="text-xs text-white/55">Stock: {p.stockQty}</div>
                  </div>
                  <div className="flex gap-2 sm:justify-end">
                    <Button variant="ghost" type="button" onClick={() => setSelectedId(p._id)}>
                      Edit
                    </Button>
                    <Button variant="primary" type="button" onClick={() => setDeleteTarget(p)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-white/70">No products yet.</div>
          )}
        </Panel>
        </div>
      ) : (
        <Panel className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold">Orders</div>
            <Button variant="ghost" type="button" onClick={() => void fetchOrders()} disabled={ordersLoading}>
              Refresh
            </Button>
          </div>
          {ordersLoading ? (
            <div className="mt-4 text-sm text-white/70">Loading…</div>
          ) : orders.length ? (
            <div className="mt-4 grid gap-4">
              {orders.map((o) => (
                <div
                  key={o._id}
                  className="rounded-2xl bg-white/4 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                    <div>
                      <div className="text-sm font-extrabold">Order #{o._id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-white/50">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        o.status === 'paid' || o.status === 'completed'
                          ? 'bg-[#1f5f3a]/30 text-[#4ade80]'
                          : o.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-[#c9a227]/20 text-[#c9a227]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold text-white/50 mb-1">Customer</div>
                      <div className="text-sm font-semibold">{o.customer.fullName}</div>
                      <div className="text-sm text-white/70">{o.customer.email}</div>
                      <div className="text-sm text-white/70">{o.customer.phone}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/50 mb-1">Shipping</div>
                      <div className="text-sm text-white/70">{o.customer.address}</div>
                      <div className="text-sm text-white/70">
                        {o.customer.city}
                        {o.customer.state ? `, ${o.customer.state}` : ''}, {o.customer.country}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-white/50 mb-2">Items</div>
                    <div className="grid gap-2">
                      {o.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>
                            {it.name} × {it.qty}
                          </span>
                          <span className="font-semibold">{formatCurrency(it.price * it.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {o.payment ? (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs font-semibold text-white/50 mb-1">Payment</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                        <span>Provider: {o.payment.provider}</span>
                        <span>Ref: {o.payment.reference}</span>
                        <span>Amount: {formatCurrency(o.payment.amount)}</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-black text-[#c9a227]">{formatCurrency(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-white/70">No orders yet.</div>
          )}
        </Panel>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              if (deleting) return
              setDeleteTarget(null)
            }}
            aria-label="Close delete confirmation"
          />
          <Panel
            className="relative w-full max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <div className="text-sm font-extrabold" id="delete-confirm-title">
              Delete product
            </div>
            <div className="mt-2 text-sm text-white/70">
              Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget.name}</span>?
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" type="button" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="button" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  )
}
