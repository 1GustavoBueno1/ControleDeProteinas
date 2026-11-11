import { describe, expect, it } from 'vitest'
import { calcularConsumoGramas, calcularCustoCentavos } from './custo'

describe('calcularConsumoGramas', () => {
  it('é a saída menos o retorno', () => {
    expect(calcularConsumoGramas(5500, 1500)).toBe(4000)
  })

  it('com retorno 0 o consumo é a saída inteira', () => {
    expect(calcularConsumoGramas(5500, 0)).toBe(5500)
  })

  it('é zero quando tudo o que saiu voltou', () => {
    expect(calcularConsumoGramas(5500, 5500)).toBe(0)
  })
})

describe('calcularCustoCentavos', () => {
  it('multiplica o consumo em kg pelo preço por kg', () => {
    // 4 kg x R$ 45,90 = R$ 183,60
    expect(calcularCustoCentavos(4000, 4590)).toBe(18360)
  })

  it('consumo zero custa zero', () => {
    expect(calcularCustoCentavos(0, 4590)).toBe(0)
  })

  it.each([
    // 0,333 kg x R$ 45,90 = 1528,47 centavos
    [333, 4590, 1528],
    // 0,335 kg x R$ 45,90 = 1537,65 centavos
    [335, 4590, 1538],
    // 0,001 kg x R$ 5,00 = 0,5 centavo: meio centavo sobe
    [1, 500, 1],
    // 0,001 kg x R$ 4,99 = 0,499 centavo
    [1, 499, 0],
    // 1,234 kg x R$ 89,99 = 11104,766 centavos
    [1234, 8999, 11105],
  ])('arredonda %i g a %i centavos/kg para %i centavos', (consumo, preco, custo) => {
    expect(calcularCustoCentavos(consumo, preco)).toBe(custo)
  })
})
