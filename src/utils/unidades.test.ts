import { describe, expect, it } from 'vitest'
import {
  formatarKg,
  formatarReais,
  kgParaGramas,
  kgParaGramasPermitindoZero,
  reaisParaCentavos,
} from './unidades'

describe('kgParaGramas', () => {
  it.each([
    ['5,5', 5500],
    ['5.5', 5500],
    ['5', 5000],
    ['0,001', 1],
    ['12,345', 12345],
    [' 2,5 ', 2500],
    // 1.005 * 1000 em ponto flutuante dá 1004.9999999999999; sem Math.round viraria 1004.
    ['1,005', 1005],
    ['4,35', 4350],
  ])('converte "%s" kg em %i gramas', (texto, gramas) => {
    expect(kgParaGramas(texto)).toBe(gramas)
  })

  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
    ['zero', '0'],
    ['zero com casas', '0,000'],
    ['negativo', '-5'],
    ['texto', 'abc'],
    ['número com unidade', '5kg'],
    ['mais de 3 casas decimais', '1,2345'],
    ['dois separadores', '1.234,5'],
    ['separador sem casas', '5,'],
    ['notação científica', '1e3'],
  ])('recusa %s', (_caso, texto) => {
    expect(kgParaGramas(texto)).toBeNull()
  })
})

describe('kgParaGramasPermitindoZero', () => {
  it('aceita zero, porque retorno 0 é um retorno informado', () => {
    expect(kgParaGramasPermitindoZero('0')).toBe(0)
    expect(kgParaGramasPermitindoZero('0,000')).toBe(0)
  })

  it('converte pesos positivos como kgParaGramas', () => {
    expect(kgParaGramasPermitindoZero('2,25')).toBe(2250)
  })

  it.each([
    ['vazio', ''],
    ['negativo', '-1'],
    ['texto', 'zero'],
    ['mais de 3 casas decimais', '0,0001'],
  ])('recusa %s', (_caso, texto) => {
    expect(kgParaGramasPermitindoZero(texto)).toBeNull()
  })
})

describe('reaisParaCentavos', () => {
  it.each([
    ['45,90', 4590],
    ['45.90', 4590],
    ['45,9', 4590],
    ['45', 4500],
    ['0,01', 1],
    [' 39,99 ', 3999],
    // 1.15 * 100 em ponto flutuante dá 114.99999999999999; sem Math.round viraria 114.
    ['1,15', 115],
    ['19,99', 1999],
  ])('converte "R$ %s" em %i centavos', (texto, centavos) => {
    expect(reaisParaCentavos(texto)).toBe(centavos)
  })

  it.each([
    ['vazio', ''],
    ['zero', '0'],
    ['zero com casas', '0,00'],
    ['negativo', '-45,90'],
    ['texto', 'abc'],
    ['com símbolo da moeda', 'R$ 45,90'],
    ['mais de 2 casas decimais', '45,905'],
    ['dois separadores', '1.045,90'],
  ])('recusa %s', (_caso, texto) => {
    expect(reaisParaCentavos(texto)).toBeNull()
  })
})

describe('formatarKg', () => {
  it.each([
    [5500, '5,500 kg'],
    [1, '0,001 kg'],
    [0, '0,000 kg'],
    [12000, '12,000 kg'],
    [1234567, '1.234,567 kg'],
  ])('mostra %i gramas como "%s"', (gramas, texto) => {
    expect(formatarKg(gramas)).toBe(texto)
  })
})

describe('formatarReais', () => {
  it.each([
    [4590, 'R$ 45,90'],
    [5, 'R$ 0,05'],
    [0, 'R$ 0,00'],
    [100000, 'R$ 1.000,00'],
    [123456789, 'R$ 1.234.567,89'],
  ])('mostra %i centavos como "%s"', (centavos, texto) => {
    expect(formatarReais(centavos)).toBe(texto)
  })
})
