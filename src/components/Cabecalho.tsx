import folha from '../assets/folha-dudu.jpg'
import type { Usuario } from '../types/usuario'

interface Props {
  usuario: Usuario
  aoSair: () => Promise<void>
}

export function Cabecalho({ usuario, aoSair }: Props) {
  const perfil = usuario.role === 'adm' ? 'adm, só visualiza' : 'churras'

  return (
    <header className="cabecalho">
      <div className="cabecalho-conteudo">
        <img className="cabecalho-folha" src={folha} alt="Dudu Bebidas" width={208} height={156} />
        <div className="cabecalho-texto">
          <p className="cabecalho-nome">Controle de Proteínas</p>
          <p className="cabecalho-usuario">
            {usuario.email} · {perfil}
          </p>
        </div>
        <button type="button" className="botao botao-secundario" onClick={() => void aoSair()}>
          Sair
        </button>
      </div>
    </header>
  )
}
