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

function App() {
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
