import { Link, useParams, Navigate } from 'react-router-dom'
import { SUCURSALES, sucursalLabel } from '../lib/constants'
import { IconAlert, IconStar } from '../components/Icons'

// Pantalla que aparece al elegir sucursal desde Home (o si en algún momento
// se imprime un QR que solo lleve hasta acá): deja elegir entre queja o
// valoración, ya con la sucursal fijada.
export default function SucursalHome() {
  const { sucursal } = useParams()
  const valido = SUCURSALES.some((s) => s.value === sucursal)

  if (!valido) return <Navigate to="/" replace />

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
                  <h1>{sucursalLabel(sucursal)}</h1>
                  <p>¿Cómo te podemos ayudar?</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to={`/valoracion/${sucursal}`} className="btn btn-primary">
                  <IconStar width={18} height={18} />
                  Dejar una valoración
                </Link>
                <Link to={`/queja/${sucursal}`} className="btn btn-secondary">
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
