import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { api } from '../../api/client'
import { auth } from '../../firebase'
import { AdminAuthContext } from './context'

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase()

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setToken(null)
        return
      }

      const email = (user.email ?? '').trim().toLowerCase()
      if (adminEmail && email !== adminEmail) {
        await api.admin.logout()
        setToken(null)
        return
      }

      setToken('firebase')
    })

    return () => unsub()
  }, [])

  const value = useMemo(() => {
    return {
      token,
      isAuthed: Boolean(token),
      login: async (email: string, password: string) => {
        const res = await api.admin.login({ email, password })
        setToken(res.token)
      },
      logout: () => {
        setToken(null)
        void api.admin.logout()
      },
    }
  }, [token])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
