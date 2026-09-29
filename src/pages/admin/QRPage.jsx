import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRole } from '../../lib/useRole.jsx'
import AdminLayout from '../../components/AdminLayout'
import { SUCURSALES } from '../../lib/constants'
import { IconAlert, IconStar } from '../../components/Icons'
import { generarFlyerQR } from '../../lib/flyer'

const BASE_URL = window.location.origin
// El QR base se renderiza grande (nivel de error alto) para que se vea nítido
// incluso ampliado dentro del flyer de 20x15cm a 300dpi.
const QR_BASE_SIZE = 600

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
  const [generando, setGenerando] = useState(null)

  async function descargarFlyer(tipo, sucursal) {
    const key = `${tipo}-${sucursal.value}`
    setGenerando(key)
    try {
      await generarFlyerQR({
        tipo,
        sucursalLabel: sucursal.label,
        qrCanvasId: `qr-${tipo}-${sucursal.value}`,
        filename: `flyer-${tipo}-${sucursal.value}.png`,
      })
    } finally {
      setGenerando(null)
    }
  }

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
                  size={QR_BASE_SIZE}
                  fgColor="#171717"
                  level="H"
                  includeMargin
                  style={{ width: 160, height: 160 }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={generando === `queja-${s.value}`}
                  onClick={() => descargarFlyer('queja', s)}
                >
                  {generando === `queja-${s.value}` ? 'Generando…' : 'Descargar flyer para imprimir'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => downloadCanvas(`qr-queja-${s.value}`, `qr-quejas-${s.value}.png`)}
                >
                  Descargar solo el QR
                </button>
              </div>

              <div className="qr-card">
                <IconStar width={28} height={28} style={{ color: 'var(--color-primary)' }} />
                <h3>Valoración</h3>
                <p className="muted" style={{ fontSize: '0.85rem' }}>{BASE_URL}/valoracion/{s.value}</p>
                <QRCodeCanvas
                  id={`qr-valoracion-${s.value}`}
                  value={`${BASE_URL}/valoracion/${s.value}`}
                  size={QR_BASE_SIZE}
                  fgColor="#171717"
                  level="H"
                  includeMargin
                  style={{ width: 160, height: 160 }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={generando === `valoracion-${s.value}`}
                  onClick={() => descargarFlyer('valoracion', s)}
                >
                  {generando === `valoracion-${s.value}` ? 'Generando…' : 'Descargar flyer para imprimir'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => downloadCanvas(`qr-valoracion-${s.value}`, `qr-valoracion-${s.value}.png`)}
                >
                  Descargar solo el QR
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
