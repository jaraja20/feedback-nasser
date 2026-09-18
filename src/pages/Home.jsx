import { Link } from 'react-router-dom'
import { SUCURSALES } from '../lib/constants'
import { IconInbox } from '../components/Icons'

// Puerta de entrada de respaldo: los QR reales apuntan directo a
// /queja/:sucursal o /valoracion/:sucursal, pero si alguien entra sin ese
// dato (por ejemplo escribiendo el dominio a mano) le pedimos que elija
// su sucursal antes de seguir.
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
                  <IconInbox width={24} height={24} />
                </div>
                <div>
                  <h1>¿En qué sucursal estás?</h1>
                  <p>Elegí tu local para dejar tu opinión</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {SUCURSALES.map((s) => (
                  <Link key={s.value} to={`/s/${s.value}`} className="btn btn-secondary">
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
