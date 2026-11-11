import type { Movimento } from '../types/movimento'
import type { ItemRelatorio, RelatorioDiario } from '../types/relatorio'
import { calcularConsumoGramas, calcularCustoCentavos } from './custo'

export function movimentosPendentes(movimentos: Movimento[]): Movimento[] {
  return movimentos.filter((movimento) => movimento.retornoGramas === null)
}

export function podeGerarRelatorio(movimentos: Movimento[]): boolean {
  return movimentos.length > 0 && movimentosPendentes(movimentos).length === 0
}

function montarItem(movimento: Movimento, retornoGramas: number): ItemRelatorio {
  const consumoGramas = calcularConsumoGramas(movimento.saidaGramas, retornoGramas)
  return {
    proteinaId: movimento.proteinaId,
    nome: movimento.nomeSnapshot,
    saidaGramas: movimento.saidaGramas,
    retornoGramas,
    consumoGramas,
    precoPorKgCentavos: movimento.precoPorKgCentavosSnapshot,
    custoCentavos: calcularCustoCentavos(consumoGramas, movimento.precoPorKgCentavosSnapshot),
  }
}

/** Devolve null quando o dia ainda não pode gerar relatório (vazio ou com retorno pendente). */
export function montarRelatorio(data: string, movimentos: Movimento[]): RelatorioDiario | null {
  if (movimentos.length === 0) return null

  const itens: ItemRelatorio[] = []
  for (const movimento of movimentos) {
    if (movimento.retornoGramas === null) return null
    itens.push(montarItem(movimento, movimento.retornoGramas))
  }

  const custoTotalCentavos = itens.reduce((total, item) => total + item.custoCentavos, 0)
  return { data, itens, custoTotalCentavos }
}
