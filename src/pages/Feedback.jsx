import { useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { notifyNuevaQueja } from '../lib/notify'
import { AREAS, SUCURSALES, sucursalLabel } from '../lib/constants'
import StarRating from '../components/StarRating'
import { IconStar, IconAlert } from '../components/Icons'

// Formulario único de feedback: reemplaza a los antiguos /queja/:sucursal y
// /valoracion/:sucursal. Siempre se guarda como valoración; si el cliente
// marca que además tiene un reclamo, ese mismo envío también crea un
// ticket en "quejas" para que el sistema de atendimientos siga funcionando
// exactamente igual que antes.
export default function Feedback() {
  const navigate = useNavigate()
  const { sucursal } = useParams()
  const [puntuacion, setPuntuacion] = useState(0)
  const [area, setArea] = useState(AREAS[0].value)
  const [comentario, setComentario] = useState('')
  const [nombre, setNombre] = useState('')
  const [tieneReclamo, setTieneReclamo] = useState(false)
  const [enSitio, setEnSitio] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const sucursalValida = SUCURSALES.some((s) => s.value === sucursal)
  if (!sucursalValida) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (puntuacion === 0) {
      setError('Elegí una cantidad de estrellas para poder enviar tu opinión.')
      return
    }
    if (tieneReclamo) {
      if (!mensaje.trim()) {
        setError('Contanos brevemente qué pasó para poder ayudarte con tu reclamo.')
        return
      }
      if (enSitio === null) {
        setError('Contanos si estás en el local ahora mismo, así sabemos si podemos ayudarte al instante.')
        return
      }
    }
    setError('')
    setEnviando(true)
    try {
      // Siempre se guarda como valoración.
      await addDoc(collection(db, 'valoraciones'), {
        sucursal,
        puntuacion,
        area,
        comentario: comentario.trim(),
        nombre: nombre.trim(),
        tieneReclamo,
        createdAt: serverTimestamp(),
      })

      // Si además marcó que tiene un reclamo, ese mismo envío crea un ticket
      // en "quejas" igual que hacía el formulario viejo.
      if (tieneReclamo) {
        await addDoc(collection(db, 'quejas'), {
          sucursal,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          area,
          mensaje: mensaje.trim(),
          enSitio,
          estado: 'nueva',
          createdAt: serverTimestamp(),
          atendidoPor: null,
          atendidoAt: null,
          motivoResuelto: '',
          accionTomada: '',
        })
        notifyNuevaQueja({ nombre, telefono, email, area, mensaje, sucursal, enSitio })
      }

      navigate(`/gracias?tipo=${tieneReclamo ? 'queja' : 'valoracion'}`)
    } catch (err) {
      console.error(err)
      setError('No pudimos enviar tu opinión. Por favor intentá nuevamente o hablá con el personal del local.')
    } finally {
      setEnviando(false)
    }
  }

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
                  <h1>¿Cómo fue tu experiencia?</h1>
                  <p>{sucursalLabel(sucursal)} · Calificanos y contanos si hubo algún problema</p>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field" style={{ marginBottom: '1.75rem' }}>
                  <StarRating value={puntuacion} onChange={setPuntuacion} />
                </div>

                <div className="field">
                  <label htmlFor="area">¿Qué servicio calificás?</label>
                  <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="comentario">Contanos más (opcional)</label>
                  <textarea
                    id="comentario"
                    placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>¿Tuviste algún problema o querés hacer un reclamo?</label>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className={!tieneReclamo ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => setTieneReclamo(false)}
                    >
                      No, todo bien
                    </button>
                    <button
                      type="button"
                      className={tieneReclamo ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => setTieneReclamo(true)}
                    >
                      <IconAlert width={16} height={16} />
                      Sí, quiero reportarlo
                    </button>
                  </div>
                </div>

                {tieneReclamo && (
                  <>
                    <div className="field">
                      <label>¿Estás en el local ahora mismo? *</label>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                          type="button"
                          className={enSitio === true ? 'btn btn-primary' : 'btn btn-secondary'}
                          onClick={() => setEnSitio(true)}
                        >
                          Sí, estoy acá
                        </button>
                        <button
                          type="button"
                          className={enSitio === false ? 'btn btn-primary' : 'btn btn-secondary'}
                          onClick={() => setEnSitio(false)}
                        >
                          No
                        </button>
                      </div>
                      {enSitio === true && (
                        <div className="hint">
                          Perfecto: tu reclamo se marca como prioritario y el encargado te va a buscar antes de que
                          te vayas.
                        </div>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="mensaje">Contanos qué pasó *</label>
                      <textarea
                        id="mensaje"
                        placeholder="Describí brevemente el inconveniente..."
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="telefono">Teléfono</label>
                      <input
                        id="telefono"
                        type="tel"
                        placeholder="Para poder contactarte si hace falta"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                      />
                      <div className="hint">
                        Si estás en el local, dejá tu teléfono para que te busquen antes de irte.
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Opcional"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="field">
                  <label htmlFor="nombre">Tu nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Opcional"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={enviando}>
                  {enviando && <span className="spinner" />}
                  {enviando ? 'Enviando...' : tieneReclamo ? 'Enviar reclamo' : 'Enviar valoración'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
