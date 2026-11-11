import type { Movimento } from '../types/movimento'
import type { Proteina } from '../types/proteina'
import { formatarKg, kgParaGramas, kgParaGramasPermitindoZero } from '../utils/unidades'

export type ValidacaoPeso = { ok: true; gramas: number } | { ok: false; erro: string }

export function validarSaida(pesoDigitado: string): ValidacaoPeso {
  const gramas = kgParaGramas(pesoDigitado)
  if (gramas === null) return { ok: false, erro: 'Informe a saída em kg, por exemplo 5,5.' }
  return { ok: true, gramas }
}

export function validarRetorno(pesoDigitado: string, saidaGramas: number): ValidacaoPeso {
  const gramas = kgParaGramasPermitindoZero(pesoDigitado)
  if (gramas === null) {
    return { ok: false, erro: 'Informe o retorno em kg. Se não voltou nada, digite 0.' }
  }
  if (gramas > saidaGramas) {
    return { ok: false, erro: `O retorno não pode ser maior que a saída (${formatarKg(saidaGramas)}).` }
  }
  return { ok: true, gramas }
}

// A saída só pode ser corrigida enquanto o retorno não foi informado (retorno 0 já conta como informado).
export function podeCorrigirSaida(movimento: Movimento): boolean {
  return movimento.retornoGramas === null
}

/** Proteínas que ainda podem ser lançadas no dia: cada uma só tem um movimento por dia. */
export function proteinasSemMovimento(proteinas: Proteina[], movimentos: Movimento[]): Proteina[] {
  const lancadas = new Set(movimentos.map((movimento) => movimento.proteinaId))
  return proteinas.filter((proteina) => !lancadas.has(proteina.id))
}

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
