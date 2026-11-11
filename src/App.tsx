import { useState } from 'react'
import { useAuth } from './auth/useAuth'
import { Cabecalho } from './components/Cabecalho'
import { Navegacao, type Tela } from './components/Navegacao'
import Dia from './pages/Dia'
import Login from './pages/Login'
import Proteinas from './pages/Proteinas'
import Relatorio from './pages/Relatorio'
import { hojeEmSaoPaulo } from './utils/data'

export default function App() {
  const { estado, sair } = useAuth()
  const [tela, setTela] = useState<Tela>('dia')
  // A data fica aqui para Dia e Relatório mostrarem sempre o mesmo dia ao trocar de aba.
  const [data, setData] = useState(() => hojeEmSaoPaulo())

  if (estado.status === 'carregando') {
    return (
      <main className="tela-central">
        <p className="texto-suave">Carregando...</p>
      </main>
    )
  }

  if (estado.status === 'deslogado') return <Login />

  if (estado.status === 'semAcesso') {
    return (
      <main className="tela-central">
        <div className="login">
          <div className="titulo-pagina">
            <h1>Sem acesso</h1>
            <span className="tracos" aria-hidden="true" />
          </div>
          <p>
            {estado.email}: {estado.motivo}
          </p>
          <button type="button" className="botao botao-secundario" onClick={() => void sair()}>
            Sair
          </button>
        </div>
      </main>
    )
  }

  return (
    <>
      <Cabecalho usuario={estado.usuario} aoSair={sair} />
      <Navegacao telaAtual={tela} aoMudar={setTela} />
      {tela === 'dia' && <Dia data={data} aoMudarData={setData} />}
      {tela === 'relatorio' && <Relatorio data={data} aoMudarData={setData} />}
      {tela === 'proteinas' && <Proteinas />}
    </>
  )
}
