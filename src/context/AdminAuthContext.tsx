import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { api } from '../api/client'

type AdminAuthState = {
  token: string | null
  isAuthed: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthState | null>(null)

const STORAGE_KEY = 'serbrit_admin_token_v1'

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setToken(raw)
    } catch {
      setToken(null)
    }
  }, [])

  const value = useMemo<AdminAuthState>(() => {
    return {
      token,
      isAuthed: Boolean(token),
      login: async (email, password) => {
        const res = await api.admin.login({ email, password })
        setToken(res.token)
        try {
          localStorage.setItem(STORAGE_KEY, res.token)
        } catch {
          // ignore
        }
      },
      logout: () => {
        setToken(null)
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      },
    }
  }, [token])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}

