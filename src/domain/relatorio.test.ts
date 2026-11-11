import { describe, expect, it } from 'vitest'
import type { Movimento } from '../types/movimento'
import type { Proteina } from '../types/proteina'
import { criarMovimento } from './movimento'
import { montarRelatorio, movimentosPendentes, podeGerarRelatorio } from './relatorio'

function movimento(campos: Partial<Movimento>): Movimento {
  return {
    proteinaId: 'picanha',
    nomeSnapshot: 'Picanha',
    precoPorKgCentavosSnapshot: 8990,
    saidaGramas: 5000,
    retornoGramas: 0,
    criadoPor: 'uid-churras',
    ...campos,
  }
}

const picanhaPendente = movimento({ retornoGramas: null })
const linguicaFechada = movimento({
  proteinaId: 'linguica',
  nomeSnapshot: 'Linguiça',
  precoPorKgCentavosSnapshot: 2500,
  saidaGramas: 3000,
  retornoGramas: 1000,
})
const fraldinhaPendente = movimento({
  proteinaId: 'fraldinha',
  nomeSnapshot: 'Fraldinha',
  retornoGramas: null,
})

describe('movimentosPendentes', () => {
  it('lista só os movimentos sem retorno informado', () => {
    expect(movimentosPendentes([picanhaPendente, linguicaFechada, fraldinhaPendente])).toEqual([
      picanhaPendente,
      fraldinhaPendente,
    ])
  })

  it('retorno 0 conta como informado, não como pendente', () => {
    expect(movimentosPendentes([movimento({ retornoGramas: 0 })])).toEqual([])
  })

  it('dia vazio não tem pendência', () => {
    expect(movimentosPendentes([])).toEqual([])
  })
})

describe('podeGerarRelatorio', () => {
  it('libera quando todos os movimentos têm retorno informado', () => {
    expect(podeGerarRelatorio([linguicaFechada, movimento({ retornoGramas: 0 })])).toBe(true)
  })

  it('bloqueia dia vazio', () => {
    expect(podeGerarRelatorio([])).toBe(false)
  })

  it('bloqueia quando um único movimento está pendente', () => {
    expect(podeGerarRelatorio([linguicaFechada, picanhaPendente])).toBe(false)
  })
})

describe('montarRelatorio', () => {
  it('com retorno 0 o consumo é a saída inteira', () => {
    const relatorio = montarRelatorio('2026-11-11', [
      movimento({ saidaGramas: 5000, retornoGramas: 0, precoPorKgCentavosSnapshot: 4590 }),
    ])

    // 5 kg x R$ 45,90 = R$ 229,50
    expect(relatorio).toEqual({
      data: '2026-11-11',
      itens: [
        {
          proteinaId: 'picanha',
          nome: 'Picanha',
          saidaGramas: 5000,
          retornoGramas: 0,
          consumoGramas: 5000,
          precoPorKgCentavos: 4590,
          custoCentavos: 22950,
        },
      ],
      custoTotalCentavos: 22950,
    })
  })

  it('com retorno parcial cobra só o que foi consumido', () => {
    const relatorio = montarRelatorio('2026-11-11', [
      movimento({ saidaGramas: 5500, retornoGramas: 1500, precoPorKgCentavosSnapshot: 4590 }),
    ])

    // (5,5 kg - 1,5 kg) x R$ 45,90 = R$ 183,60
    expect(relatorio?.itens[0]?.consumoGramas).toBe(4000)
    expect(relatorio?.itens[0]?.custoCentavos).toBe(18360)
    expect(relatorio?.custoTotalCentavos).toBe(18360)
  })

  it('soma o custo de várias proteínas e mantém a ordem recebida', () => {
    const relatorio = montarRelatorio('2026-11-11', [
      movimento({ saidaGramas: 5000, retornoGramas: 1000 }),
      linguicaFechada,
    ])

    // Picanha: 4 kg x R$ 89,90 = R$ 359,60. Linguiça: 2 kg x R$ 25,00 = R$ 50,00.
    expect(relatorio?.itens.map((item) => item.nome)).toEqual(['Picanha', 'Linguiça'])
    expect(relatorio?.itens.map((item) => item.custoCentavos)).toEqual([35960, 5000])
    expect(relatorio?.custoTotalCentavos).toBe(40960)
  })

  it('usa o preço do lançamento mesmo que o catálogo mude depois', () => {
    const proteina: Proteina = {
      id: 'picanha',
      nome: 'Picanha',
      precoPorKgCentavos: 8990,
      ativo: true,
      criadoEm: new Date('2026-11-01T12:00:00Z'),
    }
    const lancado = criarMovimento(proteina, 2000, 'uid-churras')

    // O churras edita o cadastro depois da saída: preço sobe e o nome muda.
    proteina.precoPorKgCentavos = 9990
    proteina.nome = 'Picanha Angus'

    const relatorio = montarRelatorio('2026-11-11', [{ ...lancado, retornoGramas: 0 }])

    // 2 kg x R$ 89,90 (preço antigo) = R$ 179,80
    expect(relatorio?.itens[0]?.nome).toBe('Picanha')
    expect(relatorio?.itens[0]?.precoPorKgCentavos).toBe(8990)
    expect(relatorio?.custoTotalCentavos).toBe(17980)
  })

  it('arredonda uma vez por item: três itens de meio centavo somam 3, não 2', () => {
    // Cada item: 0,001 kg x R$ 5,00 = 0,5 centavo -> 1. Arredondar só o total daria 1,5 -> 2.
    const meioCentavo = { saidaGramas: 1, retornoGramas: 0, precoPorKgCentavosSnapshot: 500 }
    const relatorio = montarRelatorio('2026-11-11', [
      movimento({ ...meioCentavo, proteinaId: 'a' }),
      movimento({ ...meioCentavo, proteinaId: 'b' }),
      movimento({ ...meioCentavo, proteinaId: 'c' }),
    ])

    expect(relatorio?.itens.map((item) => item.custoCentavos)).toEqual([1, 1, 1])
    expect(relatorio?.custoTotalCentavos).toBe(3)
  })

  it('arredonda uma vez por item: três itens de 0,4 centavo somam 0, não 1', () => {
    // Cada item: 0,001 kg x R$ 4,00 = 0,4 centavo -> 0. Arredondar só o total daria 1,2 -> 1.
    const quaseMeio = { saidaGramas: 1, retornoGramas: 0, precoPorKgCentavosSnapshot: 400 }
    const relatorio = montarRelatorio('2026-11-11', [
      movimento({ ...quaseMeio, proteinaId: 'a' }),
      movimento({ ...quaseMeio, proteinaId: 'b' }),
      movimento({ ...quaseMeio, proteinaId: 'c' }),
    ])

    expect(relatorio?.custoTotalCentavos).toBe(0)
  })

  it('não monta relatório de dia vazio', () => {
    expect(montarRelatorio('2026-11-11', [])).toBeNull()
  })

  it('não monta relatório enquanto houver pendência', () => {
    expect(montarRelatorio('2026-11-11', [linguicaFechada, picanhaPendente])).toBeNull()
  })
})
