import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { FormularioProteina } from '../components/FormularioProteina'
import type { DadosProteina } from '../domain/proteina'
import {
  criarProteina,
  desativarProteina,
  editarProteina,
  listarProteinasAtivas,
} from '../services/proteinasService'
import type { Proteina } from '../types/proteina'
import { centavosParaTextoReais, formatarReais } from '../utils/unidades'

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Não foi possível concluir. Tente de novo.'
}

interface ItemProps {
  proteina: Proteina
  podeEditar: boolean
  nomesEmUso: string[]
  aoEditar: (dados: DadosProteina) => Promise<void>
  aoDesativar: () => Promise<void>
}

function ItemProteina({ proteina, podeEditar, nomesEmUso, aoEditar, aoDesativar }: ItemProps) {
  const [modo, setModo] = useState<'ver' | 'editar' | 'desativar'>('ver')
  const [desativando, setDesativando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  async function salvarEdicao(dados: DadosProteina) {
    await aoEditar(dados)
    setModo('ver')
  }

  async function confirmarDesativacao() {
    setFalha(null)
    setDesativando(true)
    try {
      await aoDesativar()
    } catch (e) {
      setFalha(mensagemDe(e))
      setDesativando(false)
    }
    // No sucesso a proteína sai da lista e este item desmonta.
  }

  if (modo === 'editar') {
    return (
      <li>
        <FormularioProteina
          nomeInicial={proteina.nome}
          precoInicial={centavosParaTextoReais(proteina.precoPorKgCentavos)}
          nomesEmUso={nomesEmUso}
          rotuloSalvar="Salvar alterações"
          aoSalvar={salvarEdicao}
          aoCancelar={() => setModo('ver')}
        />
        <p className="texto-suave">
          O preço novo vale para os próximos lançamentos. Dias já lançados mantêm o preço antigo.
        </p>
      </li>
    )
  }

  return (
    <li>
      <div className="proteina-linha">
        <span className="proteina-nome">{proteina.nome}</span>
        <span className="preco">
          {formatarReais(proteina.precoPorKgCentavos)}
          <span className="preco-unidade">/kg</span>
        </span>
      </div>

      {podeEditar && modo === 'ver' && (
        <div className="acoes">
          <button type="button" className="botao botao-secundario" onClick={() => setModo('editar')}>
            Editar
          </button>
          <button type="button" className="botao botao-secundario" onClick={() => setModo('desativar')}>
            Desativar
          </button>
        </div>
      )}

      {podeEditar && modo === 'desativar' && (
        <>
          <p>
            Desativar {proteina.nome}? Ela sai desta lista e não poderá mais ser lançada. Os dias já lançados
            não mudam.
          </p>
          {falha && (
            <p role="alert" className="aviso-erro">
              {falha}
            </p>
          )}
          <div className="acoes">
            <button
              type="button"
              className="botao botao-perigo"
              onClick={() => void confirmarDesativacao()}
              disabled={desativando}
            >
              {desativando ? 'Desativando...' : 'Desativar'}
            </button>
            <button
              type="button"
              className="botao botao-secundario"
              onClick={() => setModo('ver')}
              disabled={desativando}
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </li>
  )
}

export default function Proteinas() {
  const { estado } = useAuth()
  const podeEditar = estado.status === 'logado' && estado.usuario.role === 'churras'

  // null = primeira carga ainda não terminou.
  const [proteinas, setProteinas] = useState<Proteina[] | null>(null)
  const [falhaAoListar, setFalhaAoListar] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    listarProteinasAtivas().then(
      (lista) => {
        if (ativo) setProteinas(lista)
      },
      (e: unknown) => {
        if (ativo) setFalhaAoListar(mensagemDe(e))
      },
    )
    return () => {
      ativo = false
    }
  }, [])

  // Depois de cada escrita a lista é lida de novo do Firestore, em vez de ser remendada na memória.
  async function recarregar() {
    try {
      setProteinas(await listarProteinasAtivas())
      setFalhaAoListar(null)
    } catch (e) {
      setFalhaAoListar(mensagemDe(e))
    }
  }

  async function criar(dados: DadosProteina) {
    await criarProteina(dados)
    await recarregar()
  }

  async function editar(id: string, dados: DadosProteina) {
    await editarProteina(id, dados)
    await recarregar()
  }

  async function desativar(id: string) {
    await desativarProteina(id)
    await recarregar()
  }

  const nomes = (proteinas ?? []).map((p) => p.nome)

  return (
    <main className="pagina">
      <div className="titulo-pagina">
        <h1>Proteínas</h1>
        <span className="tracos" aria-hidden="true" />
        <p className="texto-suave">
          {podeEditar
            ? 'Cadastre cada carne uma vez, com o preço por kg. Depois é só selecionar no lançamento do dia.'
            : 'Carnes cadastradas e o preço por kg de cada uma. Seu perfil apenas visualiza.'}
        </p>
      </div>

      {podeEditar && (
        <section className="cartao" aria-labelledby="titulo-nova">
          <h2 id="titulo-nova">Nova proteína</h2>
          <FormularioProteina nomesEmUso={nomes} rotuloSalvar="Cadastrar proteína" aoSalvar={criar} />
        </section>
      )}

      <section className="secao" aria-labelledby="titulo-ativas">
        <h2 id="titulo-ativas">Ativas{proteinas ? ` (${proteinas.length})` : ''}</h2>

        {falhaAoListar && (
          <div role="alert" className="aviso-erro">
            <p>Não foi possível carregar as proteínas. {falhaAoListar}</p>
            <button type="button" className="botao botao-secundario" onClick={() => void recarregar()}>
              Tentar de novo
            </button>
          </div>
        )}

        {proteinas === null && !falhaAoListar && <p className="texto-suave">Carregando proteínas...</p>}

        {proteinas?.length === 0 && (
          <p className="texto-suave">
            {podeEditar
              ? 'Nenhuma proteína ativa. Cadastre a primeira no formulário acima.'
              : 'Nenhuma proteína ativa no momento.'}
          </p>
        )}

        {proteinas && proteinas.length > 0 && (
          <ul className="lista">
            {proteinas.map((proteina) => (
              <ItemProteina
                key={proteina.id}
                proteina={proteina}
                podeEditar={podeEditar}
                nomesEmUso={nomes.filter((nome) => nome !== proteina.nome)}
                aoEditar={(dados) => editar(proteina.id, dados)}
                aoDesativar={() => desativar(proteina.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
