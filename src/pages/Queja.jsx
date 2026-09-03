import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { notifyNuevaQueja } from '../lib/notify'
import { AREAS } from '../lib/constants'
import { IconAlert } from '../components/Icons'

export default function Queja() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState(AREAS[0].value)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mensaje.trim()) {
      setError('Contanos brevemente qué pasó para poder ayudarte.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await addDoc(collection(db, 'quejas'), {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        area,
        mensaje: mensaje.trim(),
        estado: 'nueva',
        createdAt: serverTimestamp(),
        atendidoPor: null,
        notaInterna: '',
      })
      // Disparamos el correo en paralelo, sin bloquear la navegación del cliente.
      notifyNuevaQueja({ nombre, telefono, email, area, mensaje })
      navigate('/gracias?tipo=queja')
    } catch (err) {
      console.error(err)
      setError('No pudimos enviar tu mensaje. Por favor intentá nuevamente o hablá con el personal del local.')
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
                  <IconAlert width={24} height={24} />
                </div>
                <div>
                  <h1>Contanos qué pasó</h1>
                  <p>Un responsable te va a atender ahora mismo</p>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="area">¿Sobre qué área es tu reclamo?</label>
                  <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
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
                  <label htmlFor="nombre">Tu nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Opcional"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
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
                  <div className="hint">Si estás en el local, dejá tu teléfono para que te busquen antes de irte.</div>
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

                <button type="submit" className="btn btn-primary" disabled={enviando}>
                  {enviando && <span className="spinner" />}
                  {enviando ? 'Enviando...' : 'Enviar reclamo'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
