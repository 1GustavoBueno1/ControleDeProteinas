import { useId } from 'react'
import { ehDataValida, formatarData, hojeEmSaoPaulo } from '../utils/data'

interface Props {
  data: string
  aoMudar: (data: string) => void
}

export function SeletorDeData({ data, aoMudar }: Props) {
  const id = useId()
  const hoje = hojeEmSaoPaulo()

  function aoEscolher(valor: string) {
    // O campo devolve "" quando é limpo; datas futuras não têm lançamento.
    if (ehDataValida(valor) && valor <= hoje) aoMudar(valor)
  }

  return (
    <div className="secao">
      <div className="campo">
        <label htmlFor={id}>Data</label>
        <input id={id} type="date" value={data} max={hoje} onChange={(e) => aoEscolher(e.target.value)} />
      </div>
      {data !== hoje && (
        <div className="aviso-atencao">
          <p>Você está em {formatarData(data)}, não em hoje.</p>
          <button type="button" className="botao botao-secundario" onClick={() => aoMudar(hoje)}>
            Voltar para hoje
          </button>
        </div>
      )}
    </div>
  )
}
