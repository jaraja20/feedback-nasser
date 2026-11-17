import { useState } from 'react'
import { ROLES, SUCURSALES } from '../lib/constants'
import { actualizarRol, cambiarEmail, cambiarPassword } from '../lib/adminUsers'

// Modal para editar una cuenta del panel: rol, sucursal, email y contraseña.
// El rol se guarda directo en Firestore; email y contraseña pasan por la
// función de servidor /api/usuarios.
export default function EditarUsuarioModal({ usuario, esUnoMismo, esUltimoAdministrador, onCerrar }) {
  const [email, setEmail] = useState(usuario.email || '')
  const [rol, setRol] = useState(usuario.rol)
  const [sucursal, setSucursal] = useState(usuario.sucursal || SUCURSALES[0].value)
  const [password, setPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const necesitaSucursal = ROLES.find((r) => r.value === rol)?.necesitaSucursal
  // Para no quedarse sin acceso: nadie cambia su propio rol, y el último
  // administrador no puede pasar a otro rol.
  const rolBloqueado = esUnoMismo || esUltimoAdministrador

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setGuardando(true)
    try {
      const nuevoEmail = email.trim()
      if (nuevoEmail !== usuario.email) await cambiarEmail(usuario.id, nuevoEmail)
      if (password) await cambiarPassword(usuario.id, password)
      if (rol !== usuario.rol || (necesitaSucursal && sucursal !== usuario.sucursal)) {
        await actualizarRol(usuario.id, { rol, sucursal })
      }
      onCerrar(`Usuario ${nuevoEmail} actualizado${password ? ', con contraseña nueva' : ''}.`)
    } catch (err) {
      console.error(err)
      setError(
        err.code === 'no_configurado'
          ? 'Para cambiar email o contraseña falta configurar la cuenta de servicio de Firebase en Vercel (ver README). El rol y la sucursal sí se pueden cambiar.'
          : err.message || 'No se pudo guardar. Intentá nuevamente.',
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onCerrar()}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Editar usuario</h2>
        <p className="muted">{usuario.email}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="edit-email">Email</label>
            <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="edit-password">Contraseña nueva</label>
            <input
              id="edit-password"
              type="password"
              autoComplete="new-password"
              placeholder="Dejala vacía para no cambiarla"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
            <div className="hint">Mínimo 6 caracteres. Compartíla por un medio seguro.</div>
          </div>
          <div className="field">
            <label htmlFor="edit-rol">Rol</label>
            <select id="edit-rol" value={rol} onChange={(e) => setRol(e.target.value)} disabled={rolBloqueado}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {rolBloqueado && (
              <div className="hint">
                {esUnoMismo
                  ? 'No podés cambiar tu propio rol.'
                  : 'Es el único administrador: no se le puede cambiar el rol.'}
              </div>
            )}
          </div>
          {necesitaSucursal && (
            <div className="field">
              <label htmlFor="edit-sucursal">Sucursal</label>
              <select id="edit-sucursal" value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
                {SUCURSALES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => onCerrar()}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando && <span className="spinner" />}
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
