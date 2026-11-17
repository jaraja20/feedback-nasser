import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Función de servidor (Vercel) para lo que el navegador no puede hacer con
// Firebase: cambiar la contraseña o el email de OTRA cuenta y borrar la cuenta
// de login. Usa una cuenta de servicio de Firebase cargada en la variable de
// entorno FIREBASE_SERVICE_ACCOUNT (el JSON completo, ver README).
// Solo responde a usuarios logueados con rol "administrador".

function adminApp() {
  if (getApps().length) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  return initializeApp({ credential: cert(JSON.parse(raw)) })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' })

  const app = adminApp()
  if (!app) return res.status(503).json({ error: 'no_configurado' })
  const auth = getAuth(app)
  const db = getFirestore(app)

  // Quién hace el pedido: token de sesión de Firebase + rol en "admins"
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  let callerUid
  try {
    callerUid = (await auth.verifyIdToken(token)).uid
  } catch {
    return res.status(401).json({ error: 'Sesión no válida. Volvé a iniciar sesión.' })
  }
  const caller = await db.doc(`admins/${callerUid}`).get()
  if (caller.data()?.rol !== 'administrador') {
    return res.status(403).json({ error: 'Solo un administrador puede gestionar usuarios.' })
  }

  const { accion, uid, password, email } = req.body || {}
  if (!uid) return res.status(400).json({ error: 'Falta el usuario.' })

  try {
    if (accion === 'password') {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
      }
      await auth.updateUser(uid, { password })
      return res.json({ ok: true })
    }

    if (accion === 'email') {
      await auth.updateUser(uid, { email })
      await db.doc(`admins/${uid}`).update({ email })
      return res.json({ ok: true })
    }

    if (accion === 'eliminar') {
      if (uid === callerUid) return res.status(400).json({ error: 'No podés eliminar tu propia cuenta.' })
      const target = await db.doc(`admins/${uid}`).get()
      if (target.data()?.rol === 'administrador') {
        const admins = await db.collection('admins').where('rol', '==', 'administrador').count().get()
        if (admins.data().count <= 1) {
          return res.status(400).json({ error: 'Tiene que quedar al menos un administrador.' })
        }
      }
      try {
        await auth.deleteUser(uid)
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err
      }
      await db.doc(`admins/${uid}`).delete()
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: 'Acción desconocida.' })
  } catch (err) {
    console.error(err)
    if (err.code === 'auth/email-already-exists') return res.status(400).json({ error: 'Ese email ya tiene una cuenta.' })
    if (err.code === 'auth/invalid-email') return res.status(400).json({ error: 'El email no es válido.' })
    if (err.code === 'auth/invalid-password') return res.status(400).json({ error: 'La contraseña no es válida.' })
    if (err.code === 'auth/user-not-found') return res.status(404).json({ error: 'La cuenta de login ya no existe.' })
    return res.status(500).json({ error: 'No se pudo completar la operación.' })
  }
}
