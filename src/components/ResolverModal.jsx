import { useState } from 'react'

// Modal que se abre al marcar una queja como resuelta. Pide confirmar el
// motivo real del problema y qué se hizo al respecto — esos dos datos quedan
// guardados en el caso y son los que después alimentan el Relatorio.
export default function ResolverModal({ queja, onCancel, onConfirmar }) {
  const [motivo, setMotivo] = useState(queja.motivoResuelto || queja.mensaje || '')
  const [accion, setAccion] = useState(queja.accionTomada || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!motivo.trim() || !accion.trim()) {
      setError('Completá los dos campos para poder cerrar el caso.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await onConfirmar({ motivoResuelto: motivo.trim(), accionTomada: accion.trim() })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Cerrar caso como resuelto</h2>
        <p className="muted">{queja.nombre || 'Cliente anónimo'} · queda registrado en el relatorio</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="motivo">Motivo de la queja del cliente *</label>
            <textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="accion">¿Cómo se resolvió? / Qué se hizo al respecto *</label>
            <textarea
              id="accion"
              placeholder="Ej: se reemplazó la cubierta sin costo, se ofreció descuento en el próximo servicio..."
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando && <span className="spinner" />}
              {enviando ? 'Guardando...' : 'Marcar como resuelta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
