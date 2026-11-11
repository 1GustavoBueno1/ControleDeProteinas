import { useState, type FormEvent } from 'react'
import logo from '../assets/logo-dudu.jpg'
import { useAuth } from '../auth/useAuth'

export default function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrar(email.trim(), senha)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar. Tente de novo.')
      setEnviando(false)
    }
    // No sucesso não há nada a fazer: o AuthProvider troca de tela e este componente desmonta.
  }

  return (
    <main className="tela-central">
      <div className="login">
        <div className="login-marca">
          <img className="login-logo" src={logo} alt="Dudu Bebidas" width={328} height={316} />
          <h1>Controle de Proteínas</h1>
        </div>

        <form className="formulario" onSubmit={aoEnviar}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          {erro && (
            <p role="alert" className="aviso-erro">
              {erro}
            </p>
          )}
          <button type="submit" className="botao botao-primario botao-largo" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
