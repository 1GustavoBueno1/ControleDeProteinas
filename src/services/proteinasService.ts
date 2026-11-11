import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { DadosProteina } from '../domain/proteina'
import type { Proteina } from '../types/proteina'
import { traduzirErro } from './erroFirestore'

const colecao = collection(db, 'proteinas')

// Documento fora do formato (editado à mão no console, por exemplo) é ignorado em vez de quebrar a tela.
function paraProteina(id: string, dados: DocumentData): Proteina | null {
  const nome: unknown = dados.nome
  const precoPorKgCentavos: unknown = dados.precoPorKgCentavos
  const ativo: unknown = dados.ativo
  const criadoEm: unknown = dados.criadoEm
  if (
    typeof nome !== 'string' ||
    typeof precoPorKgCentavos !== 'number' ||
    typeof ativo !== 'boolean' ||
    !(criadoEm instanceof Timestamp)
  ) {
    console.warn(`proteinas/${id} ignorada: campos fora do formato esperado.`)
    return null
  }
  return { id, nome, precoPorKgCentavos, ativo, criadoEm: criadoEm.toDate() }
}

/** Proteínas ativas em ordem alfabética. */
export async function listarProteinasAtivas(): Promise<Proteina[]> {
  try {
    const resultado = await getDocs(query(colecao, where('ativo', '==', true)))
    return resultado.docs
      .map((d) => paraProteina(d.id, d.data({ serverTimestamps: 'estimate' })))
      .filter((proteina) => proteina !== null)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function criarProteina(dados: DadosProteina): Promise<void> {
  try {
    await addDoc(colecao, {
      nome: dados.nome,
      precoPorKgCentavos: dados.precoPorKgCentavos,
      ativo: true,
      criadoEm: serverTimestamp(),
    })
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

export async function editarProteina(id: string, dados: DadosProteina): Promise<void> {
  try {
    await updateDoc(doc(colecao, id), {
      nome: dados.nome,
      precoPorKgCentavos: dados.precoPorKgCentavos,
    })
  } catch (erro) {
    throw traduzirErro(erro)
  }
}

// Proteína nunca é apagada: desativar preserva o histórico dos dias em que ela foi lançada.
export async function desativarProteina(id: string): Promise<void> {
  try {
    await updateDoc(doc(colecao, id), { ativo: false })
  } catch (erro) {
    throw traduzirErro(erro)
  }
}
