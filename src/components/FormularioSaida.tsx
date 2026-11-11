import { useId, useState, type FormEvent } from 'react'
import { validarSaida } from '../domain/movimento'
import type { Proteina } from '../types/proteina'
import { formatarReais } from '../utils/unidades'

interface Props {
  // Só as proteínas ativas que ainda não foram lançadas no dia.
  proteinas: Proteina[]
  aoLancar: (proteina: Proteina, saidaGramas: number) => Promise<void>
}

export function FormularioSaida({ proteinas, aoLancar }: Props) {
  const id = useId()
  const [proteinaId, setProteinaId] = useState('')
  const [peso, setPeso] = useState('')
  const [erros, setErros] = useState<{ proteina?: string; peso?: string }>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Depois de lançada, a proteína sai da lista; `undefined` aqui volta o campo para "Selecione".
  const proteina = proteinas.find((p) => p.id === proteinaId)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setFalha(null)

    const validacao = validarSaida(peso)
    if (!proteina || !validacao.ok) {
      setErros({
        proteina: proteina ? undefined : 'Selecione a proteína.',
        peso: validacao.ok ? undefined : validacao.erro,
      })
      return
    }

    setErros({})
    setSalvando(true)
    try {
      await aoLancar(proteina, validacao.gramas)
      setProteinaId('')
      setPeso('')
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não foi possível lançar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={aoEnviar} noValidate>
      <div className="campo">
        <label htmlFor={`${id}-proteina`}>Proteína</label>
        <select
          id={`${id}-proteina`}
          value={proteina ? proteina.id : ''}
          onChange={(e) => setProteinaId(e.target.value)}
          aria-invalid={erros.proteina ? true : undefined}
          aria-describedby={erros.proteina ? `${id}-proteina-erro` : undefined}
        >
          <option value="">Selecione</option>
          {proteinas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} ({formatarReais(p.precoPorKgCentavos)}/kg)
            </option>
          ))}
        </select>
        {erros.proteina && (
          <p id={`${id}-proteina-erro`} className="campo-erro">
            {erros.proteina}
          </p>
        )}
      </div>

      <div className="campo">
        <label htmlFor={`${id}-peso`}>Saída (kg)</label>
        <input
          id={`${id}-peso`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="5,5"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          aria-invalid={erros.peso ? true : undefined}
          aria-describedby={erros.peso ? `${id}-peso-erro` : undefined}
        />
        {erros.peso && (
          <p id={`${id}-peso-erro`} className="campo-erro">
            {erros.peso}
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
          {salvando ? 'Lançando...' : 'Lançar saída'}
        </button>
      </div>
    </form>
  )
}
