export type ProductCategory = 'Herbal Medicine' | 'Herbal Food' | 'Spiritual Products'

export type Product = {
  _id: string
  name: string
  category: ProductCategory
  price: number
  description: string
  imageUrl: string
  imagePath?: string
  stockQty: number
  createdAt?: string
  updatedAt?: string
}

export type CartItem = {
  product: Product
  qty: number
}

export type OrderCustomer = {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state?: string
  country: string
}

export type Order = {
  _id: string
  items: Array<{ productId: string; name: string; price: number; qty: number }>
  customer: OrderCustomer
  total: number
  status: 'placed' | 'paid' | 'processing' | 'completed' | 'cancelled'
  payment?: {
    provider: 'paystack'
    reference: string
    currency: string
    amount: number
  }
  createdAt?: string
}
