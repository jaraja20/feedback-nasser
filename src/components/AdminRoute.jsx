import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth.jsx'
import { useRole } from '../lib/useRole.jsx'

// Como ProtectedRoute, pero además exige rol "administrador".
// Si el usuario está logueado pero no es administrador, lo manda de vuelta
// al panel general en vez de dejarlo ver la pantalla de usuarios.
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const { isAdmin, loadingRole } = useRole()

  if (loading || loadingRole) {
    return (
      <div className="page">
        <main className="page-main" style={{ alignItems: 'center' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'rgba(220,38,38,0.2)' }} />
        </main>
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/admin" replace />

  return children
}
