// Genera y descarga CSV compatible con Excel (BOM + separador ";",
// que es lo que Excel en español espera por defecto).

export function toCSV(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const header = columns.map((c) => c.label).join(';')
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(';'))
  return [header, ...lines].join('\r\n')
}

export function downloadCSV(filename, content) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
