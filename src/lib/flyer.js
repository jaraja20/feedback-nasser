// Genera un "mini flyer" imprimible (pensado para un soporte de acrílico de
// 20 x 15 cm) con el logo de Nasser, un mensaje invitando al cliente y el QR
// correspondiente (queja o valoración). Todo se dibuja en un <canvas> oculto
// a 300 DPI y se descarga como PNG, listo para mandar a imprimir.

const DPI = 300
const CM_TO_IN = 1 / 2.54
const W = Math.round(20 * CM_TO_IN * DPI) // ancho: 2362px
const H = Math.round(15 * CM_TO_IN * DPI) // alto: 1772px

const RED = '#DC2626'
const DARK = '#171717'
const GRAY = '#6B7280'
const SIDE_PAD = W * 0.09

const TEXTOS = {
  queja: {
    titulo: '¿Tuviste algún inconveniente?',
    subtitulo: 'Contanos qué pasó y te ayudamos al instante',
    cta: 'Escaneá y reportalo',
  },
  valoracion: {
    titulo: '¿Cómo fue tu experiencia?',
    subtitulo: 'Tu opinión nos ayuda a mejorar cada día',
    cta: 'Escaneá y calificanos',
  },
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Calcula en qué líneas se parte un texto para un ancho máximo, sin dibujar.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ')
  let line = ''
  const lines = []
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  })
  if (line) lines.push(line)
  return lines
}

// Dibuja las líneas ya calculadas, centradas horizontalmente, con
// textBaseline "top" para que el "y" recibido sea el borde superior del
// bloque (así el apilado vertical es predecible, sin sorpresas de ascent).
function drawLines(ctx, lines, centerX, topY, lineHeight) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  lines.forEach((l, i) => {
    ctx.fillText(l, centerX, topY + i * lineHeight)
  })
  return lines.length * lineHeight
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function generarFlyerQR({ tipo, sucursalLabel, qrCanvasId, filename }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const t = TEXTOS[tipo] || TEXTOS.queja
  const logo = await loadImage('/logo-nasser.png')

  // --- Medidas de cada bloque (sin dibujar todavía) ---
  // Los tamaños están calibrados para que, incluso en el peor caso (título Y
  // subtítulo partidos en 2 líneas), el contenido total no supere la altura
  // del canvas — probado a mano contra los textos reales de TEXTOS arriba.
  const logoW = W * 0.22
  const logoH = logoW * (logo.height / logo.width)

  const tituloFont = `bold ${Math.round(H * 0.055)}px Arial, sans-serif`
  const tituloLineH = H * 0.068
  ctx.font = tituloFont
  const tituloLines = wrapLines(ctx, t.titulo, W - SIDE_PAD * 2)

  const subFont = `${Math.round(H * 0.03)}px Arial, sans-serif`
  const subLineH = H * 0.04
  ctx.font = subFont
  const subLines = wrapLines(ctx, t.subtitulo, W - SIDE_PAD * 2.3)

  const qrSize = H * 0.36
  const cardPad = qrSize * 0.08
  const qrCardH = qrSize + cardPad * 2

  const ctaFont = `bold ${Math.round(H * 0.045)}px Arial, sans-serif`
  const ctaLineH = H * 0.045

  const footerFont = `${Math.round(H * 0.024)}px Arial, sans-serif`
  const footerLineH = H * 0.032

  const gapLogoTitulo = H * 0.04
  const gapTituloSub = H * 0.02
  const gapSubQr = H * 0.045
  const gapQrCta = H * 0.035
  const gapCtaFooter = H * 0.03

  const contentH =
    logoH +
    gapLogoTitulo +
    tituloLines.length * tituloLineH +
    gapTituloSub +
    subLines.length * subLineH +
    gapSubQr +
    qrCardH +
    gapQrCta +
    ctaLineH +
    gapCtaFooter +
    footerLineH

  const minPad = H * 0.03
  let y = Math.max(minPad, (H - contentH) / 2)
  if (y + contentH > H - minPad) y = Math.max(4, H - minPad - contentH) // salvaguarda si el texto es más largo de lo previsto
  const cx = W / 2

  // --- Fondo ---
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)

  // --- Logo ---
  ctx.drawImage(logo, cx - logoW / 2, y, logoW, logoH)
  y += logoH + gapLogoTitulo

  // --- Título ---
  ctx.fillStyle = DARK
  ctx.font = tituloFont
  y += drawLines(ctx, tituloLines, cx, y, tituloLineH)
  y += gapTituloSub

  // --- Subtítulo ---
  ctx.fillStyle = GRAY
  ctx.font = subFont
  y += drawLines(ctx, subLines, cx, y, subLineH)
  y += gapSubQr

  // --- QR con tarjeta blanca y borde rojo redondeado ---
  const qrX = cx - qrSize / 2
  const qrY = y + cardPad
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = RED
  ctx.lineWidth = 6
  roundRect(ctx, qrX - cardPad, y, qrSize + cardPad * 2, qrCardH, 24)
  ctx.fill()
  ctx.stroke()

  const qrSourceCanvas = document.getElementById(qrCanvasId)
  if (qrSourceCanvas) {
    ctx.drawImage(qrSourceCanvas, qrX, qrY, qrSize, qrSize)
  }
  y += qrCardH + gapQrCta

  // --- CTA ---
  ctx.fillStyle = RED
  ctx.font = ctaFont
  y += drawLines(ctx, [t.cta.toUpperCase()], cx, y, ctaLineH)
  y += gapCtaFooter

  // --- Sucursal (pie) ---
  ctx.fillStyle = GRAY
  ctx.font = footerFont
  drawLines(ctx, [sucursalLabel], cx, y, footerLineH)

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
