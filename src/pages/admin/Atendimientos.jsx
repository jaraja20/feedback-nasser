import { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../lib/useAuth.jsx'
import { useRole } from '../../lib/useRole.jsx'
import AdminLayout from '../../components/AdminLayout'
import ResolverModal from '../../components/ResolverModal'
import { AREAS, ESTADOS, SUCURSALES, sucursalLabel } from '../../lib/constants'
import { IconInbox, IconStar, IconClock, IconCheck, IconAlert } from '../../components/Icons'

function areaLabel(value) {
  return AREAS.find((a) => a.value === value)?.label || value || '-'
}

function formatFecha(ts) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })
}

// Beep corto sin necesidad de archivos de audio externos. Uno más agudo y
// doble cuando el cliente está en el local (prioridad).
function playBeep(urgente) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const tonos = urgente ? [1046, 1318] : [880]
    tonos.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.16, ctx.currentTime + i * 0.22)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.4)
      osc.start(ctx.currentTime + i * 0.22)
      osc.stop(ctx.currentTime + i * 0.22 + 0.4)
    })
  } catch {
    // El navegador puede bloquear el audio hasta que haya interacción; no es crítico.
  }
}

export default function Atendimientos() {
  const { user } = useAuth()
  const { role, sucursal, isGlobal, canOperar, canBorrar, loadingRole } = useRole()
  const [tab, setTab] = useState('quejas')
  const [quejas, setQuejas] = useState([])
  const [valoraciones, setValoraciones] = useState([])
  const [filtro, setFiltro] = useState('activas')
  const [filtroSucursal, setFiltroSucursal] = useState('todas')
  const [loaded, setLoaded] = useState(false)
  const [resolviendo, setResolviendo] = useState(null)
  const firstLoad = useRef(true)
  const prevIds = useRef(new Set())

  useEffect(() => {
    if (loadingRole || !role) return
    const base = collection(db, 'quejas')
    const q =
      role === 'jefe'
        ? query(base, where('sucursal', '==', sucursal), orderBy('createdAt', 'desc'))
        : query(base, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (!firstLoad.current) {
        const nuevas = items.filter((it) => !prevIds.current.has(it.id))
        if (nuevas.length > 0) playBeep(nuevas.some((it) => it.enSitio))
      }
      prevIds.current = new Set(items.map((it) => it.id))
      firstLoad.current = false

      setQuejas(items)
      setLoaded(true)
    })
    return unsub
  }, [role, sucursal, loadingRole])

  useEffect(() => {
    if (loadingRole || !role) return
    const base = collection(db, 'valoraciones')
    const q =
      role === 'jefe'
        ? query(base, where('sucursal', '==', sucursal), orderBy('createdAt', 'desc'))
        : query(base, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => setValoraciones(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [role, sucursal, loadingRole])

  async function tomarCaso(id) {
    await updateDoc(doc(db, 'quejas', id), {
      estado: 'en_atencion',
      atendidoPor: user?.email || null,
      atendidoAt: serverTimestamp(),
    })
  }

  async function reabrir(id) {
    await updateDoc(doc(db, 'quejas', id), { estado: 'nueva', atendidoPor: null, atendidoAt: null })
  }

  async function confirmarResolucion({ motivoResuelto, accionTomada }) {
    await updateDoc(doc(db, 'quejas', resolviendo.id), {
      estado: 'resuelta',
      atendidoPor: user?.email || resolviendo.atendidoPor || null,
      atendidoAt: serverTimestamp(),
      motivoResuelto,
      accionTomada,
    })
    setResolviendo(null)
  }

  async function borrarQueja(id) {
    if (!window.confirm('¿Eliminar esta queja definitivamente? No se puede deshacer.')) return
    await deleteDoc(doc(db, 'quejas', id))
  }

  async function borrarValoracion(id) {
    if (!window.confirm('¿Eliminar esta valoración definitivamente? No se puede deshacer.')) return
    await deleteDoc(doc(db, 'valoraciones', id))
  }

  const quejasSucursal = useMemo(
    () => (isGlobal && filtroSucursal !== 'todas' ? quejas.filter((q) => q.sucursal === filtroSucursal) : quejas),
    [quejas, filtroSucursal, isGlobal],
  )
  const valoracionesSucursal = useMemo(
    () =>
      isGlobal && filtroSucursal !== 'todas'
        ? valoraciones.filter((v) => v.sucursal === filtroSucursal)
        : valoraciones,
    [valoraciones, filtroSucursal, isGlobal],
  )

  const quejasFiltradas = useMemo(() => {
    const lista = quejasSucursal.filter((q) => {
      if (filtro === 'todas') return true
      if (filtro === 'activas') return q.estado !== 'resuelta'
      return q.estado === filtro
    })
    // Prioridad: en el local ahora mismo y todavía sin resolver, siempre arriba.
    return [...lista].sort((a, b) => {
      const pa = a.enSitio && a.estado !== 'resuelta' ? 1 : 0
      const pb = b.enSitio && b.estado !== 'resuelta' ? 1 : 0
      if (pa !== pb) return pb - pa
      return 0 // ya vienen ordenadas por fecha desde la consulta
    })
  }, [quejasSucursal, filtro])

  const nuevas = quejasSucursal.filter((q) => q.estado === 'nueva').length
  const enAtencion = quejasSucursal.filter((q) => q.estado === 'en_atencion').length
  const urgentes = quejasSucursal.filter((q) => q.enSitio && q.estado !== 'resuelta').length
  const promedio = valoracionesSucursal.length
    ? (valoracionesSucursal.reduce((s, v) => s + (v.puntuacion || 0), 0) / valoracionesSucursal.length).toFixed(1)
    : '-'

  return (
    <AdminLayout>
      <div className="admin-main-inner">
        <div className="admin-page-header">
          <h1>Atendimientos</h1>
          <p>
            {role === 'jefe'
              ? sucursalLabel(sucursal)
              : `Todas las sucursales${filtroSucursal !== 'todas' ? ` · ${sucursalLabel(filtroSucursal)}` : ''}`}
          </p>
        </div>

        {isGlobal && (
          <div className="filter-row">
            <button
              className={`chip${filtroSucursal === 'todas' ? ' active' : ''}`}
              onClick={() => setFiltroSucursal('todas')}
            >
              Todas las sucursales
            </button>
            {SUCURSALES.map((s) => (
              <button
                key={s.value}
                className={`chip${filtroSucursal === s.value ? ' active' : ''}`}
                onClick={() => setFiltroSucursal(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{urgentes}</div>
            <div className="stat-label">Clientes esperando en el local</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{nuevas}</div>
            <div className="stat-label">Quejas nuevas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-info)' }}>{enAtencion}</div>
            <div className="stat-label">En atención</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {promedio} <IconStar width={16} height={16} style={{ verticalAlign: 'middle' }} />
            </div>
            <div className="stat-label">Valoración promedio ({valoracionesSucursal.length})</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn${tab === 'quejas' ? ' active' : ''}`} onClick={() => setTab('quejas')}>
            Quejas ({quejasSucursal.length})
          </button>
          <button className={`tab-btn${tab === 'valoraciones' ? ' active' : ''}`} onClick={() => setTab('valoraciones')}>
            Valoraciones ({valoracionesSucursal.length})
          </button>
        </div>

        {tab === 'quejas' && (
          <>
            <div className="filter-row">
              {['activas', 'nueva', 'en_atencion', 'resuelta', 'todas'].map((f) => (
                <button key={f} className={`chip${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
                  {f === 'activas' ? 'Activas' : f === 'todas' ? 'Todas' : ESTADOS[f]?.label}
                </button>
              ))}
            </div>

            {loaded && quejasFiltradas.length === 0 && (
              <div className="empty-state">
                <IconInbox width={32} height={32} style={{ marginBottom: '0.5rem' }} />
                <div>No hay quejas en este filtro.</div>
              </div>
            )}

            <div className="list">
              {quejasFiltradas.map((item) => {
                const urgente = item.enSitio && item.estado !== 'resuelta'
                return (
                  <div key={item.id} className={`item-card${urgente ? ' urgente' : ''}`}>
                    <div className="item-top">
                      <div>
                        <div className="item-name">{item.nombre || 'Cliente anónimo'}</div>
                        <div className="item-meta">
                          {isGlobal ? `${sucursalLabel(item.sucursal)} · ` : ''}
                          {areaLabel(item.area)} · {formatFecha(item.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {urgente && (
                          <span className="badge badge-urgente">
                            <IconAlert width={12} height={12} />
                            En el local
                          </span>
                        )}
                        <span className={`badge ${ESTADOS[item.estado]?.badge || ''}`}>
                          {item.estado === 'nueva' && <IconClock width={12} height={12} />}
                          {item.estado === 'resuelta' && <IconCheck width={12} height={12} />}
                          {ESTADOS[item.estado]?.label || item.estado}
                        </span>
                      </div>
                    </div>

                    <div className="item-message">{item.mensaje}</div>

                    {(item.telefono || item.email) && (
                      <div className="item-meta">
                        {item.telefono && <span>📞 {item.telefono} </span>}
                        {item.email && <span>✉️ {item.email}</span>}
                      </div>
                    )}

                    {item.estado === 'resuelta' && item.accionTomada && (
                      <div className="item-meta" style={{ marginTop: '0.5rem' }}>
                        <strong>Resolución:</strong> {item.accionTomada}
                      </div>
                    )}

                    <div className="item-footer">
                      <div className="item-meta">{item.atendidoPor ? `Atendido por ${item.atendidoPor}` : 'Sin asignar'}</div>
                      {(canOperar || canBorrar) && (
                        <div className="item-actions">
                          {canOperar && item.estado !== 'en_atencion' && item.estado !== 'resuelta' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => tomarCaso(item.id)}>
                              Tomar caso
                            </button>
                          )}
                          {canOperar && item.estado !== 'resuelta' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setResolviendo(item)}>
                              Marcar resuelta
                            </button>
                          )}
                          {canOperar && item.estado === 'resuelta' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => reabrir(item.id)}>
                              Reabrir
                            </button>
                          )}
                          {canBorrar && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--color-primary)' }}
                              onClick={() => borrarQueja(item.id)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'valoraciones' && (
          <div className="list">
            {valoracionesSucursal.length === 0 && (
              <div className="empty-state">
                <IconStar width={32} height={32} style={{ marginBottom: '0.5rem' }} />
                <div>Todavía no hay valoraciones.</div>
              </div>
            )}
            {valoracionesSucursal.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-top">
                  <div>
                    <div className="item-name">{item.nombre || 'Cliente anónimo'}</div>
                    <div className="item-meta">
                      {isGlobal ? `${sucursalLabel(item.sucursal)} · ` : ''}
                      {areaLabel(item.area)} · {formatFecha(item.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.15rem', color: 'var(--color-primary)' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar key={i} width={16} height={16} fill={i < item.puntuacion ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                {item.comentario && <div className="item-message">{item.comentario}</div>}
                {canBorrar && (
                  <div className="item-footer" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--color-primary)' }}
                      onClick={() => borrarValoracion(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {resolviendo && (
        <ResolverModal queja={resolviendo} onCancel={() => setResolviendo(null)} onConfirmar={confirmarResolucion} />
      )}
    </AdminLayout>
  )
}
