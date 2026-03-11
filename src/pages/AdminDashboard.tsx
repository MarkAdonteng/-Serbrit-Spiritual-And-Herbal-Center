import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { PRODUCT_CATEGORIES } from '../lib/constants'
import { formatCurrency } from '../lib/format'
import { useAdminAuth } from '../context/AdminAuthContext'
import type { Product, ProductCategory } from '../types'
import { Button, Input, Panel } from '../components/ui'

export function AdminDashboardPage() {
  const { token, logout } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(() => products.find((p) => p._id === selectedId) ?? null, [products, selectedId])

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Herbal Medicine')
  const [price, setPrice] = useState<number>(24.99)
  const [description, setDescription] = useState('')
  const [stockQty, setStockQty] = useState<number>(10)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!token) return
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

  useEffect(() => {
    if (!selected) return
    setName(selected.name)
    setCategory(selected.category)
    setPrice(selected.price)
    setDescription(selected.description)
    setStockQty(selected.stockQty)
    setImageUrl(selected.imageUrl)
  }, [selected])

  const resetForm = () => {
    setSelectedId(null)
    setName('')
    setCategory('Herbal Medicine')
    setPrice(24.99)
    setDescription('')
    setStockQty(10)
    setImageUrl('')
  }

  const onUpload = async (file: File | null) => {
    if (!file || !token) return
    setUploading(true)
    setError(null)
    try {
      const res = await api.admin.uploadImage(token, file)
      setImageUrl(res.imageUrl)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      if (!name.trim() || !description.trim() || !imageUrl.trim()) {
        setError('Name, description, and image are required.')
        return
      }

      if (selectedId) {
        const updated = await api.admin.updateProduct(token, selectedId, {
          name: name.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          stockQty: Math.max(0, Math.floor(Number(stockQty) || 0)),
        })
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
      } else {
        const created = await api.admin.createProduct(token, {
          name: name.trim(),
          category,
          price: Number(price),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          stockQty: Math.max(0, Math.floor(Number(stockQty) || 0)),
        })
        setProducts((prev) => [created, ...prev])
        resetForm()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
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

      {error ? <Panel className="p-4 text-sm font-semibold text-[#c9a227]">{error}</Panel> : null}

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
                  onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {imageUrl ? (
              <div className="overflow-hidden rounded-2xl bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                <img src={imageUrl} alt="Product preview" className="h-56 w-full object-cover" />
              </div>
            ) : null}
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
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
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
                    <Button variant="primary" type="button" onClick={() => void remove(p._id)}>
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
    </div>
  )
}
