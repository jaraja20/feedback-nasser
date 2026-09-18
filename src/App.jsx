import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Home from './pages/Home'
import SucursalHome from './pages/SucursalHome'
import Queja from './pages/Queja'
import Valoracion from './pages/Valoracion'
import Gracias from './pages/Gracias'
import Login from './pages/admin/Login'
import Atendimientos from './pages/admin/Atendimientos'
import QRPage from './pages/admin/QRPage'
import Reportes from './pages/admin/Reportes'
import Usuarios from './pages/admin/Usuarios'
import DashboardCharts from './pages/admin/DashboardCharts'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/s/:sucursal" element={<SucursalHome />} />
        <Route path="/queja/:sucursal" element={<Queja />} />
        <Route path="/valoracion/:sucursal" element={<Valoracion />} />
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
