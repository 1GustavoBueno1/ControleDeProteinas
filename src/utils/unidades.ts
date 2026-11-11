const PESO_EM_KG = /^\d+([.,]\d{1,3})?$/
const PRECO_EM_REAIS = /^\d+([.,]\d{1,2})?$/

function converter(texto: string, formato: RegExp, fator: number): number | null {
  const limpo = texto.trim()
  if (!formato.test(limpo)) return null
  // Math.round corrige o erro de ponto flutuante (1.005 * 1000 = 1004.9999999999999).
  return Math.round(Number(limpo.replace(',', '.')) * fator)
}

function apenasPositivo(valor: number | null): number | null {
  return valor !== null && valor > 0 ? valor : null
}

/** Peso digitado em kg ("5,5" ou "5.5") para gramas. Devolve null se for inválido ou zero. */
export function kgParaGramas(texto: string): number | null {
  return apenasPositivo(kgParaGramasPermitindoZero(texto))
}

/** Igual a kgParaGramas, mas aceita zero: usado no retorno, onde 0 é um valor informado. */
export function kgParaGramasPermitindoZero(texto: string): number | null {
  return converter(texto, PESO_EM_KG, 1000)
}

/** Preço digitado em R$ ("45,90" ou "45.90") para centavos. Devolve null se for inválido ou zero. */
export function reaisParaCentavos(texto: string): number | null {
  return apenasPositivo(converter(texto, PRECO_EM_REAIS, 100))
}

/** Preço para preencher um campo de edição ("45,90"): sem "R$" nem milhar, que reaisParaCentavos recusa. */
export function centavosParaTextoReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

/** Peso para preencher um campo de edição ("5,5"): sem "kg" nem milhar, que kgParaGramas recusa. */
export function gramasParaTextoKg(gramas: number): string {
  return String(gramas / 1000).replace('.', ',')
}

export function formatarKg(gramas: number): string {
  const kg = (gramas / 1000).toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  return `${kg} kg`
}

export function formatarReais(centavos: number): string {
  const reais = (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `R$ ${reais}`
}
