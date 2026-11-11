import type { Movimento } from '../types/movimento'
import type { Proteina } from '../types/proteina'

// Nome e preço são copiados aqui para o relatório do dia não mudar quando o cadastro for editado.
export function criarMovimento(proteina: Proteina, saidaGramas: number, criadoPor: string): Movimento {
  return {
    proteinaId: proteina.id,
    nomeSnapshot: proteina.nome,
    precoPorKgCentavosSnapshot: proteina.precoPorKgCentavos,
    saidaGramas,
    retornoGramas: null,
    criadoPor,
  }
}
