import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-faint">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  return <Outlet />
}
