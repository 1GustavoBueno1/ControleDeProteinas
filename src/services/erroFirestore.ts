import { FirebaseError } from 'firebase/app'

function mensagem(erro: unknown): string {
  if (!(erro instanceof FirebaseError)) return 'Não foi possível concluir. Tente de novo.'
  switch (erro.code) {
    case 'permission-denied':
      return 'Seu perfil não tem permissão para fazer isso.'
    case 'unavailable':
      return 'Sem conexão. Verifique a internet e tente de novo.'
    default:
      return `Não foi possível concluir (${erro.code}). Tente de novo.`
  }
}

/** Converte qualquer falha do Firestore em um Error com mensagem em português, pronta para a tela. */
export function traduzirErro(erro: unknown): Error {
  return new Error(mensagem(erro), { cause: erro })
}
