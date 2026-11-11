import { reaisParaCentavos } from '../utils/unidades'

export interface DadosProteina {
  nome: string
  precoPorKgCentavos: number
}

export type ValidacaoProteina =
  | { ok: true; dados: DadosProteina }
  | { ok: false; erros: { nome?: string; preco?: string } }

function mesmoNome(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
}

function erroDoNome(nome: string, nomesEmUso: string[]): string | undefined {
  if (nome === '') return 'Informe o nome da proteína.'
  if (nomesEmUso.some((emUso) => mesmoNome(emUso, nome))) {
    return 'Já existe uma proteína ativa com esse nome.'
  }
  return undefined
}

/** Valida o que foi digitado no formulário. `nomesEmUso` são as outras proteínas ativas. */
export function validarProteina(
  nomeDigitado: string,
  precoDigitado: string,
  nomesEmUso: string[],
): ValidacaoProteina {
  const nome = nomeDigitado.trim()
  const precoPorKgCentavos = reaisParaCentavos(precoDigitado)

  const erros: { nome?: string; preco?: string } = {}
  const erroNome = erroDoNome(nome, nomesEmUso)
  if (erroNome) erros.nome = erroNome
  if (precoPorKgCentavos === null) erros.preco = 'Informe o preço por kg em reais, por exemplo 45,90.'

  if (erroNome || precoPorKgCentavos === null) return { ok: false, erros }
  return { ok: true, dados: { nome, precoPorKgCentavos } }
}
