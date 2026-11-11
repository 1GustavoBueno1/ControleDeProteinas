import { describe, expect, it } from 'vitest'
import { ehDataValida, formatarData, hojeEmSaoPaulo } from './data'

describe('hojeEmSaoPaulo', () => {
  it('devolve o dia no formato YYYY-MM-DD', () => {
    expect(hojeEmSaoPaulo(new Date('2026-11-11T15:00:00Z'))).toBe('2026-11-11')
  })

  // São Paulo está em UTC-3: 02:59 UTC ainda é 23:59 do dia anterior.
  it('ainda é o dia anterior um minuto antes da meia-noite de São Paulo', () => {
    expect(hojeEmSaoPaulo(new Date('2026-11-12T02:59:00Z'))).toBe('2026-11-11')
  })

  it('vira o dia à meia-noite de São Paulo, não à meia-noite UTC', () => {
    expect(hojeEmSaoPaulo(new Date('2026-11-12T03:00:00Z'))).toBe('2026-11-12')
  })

  it('volta para o ano anterior na virada de ano', () => {
    expect(hojeEmSaoPaulo(new Date('2027-01-01T01:30:00Z'))).toBe('2026-12-31')
  })

  it('preenche mês e dia com zero à esquerda', () => {
    expect(hojeEmSaoPaulo(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05')
  })
})

describe('ehDataValida', () => {
  it.each(['2026-11-11', '2024-02-29', '2026-01-01', '2026-12-31'])('aceita %s', (data) => {
    expect(ehDataValida(data)).toBe(true)
  })

  it.each([
    ['vazio', ''],
    ['formato brasileiro', '11/11/2026'],
    ['sem zero à esquerda', '2026-1-5'],
    ['mês 13', '2026-13-01'],
    ['mês 00', '2026-00-10'],
    ['dia 00', '2026-05-00'],
    ['30 de fevereiro', '2026-02-30'],
    ['29 de fevereiro em ano não bissexto', '2026-02-29'],
    ['31 de abril', '2026-04-31'],
    ['com hora', '2026-11-11T10:00'],
    ['texto', 'hoje'],
  ])('recusa %s', (_caso, data) => {
    expect(ehDataValida(data)).toBe(false)
  })
})

describe('formatarData', () => {
  it('mostra a data como dia/mês/ano', () => {
    expect(formatarData('2026-11-05')).toBe('05/11/2026')
  })
})
