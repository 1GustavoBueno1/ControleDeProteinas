import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { SeletorDeData } from '../components/SeletorDeData'
import { movimentosPendentes, podeGerarRelatorio } from '../domain/relatorio'
import { listarMovimentosDoDia } from '../services/movimentosService'
import { gerarRelatorioDoDia } from '../services/relatorioService'
import type { Movimento } from '../types/movimento'
import type { RelatorioDiario } from '../types/relatorio'
import { formatarData } from '../utils/data'
import { formatarKg, formatarReais } from '../utils/unidades'

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Não foi possível concluir. Tente de novo.'
}

function RelatorioGerado({ relatorio }: { relatorio: RelatorioDiario }) {
  const secao = useRef<HTMLElement>(null)

  // No celular o relatório nasce abaixo da dobra; rola até ele a cada geração.
  useEffect(() => {
    secao.current?.scrollIntoView({ block: 'start' })
  }, [relatorio])

  return (
    <section ref={secao} className="secao relatorio-gerado" aria-labelledby="titulo-relatorio">
      <h2 id="titulo-relatorio">Relatório de {formatarData(relatorio.data)}</h2>

      <div className="total-dia">
        <span className="total-rotulo">Custo total do dia</span>
        <span className="total-valor">{formatarReais(relatorio.custoTotalCentavos)}</span>
      </div>

      <ul className="lista">
        {relatorio.itens.map((item) => (
          <li key={item.proteinaId}>
            <div className="proteina-linha">
              <span className="proteina-nome">{item.nome}</span>
              <span className="preco">
                <span className="preco-rotulo">Custo</span>
                {formatarReais(item.custoCentavos)}
              </span>
            </div>
            <dl className="pesos">
              <div>
                <dt>Saiu</dt>
                <dd>{formatarKg(item.saidaGramas)}</dd>
              </div>
              <div>
                <dt>Voltou</dt>
                <dd>{formatarKg(item.retornoGramas)}</dd>
              </div>
              <div>
                <dt>Consumo</dt>
                <dd>{formatarKg(item.consumoGramas)}</dd>
              </div>
            </dl>
            <p className="texto-suave texto-pequeno">
              Preço por kg: {formatarReais(item.precoPorKgCentavos)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface DoDiaProps {
  data: string
  podeEditar: boolean
}

// Montado com key={data}: ao trocar de dia, situação e relatório recomeçam do zero.
function RelatorioDoDia({ data, podeEditar }: DoDiaProps) {
  // null = primeira carga ainda não terminou.
  const [movimentos, setMovimentos] = useState<Movimento[] | null>(null)
  const [relatorio, setRelatorio] = useState<RelatorioDiario | null>(null)
  const [falha, setFalha] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let ativo = true
    listarMovimentosDoDia(data).then(
      (lista) => {
        if (ativo) setMovimentos(lista)
      },
      (e: unknown) => {
        if (ativo) setFalha(mensagemDe(e))
      },
    )
    return () => {
      ativo = false
    }
  }, [data])

  async function atualizar() {
    setFalha(null)
    setOcupado(true)
    try {
      setMovimentos(await listarMovimentosDoDia(data))
      // A situação pode ter mudado; um relatório já gerado deixaria de valer.
      setRelatorio(null)
    } catch (e) {
      setFalha(mensagemDe(e))
    } finally {
      setOcupado(false)
    }
  }

  async function gerar() {
    setFalha(null)
    setOcupado(true)
    try {
      setRelatorio(await gerarRelatorioDoDia(data))
    } catch (e) {
      setRelatorio(null)
      setFalha(mensagemDe(e))
      // Se a geração foi recusada, a situação mostrada estava velha: lê de novo para mostrar as pendências.
      await listarMovimentosDoDia(data).then(setMovimentos, () => undefined)
    } finally {
      setOcupado(false)
    }
  }

  if (movimentos === null) {
    if (!falha) return <p className="texto-suave">Carregando o dia...</p>
    return (
      <div role="alert" className="aviso-erro">
        <p>Não foi possível carregar o dia. {falha}</p>
        <button type="button" className="botao botao-secundario" onClick={() => void atualizar()}>
          Tentar de novo
        </button>
      </div>
    )
  }

  const pendentes = movimentosPendentes(movimentos)
  const liberado = podeGerarRelatorio(movimentos)

  return (
    <>
      <section className="secao" aria-labelledby="titulo-situacao">
        <h2 id="titulo-situacao">Situação do dia</h2>

        {movimentos.length === 0 && (
          <p className="texto-suave">
            Nada lançado neste dia. O relatório precisa de pelo menos um lançamento.
          </p>
        )}

        {pendentes.length > 0 && (
          <div className="aviso-atencao">
            <p>
              {pendentes.length === 1
                ? 'Falta informar o retorno de 1 proteína para liberar o relatório:'
                : `Falta informar o retorno de ${pendentes.length} proteínas para liberar o relatório:`}
            </p>
            <ul className="pendencias">
              {pendentes.map((movimento) => (
                <li key={movimento.proteinaId}>
                  {movimento.nomeSnapshot} (saiu {formatarKg(movimento.saidaGramas)})
                </li>
              ))}
            </ul>
            {podeEditar && <p className="texto-suave">Informe os retornos na aba Dia.</p>}
          </div>
        )}

        {liberado && (
          <p className="situacao-ok">
            {movimentos.length === 1
              ? 'O lançamento do dia tem retorno informado.'
              : `Os ${movimentos.length} lançamentos do dia têm retorno informado.`}
          </p>
        )}

        {falha && (
          <p role="alert" className="aviso-erro">
            {falha}
          </p>
        )}

        <div className="acoes">
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => void gerar()}
            disabled={!liberado || ocupado}
          >
            Gerar relatório diário
          </button>
          <button
            type="button"
            className="botao botao-secundario"
            onClick={() => void atualizar()}
            disabled={ocupado}
          >
            Atualizar situação
          </button>
        </div>
      </section>

      {relatorio && <RelatorioGerado relatorio={relatorio} />}
    </>
  )
}

interface Props {
  data: string
  aoMudarData: (data: string) => void
}

export default function Relatorio({ data, aoMudarData }: Props) {
  const { estado } = useAuth()
  const podeEditar = estado.status === 'logado' && estado.usuario.role === 'churras'

  return (
    <main className="pagina">
      <div className="titulo-pagina">
        <h1>Relatório diário</h1>
        <span className="tracos" aria-hidden="true" />
        <p className="texto-suave">
          Quanto saiu, quanto voltou e o custo de cada carne no dia. Só é liberado quando todos os retornos
          foram informados.
        </p>
      </div>

      <SeletorDeData data={data} aoMudar={aoMudarData} />

      <RelatorioDoDia key={data} data={data} podeEditar={podeEditar} />
    </main>
  )
}
