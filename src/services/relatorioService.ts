import { montarRelatorio } from '../domain/relatorio'
import type { RelatorioDiario } from '../types/relatorio'
import { listarMovimentosDoDia } from './movimentosService'

// O relatório não é gravado: é sempre calculado na hora, a partir dos movimentos lidos de novo do Firestore.
export async function gerarRelatorioDoDia(data: string): Promise<RelatorioDiario> {
  const movimentos = await listarMovimentosDoDia(data)
  const relatorio = montarRelatorio(data, movimentos)
  if (!relatorio) {
    throw new Error('Este dia não pode gerar relatório agora: está vazio ou tem retorno pendente.')
  }
  return relatorio
}
