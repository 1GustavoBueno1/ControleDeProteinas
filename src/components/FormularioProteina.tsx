import { useId, useState, type FormEvent } from 'react'
import { validarProteina, type DadosProteina } from '../domain/proteina'

interface Props {
  nomeInicial?: string
  precoInicial?: string
  // Nomes das outras proteínas ativas, para não cadastrar a mesma duas vezes.
  nomesEmUso: string[]
  rotuloSalvar: string
  aoSalvar: (dados: DadosProteina) => Promise<void>
  aoCancelar?: () => void
}

export function FormularioProteina({
  nomeInicial = '',
  precoInicial = '',
  nomesEmUso,
  rotuloSalvar,
  aoSalvar,
  aoCancelar,
}: Props) {
  const id = useId()
  const [nome, setNome] = useState(nomeInicial)
  const [preco, setPreco] = useState(precoInicial)
  const [erros, setErros] = useState<{ nome?: string; preco?: string }>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setFalha(null)

    const validacao = validarProteina(nome, preco, nomesEmUso)
    if (!validacao.ok) {
      setErros(validacao.erros)
      return
    }

    setErros({})
    setSalvando(true)
    try {
      await aoSalvar(validacao.dados)
      setNome(nomeInicial)
      setPreco(precoInicial)
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={aoEnviar} noValidate>
      <div className="campo">
        <label htmlFor={`${id}-nome`}>Nome</label>
        <input
          id={`${id}-nome`}
          type="text"
          autoComplete="off"
          placeholder="Picanha"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-invalid={erros.nome ? true : undefined}
          aria-describedby={erros.nome ? `${id}-nome-erro` : undefined}
        />
        {erros.nome && (
          <p id={`${id}-nome-erro`} className="campo-erro">
            {erros.nome}
          </p>
        )}
      </div>

      <div className="campo">
        <label htmlFor={`${id}-preco`}>Preço por kg (R$)</label>
        <input
          id={`${id}-preco`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="45,90"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          aria-invalid={erros.preco ? true : undefined}
          aria-describedby={erros.preco ? `${id}-preco-erro` : undefined}
        />
        {erros.preco && (
          <p id={`${id}-preco-erro`} className="campo-erro">
            {erros.preco}
          </p>
        )}
      </div>

      {falha && (
        <p role="alert" className="aviso-erro">
          {falha}
        </p>
      )}

      <div className="acoes">
        <button type="submit" className="botao botao-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : rotuloSalvar}
        </button>
        {aoCancelar && (
          <button type="button" className="botao botao-secundario" onClick={aoCancelar} disabled={salvando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
