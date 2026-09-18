import { QRCodeCanvas } from 'qrcode.react'
import { useRole } from '../../lib/useRole.jsx'
import AdminLayout from '../../components/AdminLayout'
import { SUCURSALES } from '../../lib/constants'
import { IconAlert, IconStar } from '../../components/Icons'

const BASE_URL = window.location.origin

function downloadCanvas(id, filename) {
  const canvas = document.getElementById(id)
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export default function QRPage() {
  const { role, sucursal: miSucursal } = useRole()
  const sucursales = role === 'administrador' ? SUCURSALES : SUCURSALES.filter((s) => s.value === miSucursal)

  return (
    <AdminLayout>
      <div className="admin-main-inner">
        <div className="admin-page-header">
          <h1>Códigos QR</h1>
          <p>Descargá cada código e imprimilo donde están los clientes de esa sucursal</p>
        </div>

        {sucursales.map((s) => (
          <div key={s.value} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{s.label}</h2>
            <div className="qr-grid">
              <div className="qr-card">
                <IconAlert width={28} height={28} style={{ color: 'var(--color-primary)' }} />
                <h3>Quejas / Reclamos</h3>
                <p className="muted" style={{ fontSize: '0.85rem' }}>{BASE_URL}/queja/{s.value}</p>
                <QRCodeCanvas
                  id={`qr-queja-${s.value}`}
                  value={`${BASE_URL}/queja/${s.value}`}
                  size={200}
                  fgColor="#171717"
                  level="M"
                  includeMargin
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadCanvas(`qr-queja-${s.value}`, `qr-quejas-${s.value}.png`)}
                >
                  Descargar PNG
                </button>
              </div>

              <div className="qr-card">
                <IconStar width={28} height={28} style={{ color: 'var(--color-primary)' }} />
                <h3>Valoración</h3>
                <p className="muted" style={{ fontSize: '0.85rem' }}>{BASE_URL}/valoracion/{s.value}</p>
                <QRCodeCanvas
                  id={`qr-valoracion-${s.value}`}
                  value={`${BASE_URL}/valoracion/${s.value}`}
                  size={200}
                  fgColor="#171717"
                  level="M"
                  includeMargin
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadCanvas(`qr-valoracion-${s.value}`, `qr-valoracion-${s.value}.png`)}
                >
                  Descargar PNG
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
