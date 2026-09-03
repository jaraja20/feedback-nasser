import { Link } from 'react-router-dom'
import { IconAlert, IconStar } from '../components/Icons'

// Página general por si alguien escanea un QR "genérico" o entra directo al
// dominio. Los QR de quejas y de valoración deberían apuntar directo a
// /queja y /valoracion respectivamente, pero dejamos esta puerta de entrada
// como respaldo.
export default function Home() {
  return (
    <div className="page">
      <header className="page-header">
        <img src="/logo-nasser.png" alt="Nasser Cubiertas" />
      </header>
      <main className="page-main">
        <div className="container-narrow">
          <div className="card">
            <div className="card-body">
              <div className="card-heading">
                <div className="card-heading-icon">
                  <IconStar width={24} height={24} />
                </div>
                <div>
                  <h1>¿Cómo te podemos ayudar?</h1>
                  <p>Tu opinión nos ayuda a mejorar</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/valoracion" className="btn btn-primary">
                  <IconStar width={18} height={18} />
                  Dejar una valoración
                </Link>
                <Link to="/queja" className="btn btn-secondary">
                  <IconAlert width={18} height={18} />
                  Reportar un problema
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
