import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import multer from 'multer'

const PORT = Number(process.env.PORT || 5000)
const MONGODB_URI = process.env.MONGODB_URI || ''
const JWT_SECRET = process.env.JWT_SECRET || ''
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const SEED_SAMPLE = (process.env.SEED_SAMPLE || '').toLowerCase() === 'true'

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required')
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const uploadDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

await mongoose.connect(MONGODB_URI)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    stockQty: { type: Number, required: true },
  },
  { timestamps: true },
)

const Product = mongoose.model('Product', productSchema)

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
)

const AdminUser = mongoose.model('AdminUser', adminUserSchema)

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true },
      },
    ],
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: false },
      country: { type: String, required: true },
    },
    total: { type: Number, required: true },
    status: { type: String, required: true, default: 'placed' },
  },
  { timestamps: true },
)

const Order = mongoose.model('Order', orderSchema)

async function ensureAdminUser() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return
  const existing = await AdminUser.findOne({ email: ADMIN_EMAIL })
  if (existing) return
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await AdminUser.create({ email: ADMIN_EMAIL, passwordHash })
  console.log(`[admin] created ${ADMIN_EMAIL}`)
}

async function seedSampleProducts() {
  if (!SEED_SAMPLE) return
  const count = await Product.countDocuments()
  if (count > 0) return
  await Product.insertMany([
    {
      name: 'Moringa Vitality Powder',
      category: 'Herbal Food',
      price: 19.99,
      description: 'A nourishing green superfood powder to support daily vitality and balance.',
      imageUrl: 'https://picsum.photos/seed/serbrit-moringa/900/700',
      stockQty: 40,
    },
    {
      name: 'Ginger & Turmeric Tonic',
      category: 'Herbal Medicine',
      price: 24.5,
      description: 'A warming herbal tonic crafted for comfort, circulation, and seasonal support.',
      imageUrl: 'https://picsum.photos/seed/serbrit-tonic/900/700',
      stockQty: 25,
    },
    {
      name: 'Herbal Calm Tea Blend',
      category: 'Herbal Medicine',
      price: 14.0,
      description: 'A gentle tea blend designed to support relaxation and spiritual calm.',
      imageUrl: 'https://picsum.photos/seed/serbrit-tea/900/700',
      stockQty: 60,
    },
    {
      name: 'Frankincense Resin',
      category: 'Spiritual Products',
      price: 12.99,
      description: 'A premium spiritual resin traditionally used for cleansing and meditation.',
      imageUrl: 'https://picsum.photos/seed/serbrit-resin/900/700',
      stockQty: 30,
    },
  ])
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'Missing token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (!payload || typeof payload !== 'object') return res.status(401).json({ message: 'Invalid token' })
    req.admin = payload
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ext && ext.length <= 10 ? ext : ''
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(uploadDir))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/products', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : ''
  const q = typeof req.query.q === 'string' ? req.query.q : ''

  const filter = {}
  if (category) filter.category = category
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { description: rx }, { category: rx }]
  }

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean()
  res.json(
    products.map((p) => ({
      _id: String(p._id),
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description,
      imageUrl: p.imageUrl,
      stockQty: p.stockQty,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  )
})

app.get('/api/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id).lean()
  if (!p) return res.status(404).json({ message: 'Not found' })
  return res.json({
    _id: String(p._id),
    name: p.name,
    category: p.category,
    price: p.price,
    description: p.description,
    imageUrl: p.imageUrl,
    stockQty: p.stockQty,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  })
})

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  const user = await AdminUser.findOne({ email })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign({ sub: String(user._id), role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
  return res.json({ token })
})

