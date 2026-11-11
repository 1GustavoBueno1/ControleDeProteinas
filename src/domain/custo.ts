export function calcularConsumoGramas(saidaGramas: number, retornoGramas: number): number {
  return saidaGramas - retornoGramas
}

// Gramas x centavos/kg é uma conta só de inteiros; o único arredondamento do item é o desta divisão.
export function calcularCustoCentavos(consumoGramas: number, precoPorKgCentavos: number): number {
  return Math.round((consumoGramas * precoPorKgCentavos) / 1000)
}
