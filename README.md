# Feedback Nasser Cubiertas

Plataforma de feedback por QR para Nasser Cubiertas (venta de cubiertas + autocentro).

Dos códigos QR, cada uno lleva a un formulario distinto:

- **`/queja`** — reclamos. Se guardan en Firestore y aparecen al instante en el panel de administración, para que el personal (por ejemplo RRHH) pueda atender al cliente antes de que se vaya del local.
- **`/valoracion`** — valoración con estrellas (1 a 5) + comentario opcional.

El panel de administración (`/admin`) requiere login y muestra ambas listas en tiempo real, con estado de cada queja (`Nueva` → `En atención` → `Resuelta`).

El diseño visual replica el del sistema de presupuestos de Nasser (mismos colores, tipografía, tarjetas y botones), para que ambas herramientas se sientan parte de la misma familia.

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta de Firebase (ya tenés el proyecto `feedback-nasser` creado)
- Una cuenta de Vercel para el despliegue

## 2. Configuración de Firebase

### 2.1 Activar Firestore

1. Andá a [Firebase Console](https://console.firebase.google.com/) → proyecto `feedback-nasser`.
2. **Build → Firestore Database → Create database**. Elegí una región cercana (ej. `southamerica-east1`).
3. Empezá en modo producción (las reglas de seguridad ya están en `firestore.rules` en este proyecto).

### 2.2 Publicar las reglas de seguridad

Con la [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # elegí el proyecto feedback-nasser, aceptá usar firestore.rules existente
firebase deploy --only firestore:rules
```

Estas reglas hacen que **cualquiera pueda enviar** una queja o valoración (así funciona el QR, sin login), pero **solo el personal logueado** puede leerlas, cambiarles el estado o borrarlas.

### 2.3 Activar el login (Authentication)

1. **Build → Authentication → Sign-in method** → activá **Email/Password**.
2. **Users → Add user**: creá una cuenta para cada persona de RRHH/administración que vaya a usar el panel (ej. `rrhh@nassercubiertas.com` + contraseña). Estas son las cuentas con las que van a entrar en `/admin`.

No hay un flujo de "registro" público — las cuentas de administración se crean a mano desde la consola de Firebase, así solo entra quien vos autorizás.

## 3. Variables de entorno

Copiá `.env.example` a `.env` y completá los valores (los de Firebase ya vienen con los tuyos):

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_NOTIFY_EMAIL=rrhh@nassercubiertas.com
```

## 4. Notificaciones por correo (opcional pero recomendado)

Cuando llega una queja nueva, además de aparecer al instante en el panel, se puede mandar un correo automático a RRHH usando [EmailJS](https://www.emailjs.com) — es gratis hasta 200 correos/mes y **no necesita servidor** (funciona desde el propio navegador del cliente).

1. Creá una cuenta en emailjs.com.
2. **Email Services** → conectá tu Gmail/Outlook (o el que uses) → copiá el **Service ID**.
3. **Email Templates** → creá una plantilla con variables `{{cliente_nombre}}`, `{{cliente_telefono}}`, `{{cliente_email}}`, `{{area}}`, `{{mensaje}}`, `{{fecha}}`, `{{to_email}}` → copiá el **Template ID**.
4. **Account → General** → copiá tu **Public Key**.
5. Completá en `.env` (y en las variables de entorno de Vercel): `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`, `VITE_NOTIFY_EMAIL`.

Si dejás esas variables vacías, la plataforma funciona igual — simplemente no manda el correo, pero la queja se ve al instante en el panel (que es tiempo real).

## 5. Correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`.

## 6. Desplegar en Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Seguí las preguntas (elegí "Vite" cuando lo pregunte, ya está detectado por `vercel.json`). Cuando te pida producción:

```bash
vercel --prod
```

**Importante:** en el dashboard de Vercel (Project → Settings → Environment Variables) cargá las mismas variables del `.env` (las de Firebase y, si las usás, las de EmailJS) para que el build de producción las tenga.

También agregá el dominio de Vercel (ej. `feedback-nasser.vercel.app`) en Firebase: **Authentication → Settings → Authorized domains**, para que el login funcione ahí.

## 7. Generar e imprimir los QR

Una vez desplegado y logueado en `/admin`, entrá a **Códigos QR** (`/admin/qr`). Ahí vas a ver los dos QR ya generados apuntando a tu dominio real de producción, listos para descargar en PNG e imprimir:

- Uno para **quejas**, para poner donde el cliente pueda reportar un problema (mostrador, sala de espera, autocentro).
- Uno para **valoración**, para pedir feedback general.

## 8. Cómo se usa el panel día a día

- Cualquier queja nueva aparece arriba de la lista en tiempo real (con un sonido de aviso) y con la etiqueta **Nueva**.
- RRHH toca **"Tomar caso"** para marcarla **En atención** (queda registrado quién la tomó).
- Al resolverla, **"Marcar resuelta"**.
- La pestaña **Valoraciones** muestra el promedio de estrellas y los comentarios.

## Estructura del proyecto

```
src/
  pages/            Home, Queja, Valoracion, Gracias (público)
  pages/admin/       Login, Dashboard, QRPage (protegido)
  components/        StarRating, Icons, ProtectedRoute
  lib/                firebase.js, useAuth.jsx, notify.js, constants.js
firestore.rules      Reglas de seguridad de Firestore
vercel.json           Config de rutas para el despliegue en Vercel
```

## Notas de diseño

El estilo visual (colores, tipografía, tarjetas redondeadas, botón rojo `#dc2626`) está tomado del sistema de presupuestos de Nasser para que ambas apps se vean como una sola marca. Los tokens de diseño están centralizados en `src/index.css` (`:root { ... }`) por si en algún momento cambian el logo o la paleta de colores — se edita en un solo lugar.
