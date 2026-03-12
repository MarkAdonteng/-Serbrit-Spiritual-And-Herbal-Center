import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { OrderCustomer, Product } from '../types'
import { auth, db, firebaseConfigMissing, storage } from '../firebase'

const PRODUCTS = 'products'
const ORDERS = 'orders'

function firebaseNotReadyMessage() {
  const missing = firebaseConfigMissing.length ? ` Missing: ${firebaseConfigMissing.join(', ')}` : ''
  return `Firebase is not configured.${missing}`
}

function requireDb() {
  if (!db) throw new Error(firebaseNotReadyMessage())
  return db
}

function requireAuth() {
  if (!auth) throw new Error(firebaseNotReadyMessage())
  return auth
}

function requireStorage() {
  if (!storage) throw new Error(firebaseNotReadyMessage())
  return storage
}

function timestampToIso(v: unknown) {
  if (!v || typeof v !== 'object') return undefined
  const maybe = v as { toDate?: () => Date }
  if (typeof maybe.toDate !== 'function') return undefined
  return maybe.toDate().toISOString()
}

function productFromDoc(id: string, data: Record<string, unknown>): Product {
  return {
    _id: id,
    name: String(data.name ?? ''),
    category: data.category as Product['category'],
    price: Number(data.price ?? 0),
    description: String(data.description ?? ''),
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
    imagePath: typeof data.imagePath === 'string' ? data.imagePath : undefined,
    stockQty: Number(data.stockQty ?? 0),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

function safeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function stripUndefined<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'undefined') out[k] = v
  }
  return out
}

export const api = {
  products: {
    list: async (params?: { q?: string; category?: string }) => {
      const dbi = requireDb()
      const qRef = query(collection(dbi, PRODUCTS), orderBy('createdAt', 'desc'))
      const snap = await getDocs(qRef)
      const all = snap.docs.map((d) => productFromDoc(d.id, d.data() as Record<string, unknown>))

      const category = (params?.category ?? '').trim()
      const qText = (params?.q ?? '').trim().toLowerCase()

      return all.filter((p) => {
        if (category && p.category !== category) return false
        if (!qText) return true
        const hay = `${p.name} ${p.description} ${p.category}`.toLowerCase()
        return hay.includes(qText)
      })
    },
    get: async (id: string) => {
      const dbi = requireDb()
      const snap = await getDoc(doc(dbi, PRODUCTS, id))
      if (!snap.exists()) throw new Error('Product not found')
      return productFromDoc(snap.id, snap.data() as Record<string, unknown>)
    },
  },
  orders: {
    create: async (payload: { customer: OrderCustomer; items: Array<{ productId: string; qty: number }> }) => {
      const dbi = requireDb()
      const orderId = await runTransaction(dbi, async (tx) => {
        const itemSnapshots = []
        for (const it of payload.items) {
          const pRef = doc(dbi, PRODUCTS, it.productId)
          const pSnap = await tx.get(pRef)
          if (!pSnap.exists()) throw new Error('One or more products no longer exists')
          const pData = pSnap.data() as Record<string, unknown>
          const stock = Number(pData.stockQty ?? 0)
          const qty = Math.max(1, Math.floor(Number(it.qty) || 1))
          if (stock < qty) throw new Error('Insufficient stock for one or more items')
          tx.update(pRef, { stockQty: stock - qty, updatedAt: serverTimestamp() })
          itemSnapshots.push({ productId: pSnap.id, name: String(pData.name ?? ''), price: Number(pData.price ?? 0), qty })
        }

        const total = itemSnapshots.reduce((sum, it) => sum + it.price * it.qty, 0)
        const orderRef = doc(collection(dbi, ORDERS))
        tx.set(orderRef, {
          items: itemSnapshots,
          customer: payload.customer,
          total,
          status: 'placed',
          createdAt: serverTimestamp(),
        })

        return orderRef.id
      })

      return { orderId }
    },
  },
  admin: {
    login: async (payload: { email: string; password: string }) => {
      const authi = requireAuth()
      await signInWithEmailAndPassword(authi, payload.email, payload.password)
      return { token: 'firebase' }
    },
    ensureUser: async (payload: { email: string; password: string }) => {
      const authi = requireAuth()
      await createUserWithEmailAndPassword(authi, payload.email, payload.password)
      return { ok: true as const }
    },
    logout: async () => {
      const authi = requireAuth()
      await signOut(authi)
      return { ok: true as const }
    },
    listProducts: async (_token: string) => {
      void _token
      const dbi = requireDb()
      const qRef = query(collection(dbi, PRODUCTS), orderBy('createdAt', 'desc'))
      const snap = await getDocs(qRef)
      return snap.docs.map((d) => productFromDoc(d.id, d.data() as Record<string, unknown>))
    },
    createProduct: async (_token: string, payload: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => {
      void _token
      const dbi = requireDb()
      const created = await addDoc(collection(dbi, PRODUCTS), {
        name: payload.name,
        category: payload.category,
        price: payload.price,
        description: payload.description,
        imageUrl: payload.imageUrl,
        imagePath: payload.imagePath ?? null,
        stockQty: payload.stockQty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      const nowIso = new Date().toISOString()
      return {
        _id: created.id,
        ...payload,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
    },
    updateProduct: async (
      _token: string,
      id: string,
      payload: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>,
    ) => {
      void _token
      const dbi = requireDb()
      const pRef = doc(dbi, PRODUCTS, id)
      await updateDoc(pRef, stripUndefined({ ...payload, updatedAt: serverTimestamp() }))
      const snap = await getDoc(pRef)
      if (!snap.exists()) throw new Error('Not found')
      return productFromDoc(snap.id, snap.data() as Record<string, unknown>)
    },
    deleteProduct: async (_token: string, id: string) => {
      void _token
      const dbi = requireDb()
      const pRef = doc(dbi, PRODUCTS, id)
      const snap = await getDoc(pRef)
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>
        const imagePath = typeof data.imagePath === 'string' ? data.imagePath : ''
        if (imagePath) {
          try {
            const storagei = requireStorage()
            await deleteObject(storageRef(storagei, imagePath))
          } catch {
            void 0
          }
        }
      }
      await deleteDoc(pRef)
      return { ok: true as const }
    },
    uploadImage: async (_token: string, file: File) => {
      void _token
      const storagei = requireStorage()
      const id = safeId()
      const path = `products/${id}-${file.name}`
      const r = storageRef(storagei, path)
      await uploadBytes(r, file, { contentType: file.type })
      const imageUrl = await getDownloadURL(r)
      return { imageUrl, imagePath: path }
    },
  },
}
