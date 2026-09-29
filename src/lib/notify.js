import emailjs from '@emailjs/browser'
import { sucursalLabel } from './constants'

// Notificación por correo cuando llega una queja nueva.
// Usa EmailJS (https://www.emailjs.com) porque permite enviar un correo
// directamente desde el navegador del cliente, sin necesitar un backend ni
// exponer contraseñas de ningún correo. Es gratis hasta 200 envíos/mes.
//
// Para activarlo, seguí los pasos del README ("Notificaciones por correo")
// y completá las 3 variables VITE_EMAILJS_* en tu archivo .env / en Vercel.
// Si no están configuradas, la función simplemente no hace nada (no rompe
// el formulario del cliente).

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const NOTIFY_EMAIL_DEFAULT = import.meta.env.VITE_NOTIFY_EMAIL // correo general, para sucursales sin equipo propio configurado

// Correos que reciben el aviso de cada queja, según la sucursal. Si una
// sucursal no está en este mapa, se usa el correo general de arriba
// (VITE_NOTIFY_EMAIL) como respaldo.
const NOTIFY_EMAILS_POR_SUCURSAL = {
  km6: ['jefe.matriz@nasser.com.py', 'clarice.silva@nasser.com.py', 'jefe.rrhh@nasser.com.py'],
}

function destinatariosDe(sucursal) {
  const lista = NOTIFY_EMAILS_POR_SUCURSAL[sucursal]
  if (lista && lista.length) return lista.join(',')
  return NOTIFY_EMAIL_DEFAULT || ''
}

export async function notifyNuevaQueja({ nombre, telefono, email, area, mensaje, sucursal, enSitio }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[notify] EmailJS no está configurado, se omite el envío de correo.')
    return
  }
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: destinatariosDe(sucursal),
        sucursal: sucursalLabel(sucursal),
        prioridad: enSitio ? 'URGENTE: el cliente está en el local ahora mismo' : 'Normal',
        cliente_nombre: nombre || 'Anónimo',
        cliente_telefono: telefono || '-',
        cliente_email: email || '-',
        area: area || '-',
        mensaje: mensaje || '',
        fecha: new Date().toLocaleString('es-PY'),
        // Link directo al panel (pide login si todavía no iniciaste sesión
        // en ese navegador) para poder verificar la queja de una.
        link_sistema: `${window.location.origin}/admin`,
      },
      { publicKey: PUBLIC_KEY },
    )
  } catch (err) {
    // No bloqueamos al cliente si el correo falla: la queja ya quedó
    // guardada en Firestore y va a aparecer igual en el panel en tiempo real.
    console.error('[notify] Error enviando notificación por correo:', err)
  }
}
