import { describe, expect, it } from 'vitest'
import type { Proteina } from '../types/proteina'
import { criarMovimento } from './movimento'

const picanha: Proteina = {
  id: 'picanha',
  nome: 'Picanha',
  precoPorKgCentavos: 8990,
  ativo: true,
  criadoEm: new Date('2026-11-01T12:00:00Z'),
}

describe('criarMovimento', () => {
  it('copia nome e preço da proteína como snapshot e deixa o retorno pendente', () => {
    expect(criarMovimento(picanha, 5500, 'uid-churras')).toEqual({
      proteinaId: 'picanha',
      nomeSnapshot: 'Picanha',
      precoPorKgCentavosSnapshot: 8990,
      saidaGramas: 5500,
      retornoGramas: null,
      criadoPor: 'uid-churras',
    })
  })
})
