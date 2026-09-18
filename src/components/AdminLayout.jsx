import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/useAuth.jsx'
import { useRole } from '../lib/useRole.jsx'
import { sucursalLabel, roleLabel } from '../lib/constants'
import {
  IconInbox,
  IconChart,
  IconClipboard,
  IconQr,
  IconLock,
  IconLogout,
  IconMenu,
  IconX,
} from './Icons'

// Layout compartido de todas las pantallas del panel: logo + menú lateral
// (Atendimientos / Dashboard / Relatorio / Usuarios / QR) + botón de salir.
// Qué ítems se muestran depende del rol de quien está logueado.
export default function AdminLayout({ children }) {
  const { user } = useAuth()
  const { role, sucursal, isAdministrador, canGestionarUsuarios } = useRole()
  const [abierto, setAbierto] = useState(false)

  const puedeVerQR = role === 'administrador' || role === 'jefe'

  const items = [
    { to: '/admin', label: 'Atendimientos', icon: IconInbox, end: true },
    { to: '/admin/dashboard', label: 'Dashboard', icon: IconChart },
    { to: '/admin/reportes', label: 'Relatorio', icon: IconClipboard },
    ...(puedeVerQR ? [{ to: '/admin/qr', label: 'Códigos QR', icon: IconQr }] : []),
    ...(canGestionarUsuarios ? [{ to: '/admin/usuarios', label: 'Usuarios', icon: IconLock }] : []),
  ]

  return (
    <div className="admin-shell-v2">
      <button className="sidebar-toggle" onClick={() => setAbierto(true)} aria-label="Abrir menú">
        <IconMenu width={22} height={22} />
      </button>

      {abierto && <div className="sidebar-overlay" onClick={() => setAbierto(false)} />}

      <aside className={`admin-sidebar${abierto ? ' open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo-nasser.png" alt="Nasser Cubiertas" />
          <button className="sidebar-close" onClick={() => setAbierto(false)} aria-label="Cerrar menú">
            <IconX width={20} height={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => setAbierto(false)}
            >
              <it.icon width={18} height={18} />
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-email">{user?.email}</div>
            <div className="sidebar-user-role">
              {roleLabel(role)}
              {sucursal ? ` · ${sucursalLabel(sucursal)}` : ''}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => signOut(auth)} style={{ width: '100%' }}>
            <IconLogout width={16} height={16} />
            Salir
          </button>
        </div>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  )
}
