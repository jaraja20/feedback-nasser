import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, getSecondaryAuth } from './firebase'

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
