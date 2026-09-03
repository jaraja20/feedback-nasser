import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth.jsx'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Queja from './pages/Queja'
import Valoracion from './pages/Valoracion'
import Gracias from './pages/Gracias'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import QRPage from './pages/admin/QRPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/queja" element={<Queja />} />
        <Route path="/valoracion" element={<Valoracion />} />
        <Route path="/gracias" element={<Gracias />} />

        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/qr"
          element={
            <ProtectedRoute>
              <QRPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>
    </AuthProvider>
  )
}
