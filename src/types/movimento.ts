export interface Movimento {
  proteinaId: string
  nomeSnapshot: string
  precoPorKgCentavosSnapshot: number
  saidaGramas: number
  // null = retorno ainda não informado; 0 é um retorno válido.
  retornoGramas: number | null
  criadoPor: string
}
