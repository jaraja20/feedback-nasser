import { useSearchParams, Link } from 'react-router-dom'
import { IconCheck } from '../components/Icons'

export default function Gracias() {
  const [params] = useSearchParams()
  const tipo = params.get('tipo')

  const esQueja = tipo === 'queja'

  return (
    <div className="page">
      <header className="page-header">
        <img src="/logo-nasser.png" alt="Nasser Cubiertas" />
      </header>
      <main className="page-main">
        <div className="container-narrow">
          <div className="card">
            <div className="card-body center-text">
              <div
                className="card-heading-icon"
                style={{ margin: '0 auto 1.25rem', background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
              >
                <IconCheck width={26} height={26} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                {esQueja ? '¡Recibimos tu reclamo!' : '¡Gracias por tu opinión!'}
              </h1>
              <p className="muted" style={{ marginBottom: '1.75rem' }}>
                {esQueja
                  ? 'Un responsable ya fue notificado y te va a buscar en el local para ayudarte.'
                  : 'Tu comentario nos ayuda a seguir mejorando en Nasser Cubiertas.'}
              </p>
              <Link to="/" className="btn btn-secondary">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
