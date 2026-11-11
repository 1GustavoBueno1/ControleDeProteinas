import {
  collection,
  doc,
  getDocs,
  runTransaction,
  type DocumentData,
  type Transaction,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { podeCorrigirSaida } from '../domain/movimento'
import type { Movimento } from '../types/movimento'
import { ehDataValida } from '../utils/data'
import { formatarKg } from '../utils/unidades'
import { traduzirErro } from './erroFirestore'

function colecaoDoDia(data: string) {
  if (!ehDataValida(data)) throw new Error(`Data inválida: ${data}.`)
  return collection(db, 'dias', data, 'movimentos')
}

// Documento fora do formato (editado à mão no console, por exemplo) é ignorado em vez de quebrar a tela.
function paraMovimento(id: string, dados: DocumentData): Movimento | null {
  const nomeSnapshot: unknown = dados.nomeSnapshot
  const precoPorKgCentavosSnapshot: unknown = dados.precoPorKgCentavosSnapshot
  const saidaGramas: unknown = dados.saidaGramas
  const retornoGramas: unknown = dados.retornoGramas
  const criadoPor: unknown = dados.criadoPor
  if (
    typeof nomeSnapshot !== 'string' ||
    typeof precoPorKgCentavosSnapshot !== 'number' ||
    typeof saidaGramas !== 'number' ||
    (retornoGramas !== null && typeof retornoGramas !== 'number') ||
    typeof criadoPor !== 'string'
  ) {
    console.warn(`Movimento ${id} ignorado: campos fora do formato esperado.`)
    return null
  }
  return { proteinaId: id, nomeSnapshot, precoPorKgCentavosSnapshot, saidaGramas, retornoGramas, criadoPor }
}

// A operação devolve o motivo da recusa (regra de negócio) ou null quando gravou.
// Ler e gravar na mesma transação evita decidir com dados velhos da tela.
async function emTransacao(operacao: (tx: Transaction) => Promise<string | null>): Promise<void> {
  let recusa: string | null
  try {
    recusa = await runTransaction(db, operacao)
  } catch (erro) {
    throw traduzirErro(erro)
  }
  if (recusa) throw new Error(recusa)
}

/** Movimentos do dia em ordem alfabética do nome lançado. */
export async function listarMovimentosDoDia(data: string): Promise<Movimento[]> {
  const colecao = colecaoDoDia(data)
  try {
    const resultado = await getDocs(colecao)
    return resultado.docs
      .map((d) => paraMovimento(d.id, d.data()))
      .filter((movimento) => movimento !== null)
      .sort((a, b) => a.nomeSnapshot.localeCompare(b.nomeSnapshot, 'pt-BR'))
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// O ID do documento é o proteinaId: a mesma proteína não entra duas vezes no mesmo dia.
export async function lancarSaida(data: string, movimento: Movimento): Promise<void> {
  const referencia = doc(colecaoDoDia(data), movimento.proteinaId)
  await emTransacao(async (tx) => {
    const atual = await tx.get(referencia)
    if (atual.exists()) return 'Essa proteína já foi lançada neste dia.'
    tx.set(referencia, {
      proteinaId: movimento.proteinaId,
      nomeSnapshot: movimento.nomeSnapshot,
      precoPorKgCentavosSnapshot: movimento.precoPorKgCentavosSnapshot,
      saidaGramas: movimento.saidaGramas,
      retornoGramas: null,
      criadoPor: movimento.criadoPor,
    })
    return null
  })
}

export async function corrigirSaida(data: string, proteinaId: string, saidaGramas: number): Promise<void> {
  const referencia = doc(colecaoDoDia(data), proteinaId)
  await emTransacao(async (tx) => {
    const snap = await tx.get(referencia)
    const atual = snap.exists() ? paraMovimento(snap.id, snap.data()) : null
    if (!atual) return 'Esse lançamento não foi encontrado. Atualize a tela.'
    if (!podeCorrigirSaida(atual)) {
      return 'O retorno já foi informado, então a saída não pode mais ser corrigida.'
    }
    tx.update(referencia, { saidaGramas })
    return null
  })
}

/** Informa o retorno pela primeira vez ou corrige um retorno já informado. */
export async function informarRetorno(data: string, proteinaId: string, retornoGramas: number): Promise<void> {
  const referencia = doc(colecaoDoDia(data), proteinaId)
  await emTransacao(async (tx) => {
    const snap = await tx.get(referencia)
    const atual = snap.exists() ? paraMovimento(snap.id, snap.data()) : null
    if (!atual) return 'Esse lançamento não foi encontrado. Atualize a tela.'
    if (retornoGramas > atual.saidaGramas) {
      return `O retorno não pode ser maior que a saída (${formatarKg(atual.saidaGramas)}).`
    }
    tx.update(referencia, { retornoGramas })
    return null
  })
}
