const integerFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function formatInteger(value: number) {
  return integerFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatMoney(value: number, suffix = '₽') {
  return `${formatInteger(value)} ${suffix}`
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function formatNumericInput(value: string) {
  const normalized = digitsOnly(value)
  if (!normalized) return ''
  return formatInteger(Number(normalized))
}

export function parseFormattedInteger(value: string) {
  const normalized = digitsOnly(value)
  return normalized ? Number(normalized) : 0
}
