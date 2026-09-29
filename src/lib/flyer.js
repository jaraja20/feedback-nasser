// Genera un "mini flyer" imprimible (pensado para un soporte de acrílico de
// 20 x 15 cm) con el logo de Nasser, un mensaje invitando al cliente y el QR
// correspondiente (queja o valoración). El arte se dibuja en un <canvas>
// oculto a 300 DPI y se puede descargar como PNG suelto, o como PDF tamaño
// oficio con el arte centrado y un recuadro de corte para que quede exacto
// a 20x15cm al imprimir y recortar.
//
// Los dos tipos (queja / valoración) usan siempre el mismo rojo de marca,
// pero con un DISEÑO distinto (ícono, marco, forma del botón) para que no se
// puedan confundir de un vistazo aunque estén pegados en el mismo mostrador.

import jsPDF from 'jspdf'

const DPI = 300
const CM_TO_IN = 1 / 2.54
const FLYER_W_CM = 15
const FLYER_H_CM = 20
const W = Math.round(FLYER_W_CM * CM_TO_IN * DPI) // ancho: 2362px
const H = Math.round(FLYER_H_CM * CM_TO_IN * DPI) // alto: 1772px

// Tamaño "oficio" tal como se usa habitualmente en Paraguay/la región: 216 x
// 330 mm (más largo que carta, más corto que legal de EE.UU.).
const OFICIO_W_MM = 216
const OFICIO_H_MM = 330

const RED = '#DC2626'
const DARK = '#171717'
const GRAY = '#6B7280'
const SIDE_PAD = W * 0.09

