export type Tela = 'dia' | 'relatorio' | 'proteinas'

const TELAS: { tela: Tela; rotulo: string }[] = [
  { tela: 'dia', rotulo: 'Dia' },
  { tela: 'relatorio', rotulo: 'Relatório' },
  { tela: 'proteinas', rotulo: 'Proteínas' },
]

interface Props {
  telaAtual: Tela
  aoMudar: (tela: Tela) => void
}

export function Navegacao({ telaAtual, aoMudar }: Props) {
  return (
    <nav className="navegacao" aria-label="Telas">
      <div className="navegacao-conteudo">
        {TELAS.map(({ tela, rotulo }) => (
          <button
            key={tela}
            type="button"
            className="aba"
            aria-current={tela === telaAtual ? 'page' : undefined}
            onClick={() => aoMudar(tela)}
          >
            {rotulo}
          </button>
        ))}
      </div>
    </nav>
  )
}
