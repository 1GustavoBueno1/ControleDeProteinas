import { useAuth } from './auth/useAuth'
import { Cabecalho } from './components/Cabecalho'
import Login from './pages/Login'
import Proteinas from './pages/Proteinas'

export default function App() {
  const { estado, sair } = useAuth()

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
      <Proteinas />
    </>
  )
}
