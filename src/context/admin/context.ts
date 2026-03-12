import { createContext } from 'react'

export type AdminAuthState = {
  token: string | null
  isAuthed: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AdminAuthContext = createContext<AdminAuthState | null>(null)

