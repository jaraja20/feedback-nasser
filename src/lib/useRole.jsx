import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './useAuth.jsx'
import { ROLES_GLOBALES, ROLES_OPERATIVOS } from './constants'

// Lee el rol (y, si corresponde, la sucursal) del usuario logueado desde
// Firestore (colección "admins"). Sin documento ahí, se lo trata como si
// no tuviera ningún acceso todavía (rol null).
export function useRole() {
  const { user } = useAuth()
  const [role, setRole] = useState(null)
  const [sucursal, setSucursal] = useState(null)
  const [loadingRole, setLoadingRole] = useState(true)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setSucursal(null)
      setLoadingRole(false)
      return
    }
    setLoadingRole(true)
    const unsub = onSnapshot(
      doc(db, 'admins', user.uid),
      (snap) => {
        if (snap.exists()) {
          setRole(snap.data().rol)
          setSucursal(snap.data().sucursal || null)
        } else {
          setRole(null)
          setSucursal(null)
        }
        setLoadingRole(false)
      },
      () => {
        setRole(null)
        setSucursal(null)
        setLoadingRole(false)
      },
    )
    return unsub
  }, [user])

  const isAdministrador = role === 'administrador'
  const isGlobal = ROLES_GLOBALES.includes(role) // ve todas las sucursales
  const canOperar = ROLES_OPERATIVOS.includes(role) // puede tomar/resolver casos
  const canBorrar = isAdministrador // solo el administrador elimina
  const canGestionarUsuarios = isAdministrador

  return {
    role,
    sucursal,
    loadingRole,
    isAdministrador,
    isAdmin: isAdministrador, // alias retrocompatible
    isGlobal,
    canOperar,
    canBorrar,
    canGestionarUsuarios,
  }
}
