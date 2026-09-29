import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRole } from '../../lib/useRole.jsx'
import AdminLayout from '../../components/AdminLayout'
import { SUCURSALES } from '../../lib/constants'
import { IconStar } from '../../components/Icons'
import { generarFlyerQR, generarFlyerPDF } from '../../lib/flyer'

const BASE_URL = window.location.origin
// El QR base se renderiza grande (nivel de error alto) para que se vea nítido
// incluso ampliado dentro del flyer de 15x20cm a 300dpi.
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

  async function descargarFlyer(formato, sucursal) {
    const key = `${formato}-${sucursal.value}`
    setGenerando(key)
    try {
      if (formato === 'pdf') {
        await generarFlyerPDF({
          sucursalLabel: sucursal.label,
          qrCanvasId: `qr-${sucursal.value}`,
          filename: `flyer-${sucursal.value}-oficio.pdf`,
        })
      } else {
        await generarFlyerQR({
          sucursalLabel: sucursal.label,
          qrCanvasId: `qr-${sucursal.value}`,
          filename: `flyer-${sucursal.value}.png`,
        })
      }
    } finally {
      setGenerando(null)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-main-inner">
        <div className="admin-page-header">
          <h1>Códigos QR</h1>
          <p>Un QR único por sucursal: lleva al formulario de valoración y reclamos de esa sucursal</p>
        </div>

        <div className="qr-grid">
          {sucursales.map((s) => (
            <div key={s.value} className="qr-card">
              <IconStar width={28} height={28} style={{ color: 'var(--color-primary)' }} />
              <h3>{s.label}</h3>
              <p className="muted" style={{ fontSize: '0.85rem' }}>{BASE_URL}/feedback/{s.value}</p>
              <QRCodeCanvas
                id={`qr-${s.value}`}
                value={`${BASE_URL}/feedback/${s.value}`}
                size={QR_BASE_SIZE}
                fgColor="#171717"
                level="H"
                includeMargin
                style={{ width: 160, height: 160 }}
              />
              <button
                className="btn btn-primary btn-sm"
                disabled={generando === `pdf-${s.value}`}
                onClick={() => descargarFlyer('pdf', s)}
              >
                {generando === `pdf-${s.value}` ? 'Generando…' : 'Descargar PDF (listo para imprimir)'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={generando === `png-${s.value}`}
                onClick={() => descargarFlyer('png', s)}
              >
                {generando === `png-${s.value}` ? 'Generando…' : 'Descargar flyer en PNG'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => downloadCanvas(`qr-${s.value}`, `qr-${s.value}.png`)}
              >
                Descargar solo el QR
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
