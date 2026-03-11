import type { OrderCustomer, Product } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

type ApiError = { message: string }

async function request<T>(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!res.ok) {
    let body: ApiError | undefined
    try {
      body = (await res.json()) as ApiError
    } catch {
      body = undefined
    }
    throw new Error(body?.message ?? `Request failed (${res.status})`)
  }

  return (await res.json()) as T
}

export const api = {
  products: {
    list: (params?: { q?: string; category?: string }) => {
      const search = new URLSearchParams()
      if (params?.q) search.set('q', params.q)
      if (params?.category) search.set('category', params.category)
      const qs = search.toString()
      return request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<Product>(`/api/products/${id}`),
  },
  orders: {
    create: (payload: { customer: OrderCustomer; items: Array<{ productId: string; qty: number }> }) =>
      request<{ orderId: string }>(`/api/orders`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  admin: {
    login: (payload: { email: string; password: string }) =>
      request<{ token: string }>(`/api/auth/login`, { method: 'POST', body: JSON.stringify(payload) }),
    listProducts: (token: string) =>
      request<Product[]>(`/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
    createProduct: (token: string, payload: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) =>
      request<Product>(`/api/admin/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }),
    updateProduct: (token: string, id: string, payload: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>) =>
      request<Product>(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }),
    deleteProduct: (token: string, id: string) =>
      request<{ ok: true }>(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
    uploadImage: async (token: string, file: File) => {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`)
      }
      return (await res.json()) as { imageUrl: string }
    },
  },
}

