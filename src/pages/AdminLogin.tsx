import { useEffect, useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/admin/useAdminAuth'
import { Button, Input, Panel } from '../components/ui'

function authErrorInfo(err: unknown): { title: string; message: string; details?: string } {
  const rawMsg = err instanceof Error ? err.message : 'Login failed'
  const code =
    err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : null

  const fallback = { title: 'Login failed', message: rawMsg, details: code ?? undefined }

  if (!code) return fallback

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return { title: 'Incorrect credentials', message: 'The email or password is incorrect. Please try again.', details: code }
    case 'auth/invalid-email':
      return { title: 'Invalid email', message: 'Please enter a valid email address.', details: code }
    case 'auth/too-many-requests':
      return {
        title: 'Too many attempts',
        message: 'Too many failed login attempts. Please wait a moment and try again.',
        details: code,
      }
    default:
      return fallback
  }
}

export function AdminLoginPage() {
  const nav = useNavigate()
  const { login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; details?: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorModal(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      nav('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      setErrorModal(authErrorInfo(err))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!errorModal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setErrorModal(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [errorModal])

  return (
    <>
      <Panel className="mx-auto max-w-lg p-8">
        <div className="text-xs font-semibold tracking-[0.25em] text-[#1f5f3a]">ADMIN</div>
        <h1 className="mt-2 text-3xl font-extrabold">Login</h1>
        <div className="mt-3 text-sm text-white/70">Login to manage products, images, and stock quantities.</div>

        <form onSubmit={submit} className="mt-6 grid gap-3">
          <Input placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="gold" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/shop" className="sm:flex-1">
            <Button variant="ghost" className="w-full" type="button">
              Back to Shop
            </Button>
          </Link>
          <Link to="/" className="sm:flex-1">
            <Button variant="ghost" className="w-full" type="button">
              Home
            </Button>
          </Link>
        </div>
      </Panel>

      {errorModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setErrorModal(null)}
            aria-label="Close error dialog"
          />
          <Panel
            className="relative w-full max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-error-title"
          >
            <div className="text-sm font-extrabold" id="admin-login-error-title">
              {errorModal.title}
            </div>
            <div className="mt-2 text-sm text-white/70">{errorModal.message}</div>
            {errorModal.details ? (
              <div className="mt-3 text-xs font-semibold text-white/50">Code: {errorModal.details}</div>
            ) : null}
            <div className="mt-5 flex justify-end">
              <Button variant="gold" type="button" onClick={() => setErrorModal(null)}>
                OK
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  )
}
