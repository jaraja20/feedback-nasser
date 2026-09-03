import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <main className="page-main" style={{ alignItems: 'center' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'rgba(220,38,38,0.2)' }} />
        </main>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
