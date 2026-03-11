import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BRAND } from '../lib/constants'
import { useCart } from '../context/CartContext'
import { Button, cn } from './ui'

function CartBadge() {
  const { itemCount } = useCart()
  if (!itemCount) return null
  return (
    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[#c9a227] px-2 py-0.5 text-xs font-black text-black">
      {itemCount}
    </span>
  )
}

export function Layout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const nav = useMemo(
    () => [
      { to: '/', label: 'Home' },
      { to: '/shop', label: 'Shop' },
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
      { to: '/cart', label: 'Cart', right: true },
    ],
    [],
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.15)]">
              <img src="/serbit.jpeg" alt={`${BRAND.name} logo`} className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide">{BRAND.name}</div>
              <div className="text-xs text-white/60">{BRAND.tagline}</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-2 md:flex">
              {nav
                .filter((n) => !n.right)
                .map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    className={({ isActive }) =>
                      cn(
                        'rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/5',
                        isActive ? 'bg-white/10 text-white' : 'text-white/80',
                      )
                    }
                  >
                    {n.label}
                  </NavLink>
                ))}
            </nav>

            <Link to="/cart" className="hidden md:inline-flex">
              <Button variant="ghost" className="px-3">
                Cart
                <CartBadge />
              </Button>
            </Link>

            <Link to="/admin" className="hidden md:inline-flex">
              <Button variant="gold" className="px-3">
                Admin
              </Button>
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.15)] transition hover:bg-white/10 md:hidden"
              aria-expanded={open}
              aria-label="Toggle navigation"
            >
              Menu
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-white/10 bg-black/80">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <div className="grid gap-2">
                {nav.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/5',
                        isActive ? 'bg-white/10 text-white' : 'text-white/80',
                      )
                    }
                  >
                    <span>{n.label}</span>
                    {n.to === '/cart' ? <CartBadge /> : null}
                  </NavLink>
                ))}
                <Link to="/admin" onClick={() => setOpen(false)} className="pt-1">
                  <Button variant="gold" className="w-full">
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div key={location.pathname} className="animate-[fadeIn_220ms_ease-out]">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="text-sm font-extrabold">{BRAND.name}</div>
            <div className="mt-2 text-sm text-white/60">
              Spiritual, natural, and professional herbal products designed to support holistic wellness.
            </div>
          </div>
          <div className="text-sm text-white/70">
            <div className="font-semibold text-white">Shop Categories</div>
            <div className="mt-2 grid gap-1">
              <Link to="/shop?category=Herbal%20Medicine" className="hover:text-white">
                Herbal Medicine
              </Link>
              <Link to="/shop?category=Herbal%20Food" className="hover:text-white">
                Herbal Food
              </Link>
              <Link to="/shop?category=Spiritual%20Products" className="hover:text-white">
                Spiritual Products
              </Link>
            </div>
          </div>
          <div className="text-sm text-white/70">
            <div className="font-semibold text-white">Quick Links</div>
            <div className="mt-2 grid gap-1">
              <Link to="/about" className="hover:text-white">
                About
              </Link>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
              <Link to="/admin" className="hover:text-white">
                Admin
              </Link>
            </div>
            <div className="mt-4 text-xs text-white/40">© {new Date().getFullYear()} {BRAND.name}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
