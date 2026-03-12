import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/Home'
import { ShopPage } from './pages/Shop'
import { ProductDetailPage } from './pages/ProductDetail'
import { CartCheckoutPage } from './pages/CartCheckout'
import { AboutPage } from './pages/About'
import { ContactPage } from './pages/Contact'
import { AdminEntryPage } from './pages/AdminEntry'
import { AdminLoginPage } from './pages/AdminLogin'
import { AdminDashboardPage } from './pages/AdminDashboard'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { firebaseConfigMissing, firebaseConfigured } from './firebase'

function App() {
  if (!firebaseConfigured) {
    return (
      <div className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">SETUP</div>
          <h1 className="mt-2 text-2xl font-extrabold">Firebase config missing</h1>
          <p className="mt-3 text-sm text-white/70">
            Copy <span className="font-semibold text-white">.env.example</span> to{' '}
            <span className="font-semibold text-white">.env</span> and fill in these variables:
          </p>
          <div className="mt-4 grid gap-2">
            {firebaseConfigMissing.map((k) => (
              <div key={k} className="rounded-xl bg-black/40 px-3 py-2 text-sm font-semibold">
                {k}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/50">After updating .env, restart the dev server.</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartCheckoutPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminEntryPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
