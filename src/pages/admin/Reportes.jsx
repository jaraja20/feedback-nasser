import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useRole } from '../../lib/useRole.jsx'
import AdminLayout from '../../components/AdminLayout'
import { AREAS, ESTADOS, SUCURSALES, sucursalLabel } from '../../lib/constants'
import { toCSV, downloadCSV } from '../../lib/csv'
import { generarPDF } from '../../lib/pdf'
import { IconInbox, IconStar } from '../../components/Icons'

function areaLabel(value) {
  return AREAS.find((a) => a.value === value)?.label || value || '-'
}

function tsToDate(ts) {
  return ts?.toDate ? ts.toDate() : null
}

function fmt(d) {
  return d ? d.toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : ''
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Reportes() {
  const { role, sucursal, isGlobal, loadingRole } = useRole()
  const [quejas, setQuejas] = useState([])
  const [valoraciones, setValoraciones] = useState([])
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState(todayStr())
  const [filtroSucursal, setFiltroSucursal] = useState('todas')

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

  function enRango(ts) {
    const d = tsToDate(ts)
    if (!d) return false
    if (desde && d < new Date(`${desde}T00:00:00`)) return false
    if (hasta && d > new Date(`${hasta}T23:59:59`)) return false
    return true
  }

  const quejasFiltradas = useMemo(() => {
    let lista = quejas.filter((q) => enRango(q.createdAt))
    if (isGlobal && filtroSucursal !== 'todas') lista = lista.filter((q) => q.sucursal === filtroSucursal)
    return lista
  }, [quejas, desde, hasta, filtroSucursal, isGlobal])

  const valoracionesFiltradas = useMemo(() => {
    let lista = valoraciones.filter((v) => enRango(v.createdAt))
    if (isGlobal && filtroSucursal !== 'todas') lista = lista.filter((v) => v.sucursal === filtroSucursal)
    return lista
  }, [valoraciones, desde, hasta, filtroSucursal, isGlobal])

  const atendidas = quejasFiltradas.filter((q) => q.estado !== 'nueva')
  const resueltas = quejasFiltradas.filter((q) => q.estado === 'resuelta')
  const promedio = valoracionesFiltradas.length
    ? (valoracionesFiltradas.reduce((s, v) => s + (v.puntuacion || 0), 0) / valoracionesFiltradas.length).toFixed(1)
    : '-'

  const columnasQuejas = [
    { label: 'Fecha', value: (r) => fmt(tsToDate(r.createdAt)) },
    ...(isGlobal ? [{ label: 'Sucursal', value: (r) => sucursalLabel(r.sucursal) }] : []),
    { label: 'Prioridad', value: (r) => (r.enSitio ? 'En el local' : 'Normal') },
    { label: 'Estado', value: (r) => ESTADOS[r.estado]?.label || r.estado },
    { label: 'Área', value: (r) => areaLabel(r.area) },
    { label: 'Nombre', value: (r) => r.nombre || 'Anónimo' },
    { label: 'Teléfono', value: (r) => r.telefono },
    { label: 'Email', value: (r) => r.email },
    { label: 'Motivo del problema', value: (r) => r.motivoResuelto || r.mensaje },
    { label: 'Acción tomada', value: (r) => r.accionTomada },
    { label: 'Atendido por', value: (r) => r.atendidoPor },
    { label: 'Fecha de atención/resolución', value: (r) => fmt(tsToDate(r.atendidoAt)) },
  ]

  const columnasValoraciones = [
    { label: 'Fecha', value: (r) => fmt(tsToDate(r.createdAt)) },
    ...(isGlobal ? [{ label: 'Sucursal', value: (r) => sucursalLabel(r.sucursal) }] : []),
    { label: 'Puntuación', value: (r) => r.puntuacion },
    { label: 'Área', value: (r) => areaLabel(r.area) },
    { label: 'Nombre', value: (r) => r.nombre || 'Anónimo' },
    { label: 'Comentario', value: (r) => r.comentario },
  ]

  const rangoTexto = `${desde || 'inicio'} a ${hasta || 'hoy'}`

  function exportarQuejasCSV() {
    downloadCSV(`quejas_${rangoTexto}.csv`, toCSV(quejasFiltradas, columnasQuejas))
  }
  function exportarValoracionesCSV() {
    downloadCSV(`valoraciones_${rangoTexto}.csv`, toCSV(valoracionesFiltradas, columnasValoraciones))
  }
  function exportarQuejasPDF() {
    generarPDF({
      titulo: 'Nasser Cubiertas · Casos atendidos y resueltos',
      subtitulo: `Período: ${rangoTexto}${filtroSucursal !== 'todas' ? ` · ${sucursalLabel(filtroSucursal)}` : ''}`,
      columnas: columnasQuejas,
      filas: quejasFiltradas,
      filename: `quejas_${rangoTexto}.pdf`,
    })
  }
  function exportarValoracionesPDF() {
    generarPDF({
      titulo: 'Nasser Cubiertas · Valoraciones',
      subtitulo: `Período: ${rangoTexto}${filtroSucursal !== 'todas' ? ` · ${sucursalLabel(filtroSucursal)}` : ''}`,
      columnas: columnasValoraciones,
      filas: valoracionesFiltradas,
      filename: `valoraciones_${rangoTexto}.pdf`,
    })
  }

  return (
    <AdminLayout>
      <div className="admin-main-inner">
        <div className="admin-page-header">
          <h1>Relatorio</h1>
          <p>{role === 'jefe' ? sucursalLabel(sucursal) : 'Registro de casos y valoraciones por período'}</p>
        </div>

        <div className="card-flat" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0, minWidth: '10rem' }}>
              <label htmlFor="desde">Desde</label>
              <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0, minWidth: '10rem' }}>
              <label htmlFor="hasta">Hasta</label>
              <input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            {isGlobal && (
              <div className="field" style={{ marginBottom: 0, minWidth: '12rem' }}>
                <label htmlFor="sucursal">Sucursal</label>
                <select id="sucursal" value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
                  <option value="todas">Todas las sucursales</option>
                  {SUCURSALES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => setDesde('')} style={{ height: '3rem' }}>
              Sin límite inicial
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{quejasFiltradas.length}</div>
            <div className="stat-label">Quejas en el período</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-info)' }}>{atendidas.length}</div>
            <div className="stat-label">Atendidas o resueltas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{resueltas.length}</div>
            <div className="stat-label">Resueltas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {promedio} <IconStar width={16} height={16} style={{ verticalAlign: 'middle' }} />
            </div>
            <div className="stat-label">Valoración promedio ({valoracionesFiltradas.length})</div>
          </div>
        </div>

        <div className="qr-grid">
          <div className="qr-card" style={{ textAlign: 'left' }}>
            <div className="card-heading" style={{ marginBottom: '0.75rem' }}>
              <div className="card-heading-icon">
                <IconInbox width={22} height={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.1rem' }}>Casos atendidos y resueltos</h1>
                <p style={{ margin: 0 }}>{quejasFiltradas.length} quejas en el rango elegido</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={exportarQuejasPDF} disabled={quejasFiltradas.length === 0}>
                Descargar PDF
              </button>
              <button className="btn btn-secondary btn-sm" onClick={exportarQuejasCSV} disabled={quejasFiltradas.length === 0}>
                Descargar CSV (Excel)
              </button>
            </div>
          </div>

          <div className="qr-card" style={{ textAlign: 'left' }}>
            <div className="card-heading" style={{ marginBottom: '0.75rem' }}>
              <div className="card-heading-icon">
                <IconStar width={22} height={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.1rem' }}>Valoraciones</h1>
                <p style={{ margin: 0 }}>{valoracionesFiltradas.length} valoraciones en el rango elegido</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={exportarValoracionesPDF}
                disabled={valoracionesFiltradas.length === 0}
              >
                Descargar PDF
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={exportarValoracionesCSV}
                disabled={valoracionesFiltradas.length === 0}
              >
                Descargar CSV (Excel)
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
