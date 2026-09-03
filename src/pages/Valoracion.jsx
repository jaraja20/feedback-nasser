import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { AREAS } from '../lib/constants'
import StarRating from '../components/StarRating'
import { IconStar } from '../components/Icons'

export default function Valoracion() {
  const navigate = useNavigate()
  const [puntuacion, setPuntuacion] = useState(0)
  const [area, setArea] = useState(AREAS[0].value)
  const [comentario, setComentario] = useState('')
  const [nombre, setNombre] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (puntuacion === 0) {
      setError('Elegí una cantidad de estrellas para poder enviar tu valoración.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await addDoc(collection(db, 'valoraciones'), {
        puntuacion,
        area,
        comentario: comentario.trim(),
        nombre: nombre.trim(),
        createdAt: serverTimestamp(),
      })
      navigate('/gracias?tipo=valoracion')
    } catch (err) {
      console.error(err)
      setError('No pudimos enviar tu valoración. Intentá nuevamente.')
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
                  <p>Tu valoración nos ayuda a mejorar</p>
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
                  {enviando ? 'Enviando...' : 'Enviar valoración'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
