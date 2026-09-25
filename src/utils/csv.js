function escapeCell(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return false
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return true
}
