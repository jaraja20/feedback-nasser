import { useParams, Navigate } from 'react-router-dom'
import { SUCURSALES } from '../lib/constants'

// Ya no hay que elegir entre queja/valoración: todo está centralizado en un
// solo formulario por sucursal. Esta pantalla queda solo como puente de
// compatibilidad para /s/:sucursal.
export default function SucursalHome() {
  const { sucursal } = useParams()
  const valido = SUCURSALES.some((s) => s.value === sucursal)

  if (!valido) return <Navigate to="/" replace />
  return <Navigate to={`/feedback/${sucursal}`} replace />
}
