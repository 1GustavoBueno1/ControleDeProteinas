import { FirebaseError } from 'firebase/app'
import { describe, expect, it } from 'vitest'
import { traduzirErro } from './erroFirestore'

describe('traduzirErro', () => {
  it('explica permissão negada', () => {
    const original = new FirebaseError('permission-denied', 'Missing or insufficient permissions.')

    expect(traduzirErro(original).message).toBe('Seu perfil não tem permissão para fazer isso.')
  })

  it('explica falta de conexão', () => {
    const original = new FirebaseError('unavailable', 'Failed to get document because the client is offline.')

    expect(traduzirErro(original).message).toBe('Sem conexão. Verifique a internet e tente de novo.')
  })

  it('inclui o código quando o erro do Firebase não é conhecido', () => {
    const original = new FirebaseError('resource-exhausted', 'Quota exceeded.')

    expect(traduzirErro(original).message).toBe('Não foi possível concluir (resource-exhausted). Tente de novo.')
  })

  it('usa mensagem genérica para erro que não veio do Firebase', () => {
    expect(traduzirErro(new TypeError('x is not a function')).message).toBe(
      'Não foi possível concluir. Tente de novo.',
    )
  })

  it('guarda o erro original em cause, para aparecer no console', () => {
    const original = new FirebaseError('permission-denied', 'Missing or insufficient permissions.')

    expect(traduzirErro(original).cause).toBe(original)
  })
})
