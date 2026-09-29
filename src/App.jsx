import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Home from './pages/Home'
import SucursalHome from './pages/SucursalHome'
import Feedback from './pages/Feedback'
import Gracias from './pages/Gracias'
import Login from './pages/admin/Login'
import Atendimientos from './pages/admin/Atendimientos'
import QRPage from './pages/admin/QRPage'
import Reportes from './pages/admin/Reportes'
import Usuarios from './pages/admin/Usuarios'
import DashboardCharts from './pages/admin/DashboardCharts'

// Los QR viejos (impresos en la primera tanda de flyers) apuntaban a
// /queja/:sucursal y /valoracion/:sucursal. Ahora todo está centralizado en
// un solo formulario por sucursal, así que estas rutas quedan solo como
// redirección por si algún flyer viejo sigue pegado en algún local.
function RedirigirAFeedback() {
  const { sucursal } = useParams()
  return <Navigate to={`/feedback/${sucursal}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/s/:sucursal" element={<SucursalHome />} />
        <Route path="/feedback/:sucursal" element={<Feedback />} />
        <Route path="/queja/:sucursal" element={<RedirigirAFeedback />} />
        <Route path="/valoracion/:sucursal" element={<RedirigirAFeedback />} />
        {/* Rutas viejas sin sucursal: mandan a elegir sucursal primero */}
        <Route path="/queja" element={<Home />} />
        <Route path="/valoracion" element={<Home />} />
        <Route path="/gracias" element={<Gracias />} />

        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Atendimientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <DashboardCharts />
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
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <AdminRoute>
              <Usuarios />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>
    </AuthProvider>
  )
}
