import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { api } from '../../api/client'
import { auth, db } from '../../firebase'
import { AdminAuthContext } from './context'

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !db) {
        setToken(null)
        setLoading(false)
        return
      }

      try {
        // Check if user exists in the 'admins' collection
        const adminRef = doc(db, 'admins', user.uid)
        const adminSnap = await getDoc(adminRef)

        if (!adminSnap.exists()) {
          console.warn('Unauthorized access attempt: User is not an admin.')
          await api.admin.logout()
          setToken(null)
        } else {
          setToken('firebase')
        }
      } catch (err) {
        console.error('Error verifying admin status:', err)
        setToken(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  const value = useMemo(() => {
    return {
      token,
      isAuthed: Boolean(token),
      login: async (email: string, password: string) => {
        const res = await api.admin.login({ email, password })
        // After successful login, the onAuthStateChanged listener above 
        // will handle the Firestore verification.
        setToken(res.token)
      },
      logout: () => {
        setToken(null)
        void api.admin.logout()
      },
    }
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-sm font-semibold tracking-widest animate-pulse">VERIFYING AUTH...</div>
      </div>
    )
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
