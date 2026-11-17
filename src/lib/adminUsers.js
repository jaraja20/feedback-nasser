import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { deleteDoc, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db, getSecondaryAuth } from './firebase'

// Crea una cuenta de administración nueva (Firebase Auth) y le asigna un rol
// en Firestore (colección "admins"). Usa una instancia secundaria de Firebase
// para que el administrador que está creando la cuenta no pierda su propia sesión.
export async function crearUsuarioAdmin({ email, password, rol, sucursal, creadoPor }) {
  const secondaryAuth = getSecondaryAuth()
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  const uid = cred.user.uid
  await signOut(secondaryAuth)

  await setDoc(doc(db, 'admins', uid), {
    email,
    rol,
    sucursal: rol === 'jefe' ? sucursal : null,
    creadoPor: creadoPor || null,
    creadoEn: serverTimestamp(),
  })

  return uid
}

// Cambia el rol y la sucursal: es solo el documento de Firestore, así que se
// hace directo desde el navegador (las reglas exigen ser administrador).
export async function actualizarRol(uid, { rol, sucursal }) {
  await updateDoc(doc(db, 'admins', uid), {
    rol,
    sucursal: rol === 'jefe' ? sucursal : null,
  })
}

// Contraseña, email y borrado de la cuenta de login necesitan la función de
// servidor /api/usuarios (Firebase no deja hacerlo desde el navegador).
// Si esa función no está configurada, el error sale con code "no_configurado".
async function llamarApi(body) {
  const token = await auth.currentUser.getIdToken()
  let res
  try {
    res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw Object.assign(new Error('No hay conexión con el servidor.'), { code: 'sin_conexion' })
  }
  const data = (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : null
  if (!data || data.error === 'no_configurado') {
    throw Object.assign(new Error('La función de servidor no está configurada.'), { code: 'no_configurado' })
  }
  if (!res.ok) throw new Error(data.error)
  return data
}

export const cambiarPassword = (uid, password) => llamarApi({ accion: 'password', uid, password })
export const cambiarEmail = (uid, email) => llamarApi({ accion: 'email', uid, email })

// Borra la cuenta de login y su rol. Si la función de servidor no está
// configurada, al menos le quita el acceso borrando el rol (sin rol, el panel
// no le muestra nada) y devuelve { soloAcceso: true }.
export async function eliminarUsuario(uid) {
  try {
    await llamarApi({ accion: 'eliminar', uid })
    return { soloAcceso: false }
  } catch (err) {
    if (err.code !== 'no_configurado') throw err
    await deleteDoc(doc(db, 'admins', uid))
    return { soloAcceso: true }
  }
}
