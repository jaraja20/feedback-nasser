import { initializeApp, getApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// La configuración se toma de variables de entorno (ver .env.example).
// Así el mismo código sirve para desarrollo local y para producción en Vercel
// sin tener que tocar el código fuente.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// App secundaria de Firebase, usada únicamente para crear usuarios nuevos
// desde el panel sin cerrar la sesión del administrador que los está creando
// (Firebase Auth, al crear un usuario, inicia sesión automáticamente con esa
// cuenta nueva en la instancia que se use — por eso usamos una instancia aparte).
export function getSecondaryAuth() {
  const name = 'secondary'
  const secondaryApp = getApps().some((a) => a.name === name)
    ? getApp(name)
    : initializeApp(firebaseConfig, name)
  return getAuth(secondaryApp)
}
