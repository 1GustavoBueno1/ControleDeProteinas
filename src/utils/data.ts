const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/

const calendarioSaoPaulo = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Dia corrente em São Paulo como "YYYY-MM-DD", independente do fuso do aparelho. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  const partes = calendarioSaoPaulo.formatToParts(agora)
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? ''
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}

export function ehDataValida(data: string): boolean {
  if (!FORMATO_DATA.test(data)) return false
  const instante = new Date(`${data}T00:00:00Z`)
  // O Date "conserta" dias inexistentes (30/02 vira 02/03); se mudou, a data não existe.
  return !Number.isNaN(instante.getTime()) && instante.toISOString().slice(0, 10) === data
}

/** "2026-11-05" -> "05/11/2026". */
export function formatarData(data: string): string {
  return data.split('-').reverse().join('/')
}
