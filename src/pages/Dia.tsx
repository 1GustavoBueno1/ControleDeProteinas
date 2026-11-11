import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { FormularioPeso } from '../components/FormularioPeso'
import { FormularioSaida } from '../components/FormularioSaida'
import { SeletorDeData } from '../components/SeletorDeData'
import { calcularConsumoGramas } from '../domain/custo'
import {
  criarMovimento,
  podeCorrigirSaida,
  proteinasSemMovimento,
  validarRetorno,
  validarSaida,
} from '../domain/movimento'
import { movimentosPendentes } from '../domain/relatorio'
import {
  corrigirSaida,
  informarRetorno,
  lancarSaida,
  listarMovimentosDoDia,
} from '../services/movimentosService'
import { listarProteinasAtivas } from '../services/proteinasService'
import type { Movimento } from '../types/movimento'
import type { Proteina } from '../types/proteina'
import { formatarKg, formatarReais, gramasParaTextoKg } from '../utils/unidades'

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Não foi possível concluir. Tente de novo.'
}

interface ItemProps {
  movimento: Movimento
  podeEditar: boolean
  aoCorrigirSaida: (saidaGramas: number) => Promise<void>
  aoInformarRetorno: (retornoGramas: number) => Promise<void>
}

function ItemMovimento({ movimento, podeEditar, aoCorrigirSaida, aoInformarRetorno }: ItemProps) {
  const [modo, setModo] = useState<'ver' | 'retorno' | 'saida'>('ver')
  const { saidaGramas, retornoGramas } = movimento
  const pendente = retornoGramas === null

  async function salvarRetorno(gramas: number) {
    await aoInformarRetorno(gramas)
    setModo('ver')
  }

  async function salvarSaida(gramas: number) {
    await aoCorrigirSaida(gramas)
    setModo('ver')
  }

  return (
    <li>
      <div className="proteina-linha">
        <span className="proteina-nome">{movimento.nomeSnapshot}</span>
        <span className={pendente ? 'selo selo-pendente' : 'selo selo-ok'}>
          {pendente ? 'Sem retorno' : 'Retorno informado'}
        </span>
      </div>

      <dl className="pesos">
        <div>
          <dt>Saiu</dt>
          <dd>{formatarKg(saidaGramas)}</dd>
        </div>
        <div>
          <dt>Voltou</dt>
          <dd>{pendente ? '—' : formatarKg(retornoGramas)}</dd>
        </div>
        <div>
          <dt>Consumo</dt>
          <dd>{pendente ? '—' : formatarKg(calcularConsumoGramas(saidaGramas, retornoGramas))}</dd>
        </div>
      </dl>

      <p className="texto-suave texto-pequeno">
        Preço no lançamento: {formatarReais(movimento.precoPorKgCentavosSnapshot)}/kg
      </p>

      {podeEditar && modo === 'ver' && (
        <div className="acoes">
          <button
            type="button"
            className={pendente ? 'botao botao-primario' : 'botao botao-secundario'}
            onClick={() => setModo('retorno')}
          >
            {pendente ? 'Informar retorno' : 'Corrigir retorno'}
          </button>
          {podeCorrigirSaida(movimento) && (
            <button type="button" className="botao botao-secundario" onClick={() => setModo('saida')}>
              Corrigir saída
            </button>
          )}
        </div>
      )}

      {podeEditar && modo === 'retorno' && (
        <FormularioPeso
          rotulo="Retorno (kg). Se não voltou nada, digite 0"
          valorInicial={pendente ? '' : gramasParaTextoKg(retornoGramas)}
          validar={(texto) => validarRetorno(texto, saidaGramas)}
          rotuloSalvar="Salvar retorno"
          aoSalvar={salvarRetorno}
          aoCancelar={() => setModo('ver')}
        />
      )}

      {podeEditar && modo === 'saida' && (
        <FormularioPeso
          rotulo="Saída correta (kg)"
          valorInicial={gramasParaTextoKg(saidaGramas)}
          validar={validarSaida}
          rotuloSalvar="Salvar saída"
          aoSalvar={salvarSaida}
          aoCancelar={() => setModo('ver')}
        />
      )}
    </li>
  )
}

interface MovimentosProps {
  data: string
  podeEditar: boolean
  uid: string
}

