import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../lib/useAuth.jsx'
import { crearUsuarioAdmin, eliminarUsuario } from '../../lib/adminUsers'
import AdminLayout from '../../components/AdminLayout'
import EditarUsuarioModal from '../../components/EditarUsuarioModal'
import { ROLES, roleLabel, SUCURSALES, sucursalLabel } from '../../lib/constants'
import { IconLock } from '../../components/Icons'

export default function Usuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('jefe')
  const [sucursal, setSucursal] = useState(SUCURSALES[0].value)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [editando, setEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const necesitaSucursal = ROLES.find((r) => r.value === rol)?.necesitaSucursal

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'admins'), orderBy('creadoEn', 'desc')), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const cantAdministradores = usuarios.filter((u) => u.rol === 'administrador').length
  const esUltimoAdministrador = (u) => u.rol === 'administrador' && cantAdministradores <= 1

  function cerrarEdicion(mensaje) {
    setEditando(null)
    if (mensaje) {
      setError('')
      setOk(mensaje)
    }
  }

  async function borrar(u) {
    if (!window.confirm(`¿Eliminar al usuario ${u.email}? Pierde el acceso al panel de inmediato. No se puede deshacer.`)) return
    setError('')
    setOk('')
    setEliminando(u.id)
    try {
      const { soloAcceso } = await eliminarUsuario(u.id)
      setOk(
        soloAcceso
          ? `Se le quitó el acceso a ${u.email}. Su cuenta de login sigue existiendo en Firebase (falta configurar la cuenta de servicio, ver README).`
          : `Usuario ${u.email} eliminado.`,
      )
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo eliminar el usuario.')
    } finally {
      setEliminando(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setOk('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setCargando(true)
    try {
      await crearUsuarioAdmin({
        email: email.trim(),
        password,
        rol,
        sucursal: necesitaSucursal ? sucursal : null,
        creadoPor: user?.email,
      })
      setOk(`Usuario ${email} creado correctamente.`)
      setEmail('')
      setPassword('')
      setRol('jefe')
      setSucursal(SUCURSALES[0].value)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Ese email ya tiene una cuenta creada.')
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil.')
      } else if (err.code === 'auth/invalid-email') {
        setError('El email no es válido.')
      } else {
        setError('No se pudo crear el usuario. Intentá nuevamente.')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-main-inner">
        <div className="admin-page-header">
          <h1>Usuarios administradores</h1>
          <p>Solo un administrador puede crear, editar o eliminar cuentas del panel</p>
        </div>

        <div className="card" style={{ maxWidth: '32rem', marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div className="card-heading">
              <div className="card-heading-icon">
                <IconLock width={22} height={22} />
              </div>
              <div>
                <h1>Crear usuario</h1>
                <p>Elegí el rol y, si corresponde, la sucursal</p>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {ok && <div className="alert alert-success">{ok}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="password">Contraseña temporal</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <div className="hint">
                  Mínimo 6 caracteres. Compartíla por un medio seguro; la persona la puede cambiar después.
                </div>
              </div>
              <div className="field">
                <label htmlFor="rol">Rol</label>
                <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {necesitaSucursal && (
                <div className="field">
                  <label htmlFor="sucursal">Sucursal</label>
                  <select id="sucursal" value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
                    {SUCURSALES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={cargando}>
                {cargando && <span className="spinner" />}
                {cargando ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
          </div>
        </div>

        <div className="list">
          {usuarios.map((u) => (
            <div key={u.id} className="item-card">
              <div className="item-top">
                <div>
                  <div className="item-name">{u.email}</div>
                  <div className="item-meta">
                    Creado por {u.creadoPor || '-'}
                    {u.sucursal ? ` · ${sucursalLabel(u.sucursal)}` : ''}
                  </div>
                </div>
                <span className={`badge ${u.rol === 'administrador' ? 'badge-done' : 'badge-progress'}`}>
                  {roleLabel(u.rol)}
                </span>
              </div>
              <div className="item-footer">
                <span className="item-meta">{u.id === user?.uid ? 'Tu cuenta' : ''}</span>
                <div className="item-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditando(u)}>
                    Editar
                  </button>
                  {u.id !== user?.uid && !esUltimoAdministrador(u) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => borrar(u)}
                      disabled={eliminando === u.id}
                    >
                      {eliminando === u.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {editando && (
          <EditarUsuarioModal
            usuario={editando}
            esUnoMismo={editando.id === user?.uid}
            esUltimoAdministrador={esUltimoAdministrador(editando)}
            onCerrar={cerrarEdicion}
          />
        )}
      </div>
    </AdminLayout>
  )
}
