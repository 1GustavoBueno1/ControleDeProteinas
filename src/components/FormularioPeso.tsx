import { useId, useState, type FormEvent } from 'react'
import type { ValidacaoPeso } from '../domain/movimento'

interface Props {
  rotulo: string
  valorInicial?: string
  validar: (pesoDigitado: string) => ValidacaoPeso
  rotuloSalvar: string
  aoSalvar: (gramas: number) => Promise<void>
  aoCancelar: () => void
}

/** Um campo de peso em kg com Salvar e Cancelar: usado para retorno e para correção de saída. */
export function FormularioPeso({
  rotulo,
  valorInicial = '',
  validar,
  rotuloSalvar,
  aoSalvar,
  aoCancelar,
}: Props) {
  const id = useId()
  const [peso, setPeso] = useState(valorInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validar(peso)
    if (!validacao.ok) {
      setErro(validacao.erro)
      return
    }

    setErro(null)
    setSalvando(true)
    try {
      await aoSalvar(validacao.gramas)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.')
      setSalvando(false)
    }
    // No sucesso quem chamou fecha este formulário.
  }

  return (
    <form className="formulario" onSubmit={aoEnviar} noValidate>
      <div className="campo">
        <label htmlFor={`${id}-peso`}>{rotulo}</label>
        <input
          id={`${id}-peso`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          placeholder="0,000"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
        />
        {erro && (
          <p id={`${id}-erro`} role="alert" className="campo-erro">
            {erro}
          </p>
        )}
      </div>
      <div className="acoes">
        <button type="submit" className="botao botao-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : rotuloSalvar}
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
