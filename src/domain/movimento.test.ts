import { describe, expect, it } from 'vitest'
import type { Movimento } from '../types/movimento'
import type { Proteina } from '../types/proteina'
import {
  criarMovimento,
  podeCorrigirSaida,
  proteinasSemMovimento,
  validarRetorno,
  validarSaida,
} from './movimento'

function proteina(id: string, nome: string): Proteina {
  return { id, nome, precoPorKgCentavos: 5000, ativo: true, criadoEm: new Date('2026-11-01T12:00:00Z') }
}

function movimento(campos: Partial<Movimento>): Movimento {
  return {
    proteinaId: 'picanha',
    nomeSnapshot: 'Picanha',
    precoPorKgCentavosSnapshot: 8990,
    saidaGramas: 5000,
    retornoGramas: null,
    criadoPor: 'uid-churras',
    ...campos,
  }
}

describe('validarSaida', () => {
  it('aceita peso em kg e devolve em gramas', () => {
    expect(validarSaida('5,5')).toEqual({ ok: true, gramas: 5500 })
  })

  it.each([
    ['vazio', ''],
    ['zero', '0'],
    ['negativo', '-2'],
    ['texto', 'cinco'],
    ['com mais de 3 casas', '1,2345'],
  ])('recusa peso %s', (_caso, texto) => {
    expect(validarSaida(texto)).toEqual({ ok: false, erro: 'Informe a saída em kg, por exemplo 5,5.' })
  })
})

describe('validarRetorno', () => {
  it('aceita retorno menor que a saída', () => {
    expect(validarRetorno('1,5', 5500)).toEqual({ ok: true, gramas: 1500 })
  })

  it('aceita retorno 0: nada voltou, mas o retorno foi informado', () => {
    expect(validarRetorno('0', 5500)).toEqual({ ok: true, gramas: 0 })
  })

  it('aceita retorno igual à saída: tudo voltou', () => {
    expect(validarRetorno('5,5', 5500)).toEqual({ ok: true, gramas: 5500 })
  })

  it('recusa retorno um grama maior que a saída', () => {
    expect(validarRetorno('5,501', 5500)).toEqual({
      ok: false,
      erro: 'O retorno não pode ser maior que a saída (5,500 kg).',
    })
  })

  it.each([
    ['vazio', ''],
    ['negativo', '-1'],
    ['texto', 'nada'],
    ['com mais de 3 casas', '0,0001'],
  ])('recusa retorno %s', (_caso, texto) => {
    expect(validarRetorno(texto, 5500)).toEqual({
      ok: false,
      erro: 'Informe o retorno em kg. Se não voltou nada, digite 0.',
    })
  })
})

describe('podeCorrigirSaida', () => {
  it('permite enquanto o retorno não foi informado', () => {
    expect(podeCorrigirSaida(movimento({ retornoGramas: null }))).toBe(true)
  })

  it('bloqueia depois do retorno informado', () => {
    expect(podeCorrigirSaida(movimento({ retornoGramas: 1000 }))).toBe(false)
  })

  it('bloqueia também quando o retorno informado é 0', () => {
    expect(podeCorrigirSaida(movimento({ retornoGramas: 0 }))).toBe(false)
  })
})

describe('proteinasSemMovimento', () => {
  const picanha = proteina('picanha', 'Picanha')
  const linguica = proteina('linguica', 'Linguiça')
  const fraldinha = proteina('fraldinha', 'Fraldinha')

  it('tira as proteínas que já têm movimento no dia', () => {
    const movimentos = [movimento({ proteinaId: 'picanha' }), movimento({ proteinaId: 'fraldinha' })]

    expect(proteinasSemMovimento([picanha, linguica, fraldinha], movimentos)).toEqual([linguica])
  })

  it('devolve todas quando o dia está vazio', () => {
    expect(proteinasSemMovimento([picanha, linguica], [])).toEqual([picanha, linguica])
  })

  it('devolve lista vazia quando todas já foram lançadas', () => {
    expect(proteinasSemMovimento([picanha], [movimento({ proteinaId: 'picanha' })])).toEqual([])
  })
})

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