app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).lean()
  res.json(
    products.map((p) => ({
      _id: String(p._id),
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description,
      imageUrl: p.imageUrl,
      stockQty: p.stockQty,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  )
})

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const payload = {
    name: String(req.body?.name || '').trim(),
    category: String(req.body?.category || '').trim(),
    price: Number(req.body?.price),
    description: String(req.body?.description || '').trim(),
    imageUrl: String(req.body?.imageUrl || '').trim(),
    stockQty: Math.max(0, Math.floor(Number(req.body?.stockQty) || 0)),
  }

  if (!payload.name || !payload.category || !payload.description || !payload.imageUrl || !Number.isFinite(payload.price)) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const created = await Product.create(payload)
  return res.status(201).json({
    _id: String(created._id),
    name: created.name,
    category: created.category,
    price: created.price,
    description: created.description,
    imageUrl: created.imageUrl,
    stockQty: created.stockQty,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  })
})

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const update = {}
  if (typeof req.body?.name === 'string') update.name = req.body.name.trim()
  if (typeof req.body?.category === 'string') update.category = req.body.category.trim()
  if (typeof req.body?.description === 'string') update.description = req.body.description.trim()
  if (typeof req.body?.imageUrl === 'string') update.imageUrl = req.body.imageUrl.trim()
  if (typeof req.body?.price !== 'undefined') update.price = Number(req.body.price)
  if (typeof req.body?.stockQty !== 'undefined') update.stockQty = Math.max(0, Math.floor(Number(req.body.stockQty) || 0))

  if ('price' in update && !Number.isFinite(update.price)) {
    return res.status(400).json({ message: 'Invalid price' })
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  return res.json({
    _id: String(updated._id),
    name: updated.name,
    category: updated.category,
    price: updated.price,
    description: updated.description,
    imageUrl: updated.imageUrl,
    stockQty: updated.stockQty,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  })
})

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  return res.json({ ok: true })
})

app.post('/api/admin/upload', requireAdmin, upload.single('image'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ message: 'Missing image' })
  return res.json({ imageUrl: `/uploads/${file.filename}` })
})

app.post('/api/orders', async (req, res) => {
  const customer = req.body?.customer
  const items = Array.isArray(req.body?.items) ? req.body.items : []

  const requiredCustomer = ['fullName', 'email', 'phone', 'address', 'city', 'country']
  const customerOk =
    customer &&
    requiredCustomer.every((k) => typeof customer[k] === 'string' && String(customer[k]).trim().length > 0)
  if (!customerOk) return res.status(400).json({ message: 'Invalid customer' })
  if (!items.length) return res.status(400).json({ message: 'Cart is empty' })

  const normalizedItems = items
    .map((it) => ({ productId: String(it?.productId || ''), qty: Math.max(1, Math.floor(Number(it?.qty) || 1)) }))
    .filter((it) => it.productId)

  if (!normalizedItems.length) return res.status(400).json({ message: 'Invalid items' })

  const decremented = []
  try {
    const snapshots = []
    for (const it of normalizedItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: it.productId, stockQty: { $gte: it.qty } },
        { $inc: { stockQty: -it.qty } },
        { new: true },
      )
      if (!updated) {
        throw new Error('Insufficient stock for one or more items')
      }
      decremented.push({ productId: it.productId, qty: it.qty })
      snapshots.push({ product: updated, qty: it.qty })
    }

    const orderItems = snapshots.map((s) => ({
      productId: s.product._id,
      name: s.product.name,
      price: s.product.price,
      qty: s.qty,
    }))

    const total = orderItems.reduce((sum, it) => sum + it.price * it.qty, 0)
    const order = await Order.create({
      items: orderItems,
      customer: {
        fullName: String(customer.fullName).trim(),
        email: String(customer.email).trim(),
        phone: String(customer.phone).trim(),
        address: String(customer.address).trim(),
        city: String(customer.city).trim(),
        state: typeof customer.state === 'string' ? customer.state.trim() : '',
        country: String(customer.country).trim(),
      },
      total,
      status: 'placed',
    })

    return res.status(201).json({ orderId: String(order._id) })
  } catch (e) {
    for (const d of decremented) {
      await Product.updateOne({ _id: d.productId }, { $inc: { stockQty: d.qty } })
    }
    return res.status(400).json({ message: e instanceof Error ? e.message : 'Order failed' })
  }
})

app.use((_req, res) => res.status(404).json({ message: 'Not found' }))

await ensureAdminUser()
await seedSampleProducts()

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