const TEXTOS = {
  queja: {
    titulo: '¿Tuviste algún inconveniente?',
    subtitulo: 'Contanos qué pasó y te ayudamos al instante',
    cta: 'Escaneá y reportalo',
    estilo: 'bloques', // franjas rojas sólidas arriba/abajo + ícono de alerta
  },
  valoracion: {
    titulo: '¿Cómo fue tu experiencia?',
    subtitulo: 'Tu opinión nos ayuda a mejorar cada día',
    cta: 'Escaneá y calificanos',
    estilo: 'marco', // marco fino perimetral + estrellas + QR tipo visor
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

function starPath(ctx, cx, cy, outerR, innerR) {
  const points = 5
  const step = Math.PI / points
  ctx.beginPath()
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2
    const px = cx + r * Math.cos(angle)
    const py = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// Ícono de alerta: círculo relleno con un "!" blanco — usado en el flyer de
// quejas. Devuelve la altura total ocupada.
function drawIconoAlerta(ctx, cx, topY) {
  const d = H * 0.09
  const r = d / 2
  const cy = topY + r
  ctx.fillStyle = RED
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(d * 0.62)}px Arial, sans-serif`
  ctx.fillText('!', cx, cy + d * 0.03)
  ctx.textBaseline = 'top'
  return d
}

// Ícono de estrellas: fila de 5 estrellas rellenas — usado en el flyer de
// valoración. Devuelve la altura total ocupada.
function drawIconoEstrellas(ctx, cx, topY) {
  const starOuter = H * 0.03
  const starInner = starOuter * 0.42
  const gap = starOuter * 0.55
  const totalW = 5 * starOuter * 2 + 4 * gap
  let x = cx - totalW / 2 + starOuter
  const cy = topY + starOuter
  ctx.fillStyle = RED
  for (let i = 0; i < 5; i++) {
    starPath(ctx, x, cy, starOuter, starInner)
    ctx.fill()
    x += starOuter * 2 + gap
  }
  return starOuter * 2
}

// Marco perimetral fino con pequeñas marcas en las esquinas — usado solo en
// el diseño "marco" (valoración) para diferenciarlo de las franjas sólidas
// del diseño "bloques" (queja).
function drawMarcoPerimetral(ctx, inset) {
  ctx.strokeStyle = RED
  ctx.lineWidth = 5
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2)

  const tick = H * 0.028
  const off = H * 0.014
  const corners = [
    [inset, inset, 1, 1],
    [W - inset, inset, -1, 1],
    [inset, H - inset, 1, -1],
    [W - inset, H - inset, -1, -1],
  ]
  ctx.lineWidth = 9
  corners.forEach(([cxp, cyp, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cxp - dx * off, cyp)
    ctx.lineTo(cxp - dx * (off + tick), cyp)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cxp, cyp - dy * off)
    ctx.lineTo(cxp, cyp - dy * (off + tick))
    ctx.stroke()
  })
}

// Tarjeta del QR estilo "bloques": card blanca con borde rojo redondeado
// continuo — look sólido, coherente con las franjas de color del diseño.
function drawQrCardBloques(ctx, x, y, w, h, r) {
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = RED
  ctx.lineWidth = 6
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.stroke()
}

// Tarjeta del QR estilo "marco": sin relleno de borde continuo, con
// esquinas tipo "visor de cámara" — look distinto, más asociado a "escanear".
function drawQrCardVisor(ctx, x, y, w, h) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, y, w, h)
  const armLen = Math.min(w, h) * 0.16
  const lw = 10
  ctx.strokeStyle = RED
  ctx.lineWidth = lw
  ctx.lineCap = 'square'
  const corners = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ]
  corners.forEach(([cxp, cyp, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cxp, cyp + dy * armLen)
    ctx.lineTo(cxp, cyp)
    ctx.lineTo(cxp + dx * armLen, cyp)
    ctx.stroke()
  })
}

// CTA estilo "bloques": franja rellena sólida, esquinas apenas redondeadas.
function drawCtaBloques(ctx, cx, y, w, h, text, font, lineH, padY) {
  ctx.fillStyle = RED
  roundRect(ctx, cx - w / 2, y, w, h, h * 0.2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = font
  drawLines(ctx, [text], cx, y + padY, lineH)
}

// CTA estilo "marco": botón tipo píldora, contorno rojo sobre fondo blanco
// — silueta bien distinta a la franja sólida del otro diseño.
function drawCtaMarco(ctx, cx, y, w, h, text, font, lineH, padY) {
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = RED
  ctx.lineWidth = 6
  roundRect(ctx, cx - w / 2, y, w, h, h / 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = RED
  ctx.font = font
  drawLines(ctx, [text], cx, y + padY, lineH)
}

// Dibuja el arte del flyer en un <canvas> oculto a 300dpi y lo devuelve (sin
// descargar nada todavía) — lo usan tanto la descarga en PNG como en PDF.
async function construirCanvasFlyer({ tipo, sucursalLabel, qrCanvasId }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const t = TEXTOS[tipo] || TEXTOS.queja
  const esBloques = t.estilo === 'bloques'
  const logo = await loadImage('/logo-nasser.png')

  // --- Medidas de cada bloque (sin dibujar todavía) ---
  // Los tamaños están calibrados para que, incluso en el peor caso (título Y
  // subtítulo partidos en 2 líneas), el contenido total no supere la altura
  // del canvas — probado a mano contra los textos reales de TEXTOS arriba.
  const topBarH = esBloques ? H * 0.028 : H * 0.05 // en "marco" es solo margen, sin franja sólida
  const bottomBarH = esBloques ? H * 0.018 : H * 0.035
  const marcoInset = H * 0.018

  const logoW = W * 0.19
  const logoH = logoW * (logo.height / logo.width)

  const iconoH = esBloques ? H * 0.085 : H * 0.06

  const tituloFont = `bold ${Math.round(H * 0.05)}px Arial, sans-serif`
  const tituloLineH = H * 0.062
  ctx.font = tituloFont
  const tituloLines = wrapLines(ctx, t.titulo, W - SIDE_PAD * 2)

  const subFont = `${Math.round(H * 0.027)}px Arial, sans-serif`
  const subLineH = H * 0.036
  ctx.font = subFont
  const subLines = wrapLines(ctx, t.subtitulo, W - SIDE_PAD * 2.3)

  const qrSize = H * 0.3
  const cardPad = qrSize * 0.08
  const qrCardH = qrSize + cardPad * 2

  const ctaFont = `bold ${Math.round(H * 0.04)}px Arial, sans-serif`
  const ctaLineH = H * 0.04
  const ctaPadY = H * 0.017
  const ctaBannerH = ctaLineH + ctaPadY * 2

  const footerFont = `${Math.round(H * 0.021)}px Arial, sans-serif`
  const footerLineH = H * 0.028

  const gapTopLogo = H * 0.022
  const gapLogoIcono = H * 0.024
  const gapIconoTitulo = H * 0.022
  const gapTituloSub = H * 0.016
  const gapSubQr = H * 0.03
  const gapQrCta = H * 0.026
  const gapCtaFooter = H * 0.022

  const contentH =
    gapTopLogo +
    logoH +
    gapLogoIcono +
    iconoH +
    gapIconoTitulo +
    tituloLines.length * tituloLineH +
    gapTituloSub +
    subLines.length * subLineH +
    gapSubQr +
    qrCardH +
    gapQrCta +
    ctaBannerH +
    gapCtaFooter +
    footerLineH

  const availH = H - topBarH - bottomBarH
  const minPad = H * 0.015
  let y = topBarH + Math.max(minPad, (availH - contentH) / 2)
  if (y + contentH > H - bottomBarH - minPad) {
    y = Math.max(topBarH + 4, H - bottomBarH - minPad - contentH) // salvaguarda si el texto es más largo de lo previsto
  }
  const cx = W / 2

  // --- Fondo ---
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  if (esBloques) {
    // Diseño "bloques": franjas rojas sólidas arriba/abajo.
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, W - 4, H - 4)
    ctx.fillStyle = RED
    ctx.fillRect(0, 0, W, topBarH)
    ctx.fillRect(0, H - bottomBarH, W, bottomBarH)
  } else {
    // Diseño "marco": borde perimetral fino con marcas de esquina.
    drawMarcoPerimetral(ctx, marcoInset)
  }

  y += gapTopLogo

  // --- Logo ---
  ctx.drawImage(logo, cx - logoW / 2, y, logoW, logoH)
  y += logoH + gapLogoIcono

  // --- Ícono distintivo (alerta o estrellas) ---
  if (esBloques) {
    y += drawIconoAlerta(ctx, cx, y)
  } else {
    y += drawIconoEstrellas(ctx, cx, y)
  }
  y += gapIconoTitulo

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

  // --- QR: card sólida (bloques) o estilo visor (marco) ---
  const qrX = cx - qrSize / 2
  const qrY = y + cardPad
  if (esBloques) {
    drawQrCardBloques(ctx, qrX - cardPad, y, qrSize + cardPad * 2, qrCardH, 24)
  } else {
    drawQrCardVisor(ctx, qrX - cardPad, y, qrSize + cardPad * 2, qrCardH)
  }

  const qrSourceCanvas = document.getElementById(qrCanvasId)
  if (qrSourceCanvas) {
    ctx.drawImage(qrSourceCanvas, qrX, qrY, qrSize, qrSize)
  }
  y += qrCardH + gapQrCta

  // --- CTA: franja sólida (bloques) o píldora con contorno (marco) ---
  const ctaBannerW = W - SIDE_PAD * 1.3
  if (esBloques) {
    drawCtaBloques(ctx, cx, y, ctaBannerW, ctaBannerH, t.cta.toUpperCase(), ctaFont, ctaLineH, ctaPadY)
  } else {
    drawCtaMarco(ctx, cx, y, ctaBannerW, ctaBannerH, t.cta.toUpperCase(), ctaFont, ctaLineH, ctaPadY)
  }
  y += ctaBannerH + gapCtaFooter

  // --- Sucursal (pie) ---
  ctx.fillStyle = GRAY
  ctx.font = footerFont
  drawLines(ctx, [sucursalLabel], cx, y, footerLineH)

  return canvas
}

function descargarCanvasPNG(canvas, filename) {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

// Descarga solo el arte del flyer como PNG suelto (20x15cm a 300dpi).
export async function generarFlyerQR({ tipo, sucursalLabel, qrCanvasId, filename }) {
  const canvas = await construirCanvasFlyer({ tipo, sucursalLabel, qrCanvasId })
  descargarCanvasPNG(canvas, filename)
}

// Descarga un PDF tamaño oficio (216x330mm) con el flyer ya centrado y
// dimensionado a 20x15cm, más un recuadro negro de corte para que, al
// imprimir en oficio y recortar por esa línea, quede exacto para el soporte
// de acrílico.
export async function generarFlyerPDF({ tipo, sucursalLabel, qrCanvasId, filename }) {
  const canvas = await construirCanvasFlyer({ tipo, sucursalLabel, qrCanvasId })
  const imgData = canvas.toDataURL('image/png')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [OFICIO_W_MM, OFICIO_H_MM] })

  const x = (OFICIO_W_MM - FLYER_W_CM * 10) / 2
  const y = (OFICIO_H_MM - FLYER_H_CM * 10) / 2
  const w = FLYER_W_CM * 10
  const h = FLYER_H_CM * 10

  doc.addImage(imgData, 'PNG', x, y, w, h)

  // Recuadro negro exacto sobre el borde del flyer: es la línea de corte.
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.4)
  doc.rect(x, y, w, h, 'S')

  // Marcas de corte en las 4 esquinas, un poco por fuera del recuadro, para
  // poder alinear la regla/cutter incluso después de recortar el margen.
  const markLen = 6
  const markGap = 2
  const corners = [
    [x, y, -1, -1],
    [x + w, y, 1, -1],
    [x, y + h, -1, 1],
    [x + w, y + h, 1, 1],
  ]
  corners.forEach(([cxp, cyp, dx, dy]) => {
    doc.line(cxp + dx * markGap, cyp, cxp + dx * (markGap + markLen), cyp)
    doc.line(cxp, cyp + dy * markGap, cxp, cyp + dy * (markGap + markLen))
  })

  // Instrucción breve en el margen inferior de la hoja.
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Imprimir en tamaño oficio sin ajustar a página · Recortar por la línea marcada · Tamaño final: ${FLYER_W_CM} x ${FLYER_H_CM} cm`,
    OFICIO_W_MM / 2,
    OFICIO_H_MM - 8,
    { align: 'center' },
  )

  doc.save(filename)
}
