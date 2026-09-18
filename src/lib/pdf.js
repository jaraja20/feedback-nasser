import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Genera y descarga un PDF simple con una tabla, usado por el Relatorio.
export function generarPDF({ titulo, subtitulo, columnas, filas, filename }) {
  const docPdf = new jsPDF({ orientation: 'landscape' })

  docPdf.setFontSize(16)
  docPdf.setTextColor(23, 23, 23)
  docPdf.text(titulo, 14, 16)

  if (subtitulo) {
    docPdf.setFontSize(10)
    docPdf.setTextColor(115, 115, 115)
    docPdf.text(subtitulo, 14, 23)
  }

  autoTable(docPdf, {
    startY: 28,
    head: [columnas.map((c) => c.label)],
    body: filas.map((row) => columnas.map((c) => c.value(row) ?? '')),
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [220, 38, 38], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 },
  })

  docPdf.save(filename)
}
