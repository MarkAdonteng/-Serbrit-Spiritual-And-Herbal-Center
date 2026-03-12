import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/admin/useAdminAuth'
import { Button, Input, Panel } from '../components/ui'

export function AdminLoginPage() {
  const nav = useNavigate()
  const { login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      nav('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
        {error ? <div className="text-sm font-semibold text-[#c9a227]">{error}</div> : null}
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
  )
}
