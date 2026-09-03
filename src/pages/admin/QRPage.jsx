import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
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
  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <img src="/logo-nasser.png" alt="Nasser Cubiertas" />
          <div className="admin-topbar-title">Códigos QR</div>
        </div>
        <Link to="/admin" className="btn btn-secondary btn-sm">
          Volver al panel
        </Link>
      </div>

      <div className="admin-content">
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          Descargá cada código e imprimilo para colocarlo donde están los clientes (mostrador, sala de
          espera, autocentro). Cada uno lleva directo al formulario correspondiente.
        </p>

        <div className="qr-grid">
          <div className="qr-card">
            <IconAlert width={28} height={28} style={{ color: 'var(--color-primary)' }} />
            <h3>Quejas / Reclamos</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>{BASE_URL}/queja</p>
            <QRCodeCanvas id="qr-queja" value={`${BASE_URL}/queja`} size={220} fgColor="#171717" level="M" includeMargin />
            <button className="btn btn-primary btn-sm" onClick={() => downloadCanvas('qr-queja', 'qr-quejas-nasser.png')}>
              Descargar PNG
            </button>
          </div>

          <div className="qr-card">
            <IconStar width={28} height={28} style={{ color: 'var(--color-primary)' }} />
            <h3>Valoración</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>{BASE_URL}/valoracion</p>
            <QRCodeCanvas id="qr-valoracion" value={`${BASE_URL}/valoracion`} size={220} fgColor="#171717" level="M" includeMargin />
            <button className="btn btn-primary btn-sm" onClick={() => downloadCanvas('qr-valoracion', 'qr-valoracion-nasser.png')}>
              Descargar PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