// Montado com key={data}: ao trocar de dia, o estado recomeça do zero em vez de mostrar o dia anterior.
function MovimentosDoDia({ data, podeEditar, uid }: MovimentosProps) {
  // null = primeira carga ainda não terminou.
  const [movimentos, setMovimentos] = useState<Movimento[] | null>(null)
  const [proteinas, setProteinas] = useState<Proteina[]>([])
  const [falhaAoListar, setFalhaAoListar] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    // O catálogo só é necessário para quem lança saída.
    const catalogo = podeEditar ? listarProteinasAtivas() : Promise.resolve([])
    Promise.all([listarMovimentosDoDia(data), catalogo]).then(
      ([listaDeMovimentos, listaDeProteinas]) => {
        if (!ativo) return
        setMovimentos(listaDeMovimentos)
        setProteinas(listaDeProteinas)
      },
      (e: unknown) => {
        if (ativo) setFalhaAoListar(mensagemDe(e))
      },
    )
    return () => {
      ativo = false
    }
  }, [data, podeEditar])

  // Depois de cada escrita os movimentos são lidos de novo do Firestore.
  async function recarregar() {
    try {
      const [listaDeMovimentos, listaDeProteinas] = await Promise.all([
        listarMovimentosDoDia(data),
        podeEditar ? listarProteinasAtivas() : Promise.resolve([]),
      ])
      setMovimentos(listaDeMovimentos)
      setProteinas(listaDeProteinas)
      setFalhaAoListar(null)
    } catch (e) {
      setFalhaAoListar(mensagemDe(e))
    }
  }

  async function lancar(proteina: Proteina, saidaGramas: number) {
    await lancarSaida(data, criarMovimento(proteina, saidaGramas, uid))
    await recarregar()
  }

  async function salvarSaida(proteinaId: string, saidaGramas: number) {
    await corrigirSaida(data, proteinaId, saidaGramas)
    await recarregar()
  }

  async function salvarRetorno(proteinaId: string, retornoGramas: number) {
    await informarRetorno(data, proteinaId, retornoGramas)
    await recarregar()
  }

  if (falhaAoListar && movimentos === null) {
    return (
      <div role="alert" className="aviso-erro">
        <p>Não foi possível carregar o dia. {falhaAoListar}</p>
        <button type="button" className="botao botao-secundario" onClick={() => void recarregar()}>
          Tentar de novo
        </button>
      </div>
    )
  }

  if (movimentos === null) return <p className="texto-suave">Carregando o dia...</p>

  const disponiveis = proteinasSemMovimento(proteinas, movimentos)
  const semRetorno = movimentosPendentes(movimentos).length

  return (
    <>
      {podeEditar && (
        <section className="cartao" aria-labelledby="titulo-saida">
          <h2 id="titulo-saida">Lançar saída</h2>
          {proteinas.length === 0 && (
            <p className="texto-suave">Nenhuma proteína ativa. Cadastre na tela Proteínas antes de lançar.</p>
          )}
          {proteinas.length > 0 && disponiveis.length === 0 && (
            <p className="texto-suave">Todas as proteínas ativas já foram lançadas neste dia.</p>
          )}
          {disponiveis.length > 0 && <FormularioSaida proteinas={disponiveis} aoLancar={lancar} />}
        </section>
      )}

      <section className="secao" aria-labelledby="titulo-movimentos">
        <h2 id="titulo-movimentos">
          Movimentos ({movimentos.length}){semRetorno > 0 ? `, ${semRetorno} sem retorno` : ''}
        </h2>

        {falhaAoListar && (
          <div role="alert" className="aviso-erro">
            <p>Não foi possível atualizar a lista. {falhaAoListar}</p>
            <button type="button" className="botao botao-secundario" onClick={() => void recarregar()}>
              Tentar de novo
            </button>
          </div>
        )}

        {movimentos.length === 0 && (
          <p className="texto-suave">
            {podeEditar
              ? 'Nada lançado neste dia. Lance a primeira saída no formulário acima.'
              : 'Nada lançado neste dia.'}
          </p>
        )}

        {movimentos.length > 0 && (
          <ul className="lista">
            {movimentos.map((movimento) => (
              <ItemMovimento
                key={movimento.proteinaId}
                movimento={movimento}
                podeEditar={podeEditar}
                aoCorrigirSaida={(gramas) => salvarSaida(movimento.proteinaId, gramas)}
                aoInformarRetorno={(gramas) => salvarRetorno(movimento.proteinaId, gramas)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

interface Props {
  data: string
  aoMudarData: (data: string) => void
}

export default function Dia({ data, aoMudarData }: Props) {
  const { estado } = useAuth()

  if (estado.status !== 'logado') return null
  const podeEditar = estado.usuario.role === 'churras'

  return (
    <main className="pagina">
      <div className="titulo-pagina">
        <h1>Lançamentos do dia</h1>
        <span className="tracos" aria-hidden="true" />
        <p className="texto-suave">
          {podeEditar
            ? 'Lance a saída de cada carne e, quando ela voltar ao estoque, informe o retorno.'
            : 'Saída e retorno de cada carne no dia. Seu perfil apenas visualiza.'}
        </p>
      </div>

      <SeletorDeData data={data} aoMudar={aoMudarData} />

      <MovimentosDoDia key={data} data={data} podeEditar={podeEditar} uid={estado.usuario.uid} />
    </main>
  )
}
