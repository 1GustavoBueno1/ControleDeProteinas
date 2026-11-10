import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { ehRole, type Role } from '../types/usuario'

export type ResultadoRole = { ok: true; role: Role } | { ok: false; motivo: string }

// Sem documento ou com role desconhecida o usuário fica sem acesso; o motivo ajuda a corrigir o cadastro no console.
export async function buscarRole(uid: string): Promise<ResultadoRole> {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  if (!snap.exists()) {
    return { ok: false, motivo: `O documento usuarios/${uid} não existe.` }
  }
  const dados = snap.data()
  const role: unknown = dados.role
  if (!ehRole(role)) {
    const campos = Object.keys(dados).join(', ') || 'nenhum'
    return {
      ok: false,
      motivo: `O documento existe, mas o campo role é inválido: ${JSON.stringify(role)}. Campos encontrados: ${campos}.`,
    }
  }
  return { ok: true, role }
}
