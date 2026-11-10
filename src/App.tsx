import { RequireRole } from './auth/RequireRole'
import { useAuth } from './auth/useAuth'
import Login from './pages/Login'

export default function App() {
  const { estado, sair } = useAuth()

  if (estado.status === 'carregando') return <p>Carregando...</p>
  if (estado.status === 'deslogado') return <Login />

  if (estado.status === 'semAcesso') {
    return (
      <main>
        <h1>Sem acesso</h1>
        <p>
          {estado.email}: {estado.motivo}
        </p>
        <button onClick={sair}>Sair</button>
      </main>
    )
  }

  // Placeholder da Etapa 1: as telas reais entram a partir da Etapa 3.
  return (
    <main>
      <h1>Controle de Proteínas</h1>
      <p>
        Logado como {estado.usuario.email} (role: {estado.usuario.role})
      </p>
      <RequireRole roles={['churras']} fallback={<p>Seu perfil apenas visualiza.</p>}>
        <p>Seu perfil pode cadastrar proteínas e lançar movimentos.</p>
      </RequireRole>
      <button onClick={sair}>Sair</button>
    </main>
  )
}
