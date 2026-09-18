import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useRole } from '../../lib/useRole.jsx'
import AdminLayout from '../../components/AdminLayout'
import { AREAS, SUCURSALES, sucursalLabel } from '../../lib/constants'
import { IconChart } from '../../components/Icons'

function areaLabel(value) {
  return AREAS.find((a) => a.value === value)?.label || value || '-'
}

function tsToDate(ts) {
  return ts?.toDate ? ts.toDate() : null
}

const PERIODOS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 0, label: 'Todo' },
]

function BarChart({ data, max, color = 'var(--color-primary)' }) {
  return (
    <div>
      {data.map((row) => (
        <div className="bar-row" key={row.label}>
          <div className="bar-label">{row.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${max ? (row.value / max) * 100 : 0}%`, background: color }}
            />
          </div>
          <div className="bar-value">{row.value}</div>
        </div>
      ))}
      {data.length === 0 && <div className="muted">Sin datos todavía.</div>}
    </div>
  )
}

export default function DashboardCharts() {
  const { role, sucursal, isGlobal, loadingRole } = useRole()
  const [quejas, setQuejas] = useState([])
  const [valoraciones, setValoraciones] = useState([])
  const [periodo, setPeriodo] = useState(30)

  useEffect(() => {
    if (loadingRole || !role) return
    const baseQ = collection(db, 'quejas')
    const baseV = collection(db, 'valoraciones')
    const q1 =
      role === 'jefe'
        ? query(baseQ, where('sucursal', '==', sucursal), orderBy('createdAt', 'desc'))
        : query(baseQ, orderBy('createdAt', 'desc'))
    const q2 =
      role === 'jefe'
        ? query(baseV, where('sucursal', '==', sucursal), orderBy('createdAt', 'desc'))
        : query(baseV, orderBy('createdAt', 'desc'))

    const unsub1 = onSnapshot(q1, (snap) => setQuejas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const unsub2 = onSnapshot(q2, (snap) => setValoraciones(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => {
      unsub1()
      unsub2()
    }
  }, [role, sucursal, loadingRole])

  const desdeFecha = useMemo(() => {
    if (!periodo) return null
    const d = new Date()
    d.setDate(d.getDate() - periodo)
    return d
  }, [periodo])

  const quejasPeriodo = useMemo(() => {
    if (!desdeFecha) return quejas
    return quejas.filter((q) => {
      const d = tsToDate(q.createdAt)
      return d && d >= desdeFecha
    })
  }, [quejas, desdeFecha])

  const valoracionesPeriodo = useMemo(() => {
    if (!desdeFecha) return valoraciones
    return valoraciones.filter((v) => {
      const d = tsToDate(v.createdAt)
      return d && d >= desdeFecha
    })
  }, [valoraciones, desdeFecha])

  // Quejas por sucursal (solo tiene sentido para roles globales).
  const porSucursal = useMemo(() => {
    const conteo = {}
    quejasPeriodo.forEach((q) => {
      conteo[q.sucursal] = (conteo[q.sucursal] || 0) + 1
    })
    return SUCURSALES.map((s) => ({ label: s.label, value: conteo[s.value] || 0 })).sort((a, b) => b.value - a.value)
  }, [quejasPeriodo])

  // Problema más recurrente (por área).
  const porArea = useMemo(() => {
    const conteo = {}
    quejasPeriodo.forEach((q) => {
      conteo[q.area] = (conteo[q.area] || 0) + 1
    })
    return AREAS.map((a) => ({ label: a.label, value: conteo[a.value] || 0 })).sort((a, b) => b.value - a.value)
  }, [quejasPeriodo])

  // Valoración promedio por sucursal.
  const promedioPorSucursal = useMemo(() => {
    const grupos = {}
    valoracionesPeriodo.forEach((v) => {
      if (!grupos[v.sucursal]) grupos[v.sucursal] = []
      grupos[v.sucursal].push(v.puntuacion || 0)
    })
    return SUCURSALES.map((s) => {
      const arr = grupos[s.value] || []
      const prom = arr.length ? arr.reduce((sum, n) => sum + n, 0) / arr.length : 0
      return { label: s.label, value: Number(prom.toFixed(1)) }
    }).sort((a, b) => b.value - a.value)
  }, [valoracionesPeriodo])

  const total = quejasPeriodo.length
  const resueltas = quejasPeriodo.filter((q) => q.estado === 'resuelta').length
  const tasaResolucion = total ? Math.round((resueltas / total) * 100) : 0
  const urgentesActivos = quejasPeriodo.filter((q) => q.enSitio && q.estado !== 'resuelta').length
  const promedioGeneral = valoracionesPeriodo.length
    ? (valoracionesPeriodo.reduce((s, v) => s + (v.puntuacion || 0), 0) / valoracionesPeriodo.length).toFixed(1)
    : '-'

  const maxSucursal = Math.max(1, ...porSucursal.map((r) => r.value))
  const maxArea = Math.max(1, ...porArea.map((r) => r.value))

  return (
    <AdminLayout>
      <div className="admin-main-inner">
        <div className="admin-page-header">
          <h1>Dashboard</h1>
          <p>{role === 'jefe' ? sucursalLabel(sucursal) : 'Panorama general de todas las sucursales'}</p>
        </div>

        <div className="filter-row">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              className={`chip${periodo === p.value ? ' active' : ''}`}
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Quejas en el período</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{tasaResolucion}%</div>
            <div className="stat-label">Tasa de resolución</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{urgentesActivos}</div>
            <div className="stat-label">Casos urgentes sin cerrar</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{promedioGeneral} ★</div>
            <div className="stat-label">Valoración promedio ({valoracionesPeriodo.length})</div>
          </div>
        </div>

        {isGlobal && (
          <div className="chart-card">
            <h2>
              <IconChart width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Quejas por sucursal
            </h2>
            <BarChart data={porSucursal} max={maxSucursal} />
          </div>
        )}

        <div className="chart-card">
          <h2>
            <IconChart width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Problema más recurrente
          </h2>
          <BarChart data={porArea} max={maxArea} />
        </div>

        {isGlobal && (
          <div className="chart-card">
            <h2>
              <IconChart width={16} height={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Valoración promedio por sucursal
            </h2>
            <BarChart data={promedioPorSucursal} max={5} color="var(--color-success)" />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
