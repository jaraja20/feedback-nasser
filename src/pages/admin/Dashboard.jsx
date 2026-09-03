import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../../lib/firebase'
import { useAuth } from '../../lib/useAuth.jsx'
import { AREAS, ESTADOS } from '../../lib/constants'
import { IconInbox, IconStar, IconQr, IconLogout, IconClock, IconCheck } from '../../components/Icons'

function areaLabel(value) {
  return AREAS.find((a) => a.value === value)?.label || value || '-'
}

function formatFecha(ts) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })
}

// Beep corto sin necesidad de archivos de audio externos.
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // El navegador puede bloquear el audio hasta que haya interacción; no es crítico.
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('quejas')
  const [quejas, setQuejas] = useState([])
  const [valoraciones, setValoraciones] = useState([])
  const [filtro, setFiltro] = useState('activas')
  const [loaded, setLoaded] = useState(false)
  const firstLoad = useRef(true)
  const prevIds = useRef(new Set())

  useEffect(() => {
    const q = query(collection(db, 'quejas'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (!firstLoad.current) {
        const nuevas = items.filter((it) => !prevIds.current.has(it.id))
        if (nuevas.length > 0) playBeep()
      }
      prevIds.current = new Set(items.map((it) => it.id))
      firstLoad.current = false

      setQuejas(items)
      setLoaded(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'valoraciones'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setValoraciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function cambiarEstado(id, estado) {
    await updateDoc(doc(db, 'quejas', id), {
      estado,
      atendidoPor: estado === 'nueva' ? null : user?.email || null,
      atendidoAt: estado === 'nueva' ? null : serverTimestamp(),
    })
  }

  const quejasFiltradas = quejas.filter((q) => {
    if (filtro === 'todas') return true
    if (filtro === 'activas') return q.estado !== 'resuelta'
    return q.estado === filtro
  })

  const nuevas = quejas.filter((q) => q.estado === 'nueva').length
  const enAtencion = quejas.filter((q) => q.estado === 'en_atencion').length
  const promedio = valoraciones.length
    ? (valoraciones.reduce((sum, v) => sum + (v.puntuacion || 0), 0) / valoraciones.length).toFixed(1)
    : '-'

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <img src="/logo-nasser.png" alt="Nasser Cubiertas" />
          <div className="admin-topbar-title">
            Panel de Feedback
            <span>{user?.email}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin/qr" className="btn btn-secondary btn-sm">
            <IconQr width={16} height={16} />
            Códigos QR
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={() => signOut(auth)}>
            <IconLogout width={16} height={16} />
            Salir
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{nuevas}</div>
            <div className="stat-label">Quejas nuevas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-info)' }}>{enAtencion}</div>
            <div className="stat-label">En atención</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{quejas.length}</div>
            <div className="stat-label">Quejas totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {promedio} <IconStar width={16} height={16} style={{ verticalAlign: 'middle' }} />
            </div>
            <div className="stat-label">Valoración promedio ({valoraciones.length})</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn${tab === 'quejas' ? ' active' : ''}`} onClick={() => setTab('quejas')}>
            Quejas ({quejas.length})
          </button>
          <button className={`tab-btn${tab === 'valoraciones' ? ' active' : ''}`} onClick={() => setTab('valoraciones')}>
            Valoraciones ({valoraciones.length})
          </button>
        </div>

        {tab === 'quejas' && (
          <>
            <div className="filter-row">
              {['activas', 'nueva', 'en_atencion', 'resuelta', 'todas'].map((f) => (
                <button
                  key={f}
                  className={`chip${filtro === f ? ' active' : ''}`}
                  onClick={() => setFiltro(f)}
                >
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
              {quejasFiltradas.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-top">
                    <div>
                      <div className="item-name">{item.nombre || 'Cliente anónimo'}</div>
                      <div className="item-meta">
                        {areaLabel(item.area)} · {formatFecha(item.createdAt)}
                      </div>
                    </div>
                    <span className={`badge ${ESTADOS[item.estado]?.badge || ''}`}>
                      {item.estado === 'nueva' && <IconClock width={12} height={12} />}
                      {item.estado === 'resuelta' && <IconCheck width={12} height={12} />}
                      {ESTADOS[item.estado]?.label || item.estado}
                    </span>
                  </div>

                  <div className="item-message">{item.mensaje}</div>

                  {(item.telefono || item.email) && (
                    <div className="item-meta">
                      {item.telefono && <span>📞 {item.telefono} </span>}
                      {item.email && <span>✉️ {item.email}</span>}
                    </div>
                  )}

                  <div className="item-footer">
                    <div className="item-meta">
                      {item.atendidoPor ? `Atendido por ${item.atendidoPor}` : 'Sin asignar'}
                    </div>
                    <div className="item-actions">
                      {item.estado !== 'en_atencion' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => cambiarEstado(item.id, 'en_atencion')}>
                          Tomar caso
                        </button>
                      )}
                      {item.estado !== 'resuelta' && (
                        <button className="btn btn-primary btn-sm" onClick={() => cambiarEstado(item.id, 'resuelta')}>
                          Marcar resuelta
                        </button>
                      )}
                      {item.estado === 'resuelta' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => cambiarEstado(item.id, 'nueva')}>
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'valoraciones' && (
          <div className="list">
            {valoraciones.length === 0 && (
              <div className="empty-state">
                <IconStar width={32} height={32} style={{ marginBottom: '0.5rem' }} />
                <div>Todavía no hay valoraciones.</div>
              </div>
            )}
            {valoraciones.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-top">
                  <div>
                    <div className="item-name">{item.nombre || 'Cliente anónimo'}</div>
                    <div className="item-meta">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
