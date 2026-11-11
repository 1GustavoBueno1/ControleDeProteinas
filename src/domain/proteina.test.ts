import { describe, expect, it } from 'vitest'
import { validarProteina } from './proteina'

describe('validarProteina', () => {
  it('aceita nome e preço válidos, já convertendo o preço para centavos', () => {
    expect(validarProteina('Picanha', '89,90', [])).toEqual({
      ok: true,
      dados: { nome: 'Picanha', precoPorKgCentavos: 8990 },
    })
  })

  it('tira os espaços das pontas do nome', () => {
    expect(validarProteina('  Fraldinha  ', '45', [])).toEqual({
      ok: true,
      dados: { nome: 'Fraldinha', precoPorKgCentavos: 4500 },
    })
  })

  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
  ])('recusa nome %s', (_caso, nome) => {
    const resultado = validarProteina(nome, '89,90', [])

    expect(resultado.ok).toBe(false)
    expect(resultado.ok === false && resultado.erros.nome).toBe('Informe o nome da proteína.')
    expect(resultado.ok === false && resultado.erros.preco).toBeUndefined()
  })

  it.each([
    ['vazio', ''],
    ['zero', '0'],
    ['negativo', '-10'],
    ['texto', 'caro'],
    ['com mais de 2 casas', '45,905'],
  ])('recusa preço %s', (_caso, preco) => {
    const resultado = validarProteina('Picanha', preco, [])

    expect(resultado.ok).toBe(false)
    expect(resultado.ok === false && resultado.erros.preco).toBe(
      'Informe o preço por kg em reais, por exemplo 45,90.',
    )
    expect(resultado.ok === false && resultado.erros.nome).toBeUndefined()
  })

  it('aponta os dois campos quando os dois estão errados', () => {
    const resultado = validarProteina('', '', [])

    expect(resultado.ok === false && Object.keys(resultado.erros).sort()).toEqual(['nome', 'preco'])
  })

  it('recusa nome que já existe, ignorando maiúsculas e espaços nas pontas', () => {
    const resultado = validarProteina(' picanha ', '89,90', ['Linguiça', 'Picanha'])

    expect(resultado.ok === false && resultado.erros.nome).toBe(
      'Já existe uma proteína ativa com esse nome.',
    )
  })

  it('aceita nome parecido que não é igual', () => {
    expect(validarProteina('Picanha Angus', '120', ['Picanha']).ok).toBe(true)
  })
})
