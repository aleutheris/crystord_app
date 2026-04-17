import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthProvider'

export function AuthGuard() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
