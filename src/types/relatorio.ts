export interface ItemRelatorio {
  proteinaId: string
  nome: string
  saidaGramas: number
  retornoGramas: number
  consumoGramas: number
  precoPorKgCentavos: number
  custoCentavos: number
}

export interface RelatorioDiario {
  data: string
  itens: ItemRelatorio[]
  custoTotalCentavos: number
}
