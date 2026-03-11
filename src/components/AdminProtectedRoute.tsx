import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export function AdminProtectedRoute() {
  const { isAuthed } = useAdminAuth()
  if (!isAuthed) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

