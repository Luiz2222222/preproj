import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  BarChart3,
  CheckCircle,
  XCircle,
  BookOpen,
  ArrowRight,
  Briefcase
} from 'lucide-react'
import { useAutenticacao } from '../../autenticacao'
import { useToast } from '../../contextos/ToastProvider'
import { useSolicitacoesPendentesCoordenador, useTCCsCoordenador, useCalendarioSemestre } from '../../hooks'
import { EtapaTCC } from '../../types'
import { formatarDataCurta, formatarIntervalo } from '../../utils/datas'
import { PainelDatasImportantes } from '../../componentes'

export function DashboardCoordenador() {
  const { usuario } = useAutenticacao()
  const { erro: mostrarErro } = useToast()
  const { solicitacoes, carregando, erro } = useSolicitacoesPendentesCoordenador()
  const { tccs, erro: erroTCCs } = useTCCsCoordenador()
  const { calendario } = useCalendarioSemestre()
  const navigate = useNavigate()

  // Mostrar erros via toast
  useEffect(() => {
    if (erro) {
      mostrarErro(`Erro ao carregar solicitações: ${erro}`)
    }
    if (erroTCCs) {
      mostrarErro(`Erro ao carregar TCCs: ${erroTCCs}`)
    }
  }, [erro, erroTCCs, mostrarErro])

  // Handler para navegar para página de solicitações
  const handleVerDetalhes = (solicitacaoId: number) => {
    navigate('/solicitacoes', { state: { solicitacaoId } })
  }

  // Handler para navegar para página de detalhe do TCC
  const handleFormarBanca = (tccId: number) => {
    navigate(`/tccs/${tccId}`)
  }

  // Estado do tooltip customizado
  const [tooltip, setTooltip] = useState<{ texto: string; x: number; y: number; visivel: boolean }>({
    texto: '',
    x: 0,
    y: 0,
    visivel: false
  })

  // Funções para controlar o tooltip
  const mostrarTooltip = (evento: React.MouseEvent<HTMLDivElement>, texto: string) => {
    const { clientX, clientY } = evento
    setTooltip({ texto, x: clientX, y: clientY, visivel: true })
  }

  const esconderTooltip = () => {
    setTooltip(prev => ({ ...prev, visivel: false }))
  }

  // Cálculo de estatísticas baseado em TCCs reais
  const estatisticas = useMemo(() => {
    const total = tccs.length

    const emAndamento = tccs.filter(
      (tcc) =>
        tcc.etapa_atual !== EtapaTCC.CONCLUIDO &&
        tcc.etapa_atual !== EtapaTCC.DESCONTINUADO &&
        tcc.etapa_atual !== EtapaTCC.REPROVADO_FASE_1 &&
        tcc.etapa_atual !== EtapaTCC.REPROVADO_FASE_2
    ).length

    const aprovados = tccs.filter((tcc) => tcc.etapa_atual === EtapaTCC.CONCLUIDO).length

    const reprovados = tccs.filter(
      (tcc) =>
        tcc.etapa_atual === EtapaTCC.DESCONTINUADO ||
        tcc.etapa_atual === EtapaTCC.REPROVADO_FASE_1 ||
        tcc.etapa_atual === EtapaTCC.REPROVADO_FASE_2
    ).length

    return {
      total,
      emAndamento,
      aprovados,
      reprovados,
      percentualEmAndamento: total > 0 ? ((emAndamento / total) * 100).toFixed(1) : '0.0',
      percentualAprovados: total > 0 ? ((aprovados / total) * 100).toFixed(1) : '0.0',
      percentualReprovados: total > 0 ? ((reprovados / total) * 100).toFixed(1) : '0.0',
    }
  }, [tccs])

  // Cálculo de etapas para o gráfico
  const etapas = useMemo(() => {
    const total = tccs.length

    // Definições de grupos de etapas
    const definicoes = [
      {
        nome: 'Inicial',
        etapas: [EtapaTCC.INICIALIZACAO] as EtapaTCC[],
        cor: 'blue',
      },
      {
        nome: 'Desenvolvimento',
        etapas: [EtapaTCC.DESENVOLVIMENTO] as EtapaTCC[],
        cor: 'yellow',
      },
      {
        nome: 'Fase I',
        etapas: [EtapaTCC.FORMACAO_BANCA_FASE_1, EtapaTCC.AVALIACAO_FASE_1, EtapaTCC.VALIDACAO_FASE_1] as EtapaTCC[],
        cor: 'purple',
      },
      {
        nome: 'Fase II',
        etapas: [EtapaTCC.AGENDAMENTO_APRESENTACAO, EtapaTCC.APRESENTACAO_FASE_2] as EtapaTCC[],
        cor: 'orange',
      },
      {
        nome: 'Finalização',
        etapas: [EtapaTCC.ANALISE_FINAL_COORDENADOR, EtapaTCC.AGUARDANDO_AJUSTES_FINAIS] as EtapaTCC[],
        cor: 'green',
      },
    ]

    return definicoes.map((grupo) => {
      const tccsDoGrupo = tccs.filter((tcc) => grupo.etapas.includes(tcc.etapa_atual))
      const count = tccsDoGrupo.length
      const percentual = total > 0 ? (count / total) * 100 : 0
      const widthPercentual = total > 0 && count > 0 ? Math.max(percentual, 8) : percentual

      // Montar tooltip com lista de alunos
      const nomesAlunos = tccsDoGrupo.map((tcc) => tcc.aluno_dados.nome_completo)
      const tooltipHtml = count > 0 ? nomesAlunos.join('<br/>') : 'Nenhum aluno'

      return {
        ...grupo,
        count,
        percentual,
        widthPercentual,
        tooltipHtml,
      }
    })
  }, [tccs])

  // Cards de estatísticas com dados reais
  const statCards = useMemo(
    () => [
      {
        title: 'Total',
        value: estatisticas.total.toString(),
        change: 'TCCs cadastrados',
        icon: FileText,
        color: 'blue',
      },
      {
        title: 'Em andamento',
        value: estatisticas.emAndamento.toString(),
        change: `${estatisticas.percentualEmAndamento}% do total`,
        icon: Clock,
        color: 'yellow',
      },
      {
        title: 'Aprovados',
        value: estatisticas.aprovados.toString(),
        change: `${estatisticas.percentualAprovados}% do total`,
        icon: CheckCircle,
        color: 'green',
      },
      {
        title: 'Reprovados',
        value: estatisticas.reprovados.toString(),
        change: `${estatisticas.percentualReprovados}% do total`,
        icon: XCircle,
        color: 'red',
      },
    ],
    [estatisticas]
  )

  // TCCs que precisam de formação de banca
  const tccsPendentesBanca = useMemo(() => {
    return tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1)
  }, [tccs])

  // TCCs que precisam de análise das avaliações (Validação - Fase I)
  const tccsPendentesValidacao = useMemo(() => {
    return tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.VALIDACAO_FASE_1)
  }, [tccs])

  // TCCs que precisam de análise das avaliações (Fase II)
  const tccsPendentesValidacaoFase2 = useMemo(() => {
    return tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.ANALISE_FINAL_COORDENADOR)
  }, [tccs])

  // Consolidar todas as ações pendentes (solicitações + bancas pendentes + validações pendentes)
  const acoesPendentes = useMemo(() => {
    const acoes: Array<{
      id: string
      tipo: 'solicitacao' | 'banca' | 'validacao' | 'validacao_fase2'
      titulo: string
      aluno: string
      tccId?: number
      solicitacaoId?: number
    }> = []

    // Adicionar solicitações pendentes
    solicitacoes.forEach(solicitacao => {
      acoes.push({
        id: `sol-${solicitacao.id}`,
        tipo: 'solicitacao',
        titulo: 'Análise de documentos iniciais',
        aluno: solicitacao.aluno_nome,
        solicitacaoId: solicitacao.id
      })
    })

    // Adicionar TCCs que precisam de formação de banca
    tccsPendentesBanca.forEach(tcc => {
      acoes.push({
        id: `banca-${tcc.id}`,
        tipo: 'banca',
        titulo: 'Formação da banca - Fase I',
        aluno: tcc.aluno_dados.nome_completo,
        tccId: tcc.id
      })
    })

    // Adicionar TCCs que precisam de validação das avaliações - Fase I
    tccsPendentesValidacao.forEach(tcc => {
      acoes.push({
        id: `validacao-${tcc.id}`,
        tipo: 'validacao',
        titulo: 'Análise das avaliações - Fase I',
        aluno: tcc.aluno_dados.nome_completo,
        tccId: tcc.id
      })
    })

    // Adicionar TCCs que precisam de validação das avaliações - Fase II
    tccsPendentesValidacaoFase2.forEach(tcc => {
      acoes.push({
        id: `validacao-f2-${tcc.id}`,
        tipo: 'validacao_fase2',
        titulo: 'Análise das avaliações - Fase II',
        aluno: tcc.aluno_dados.nome_completo,
        tccId: tcc.id
      })
    })

    return acoes
  }, [solicitacoes, tccsPendentesBanca, tccsPendentesValidacao, tccsPendentesValidacaoFase2])

  // Datas importantes do calendário acadêmico
  const datasImportantes = useMemo(() => {
    return [
      {
        id: 1,
        titulo: 'Reunião com alunos',
        descricao: 'Orientações gerais sobre o TCC e Regulamento',
        data: formatarDataCurta(calendario?.reuniao_alunos),
        icone: Users,
        cor: 'blue',
        temDados: !!calendario?.reuniao_alunos
      },
      {
        id: 2,
        titulo: 'Envio de documentos',
        descricao: 'Prazo para envio do plano e termo',
        data: formatarDataCurta(calendario?.envio_documentos_fim),
        icone: FileText,
        cor: 'cyan',
        temDados: !!calendario?.envio_documentos_fim
      },
      {
        id: 3,
        titulo: 'Avaliação de continuidade',
        descricao: 'Prazo para orientador avaliar progresso',
        data: formatarDataCurta(calendario?.avaliacao_continuidade_fim),
        icone: Clock,
        cor: 'yellow',
        temDados: !!calendario?.avaliacao_continuidade_fim
      },
      {
        id: 4,
        titulo: 'Submissão de monografia + termo',
        descricao: 'Entrega da versão final + Termo',
        data: formatarDataCurta(calendario?.submissao_monografia_fim),
        icone: FileText,
        cor: 'orange',
        temDados: !!calendario?.submissao_monografia_fim
      },
      {
        id: 5,
        titulo: 'Preparação das bancas (Fase I)',
        descricao: 'Período de formação das bancas avaliadoras',
        data: formatarIntervalo(calendario?.preparacao_bancas_fase1_inicio, calendario?.preparacao_bancas_fase1_fim),
        icone: Briefcase,
        cor: 'violet',
        temDados: !!(calendario?.preparacao_bancas_fase1_inicio || calendario?.preparacao_bancas_fase1_fim)
      },
      {
        id: 6,
        titulo: 'Avaliação - Fase I',
        descricao: 'Prazo final para avaliação pela banca',
        data: formatarDataCurta(calendario?.avaliacao_fase1_fim),
        icone: BookOpen,
        cor: 'purple',
        temDados: !!calendario?.avaliacao_fase1_fim
      },
      {
        id: 7,
        titulo: 'Preparação das bancas (Fase II)',
        descricao: 'Formação das bancas para apresentação',
        data: formatarDataCurta(calendario?.preparacao_bancas_fase2),
        icone: Briefcase,
        cor: 'pink',
        temDados: !!calendario?.preparacao_bancas_fase2
      },
      {
        id: 8,
        titulo: 'Apresentação dos trabalhos (Fase II)',
        descricao: 'Prazo final para apresentações orais',
        data: formatarDataCurta(calendario?.defesas_fim),
        icone: Users,
        cor: 'indigo',
        temDados: !!calendario?.defesas_fim
      },
      {
        id: 9,
        titulo: 'Ajustes finais',
        descricao: 'Prazo para correções pós-defesa',
        data: formatarDataCurta(calendario?.ajustes_finais_fim),
        icone: CheckCircle,
        cor: 'green',
        temDados: !!calendario?.ajustes_finais_fim
      }
    ]
  }, [calendario])

  const getIconBgClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-gradient-to-br from-[rgb(var(--cor-destaque))] to-[rgb(var(--cor-destaque))]/80',
      yellow: 'bg-gradient-to-br from-[rgb(var(--cor-alerta))] to-[rgb(var(--cor-alerta))]/80',
      green: 'bg-gradient-to-br from-[rgb(var(--cor-sucesso))] to-[rgb(var(--cor-sucesso))]/80',
      red: 'bg-gradient-to-br from-[rgb(var(--cor-erro))] to-[rgb(var(--cor-erro))]/80'
    }
    return colors[color] || colors.blue
  }

  const getBarColor = (cor: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-[rgb(var(--cor-destaque))]',
      yellow: 'bg-[rgb(var(--cor-alerta))]',
      purple: 'bg-[rgb(var(--cor-fase2-cabecalho))]',
      orange: 'bg-[rgb(var(--cor-alerta))]',
      green: 'bg-[rgb(var(--cor-sucesso))]'
    }
    return colors[cor] || colors.blue
  }

  return (
    <div>
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cor-texto">
          Seja bem-vindo, {usuario?.nome_completo?.split(' ')[0]}!
        </h1>
      </div>

      {/* Primeira linha: Ações Pendentes e Datas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ações Pendentes */}
        <div className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6 h-full flex flex-col">
          <h2 className="text-lg font-semibold text-cor-texto mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-cor-texto" />
            Ações pendentes
          </h2>

          {/* Loading skeleton */}
          {carregando ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Clock className="h-12 w-12 text-cor-texto/20 animate-pulse" />
                </div>
                <p className="text-base font-semibold text-cor-texto mb-1">Carregando...</p>
                <p className="text-sm text-cor-texto">Buscando ações pendentes</p>
              </div>
            </div>
          ) : acoesPendentes.length > 0 ? (
            <>
              {/* Renderização com ações pendentes (solicitações + bancas) */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {acoesPendentes.map((acao) => {
                  // Definir cores baseado no tipo de ação
                  let bgColor = 'bg-[rgb(var(--cor-alerta))]/10'
                  let borderColor = 'border-[rgb(var(--cor-alerta))]/20'

                  if (acao.tipo === 'banca') {
                    bgColor = 'bg-[rgb(var(--cor-fase2-cabecalho))]/10'
                    borderColor = 'border-[rgb(var(--cor-fase2-cabecalho))]/20'
                  } else if (acao.tipo === 'validacao') {
                    bgColor = 'bg-[rgb(var(--cor-destaque))]/10'
                    borderColor = 'border-[rgb(var(--cor-destaque))]/20'
                  } else if (acao.tipo === 'validacao_fase2') {
                    bgColor = 'bg-[rgb(var(--cor-sucesso))]/10'
                    borderColor = 'border-[rgb(var(--cor-sucesso))]/20'
                  }

                  return (
                    <div
                      key={acao.id}
                      onClick={() => {
                        if (acao.tipo === 'solicitacao' && acao.solicitacaoId) {
                          handleVerDetalhes(acao.solicitacaoId)
                        } else if ((acao.tipo === 'banca' || acao.tipo === 'validacao' || acao.tipo === 'validacao_fase2') && acao.tccId) {
                          handleFormarBanca(acao.tccId)
                        }
                      }}
                      className={`p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer ${bgColor} ${borderColor}`}
                    >
                      {/* Header simplificado */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-cor-texto mb-1">
                            {acao.titulo}
                          </p>
                          <p className="text-sm text-cor-texto/80">
                            {acao.aluno}
                          </p>
                        </div>
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-cor-destaque text-white hover:bg-cor-destaque/90 pointer-events-none"
                        >
                          Ir
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botão de ação principal */}
              <button
                onClick={() => {
                  const primeiraAcao = acoesPendentes[0]
                  if (primeiraAcao.tipo === 'solicitacao' && primeiraAcao.solicitacaoId) {
                    handleVerDetalhes(primeiraAcao.solicitacaoId)
                  } else if ((primeiraAcao.tipo === 'banca' || primeiraAcao.tipo === 'validacao' || primeiraAcao.tipo === 'validacao_fase2') && primeiraAcao.tccId) {
                    handleFormarBanca(primeiraAcao.tccId)
                  }
                }}
                className="w-full px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium shadow-md transition-all bg-cor-destaque text-white hover:bg-cor-destaque/90"
              >
                <AlertCircle className="h-5 w-5" />
                Ir para a primeira ação da lista ({acoesPendentes.length} pendentes)
              </button>
            </>
          ) : (
            <>
              {/* Estado vazio - sem ações pendentes */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <AlertCircle className="h-12 w-12 text-cor-texto/20" />
                  </div>
                  <p className="text-base font-semibold text-cor-texto mb-1">
                    Sem ações pendentes
                  </p>
                  <p className="text-sm text-cor-texto/60">
                    Nenhuma ação aguardando sua aprovação
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Datas Importantes */}
        <PainelDatasImportantes
          datas={datasImportantes}
          calendario={calendario}
        />
      </div>

      {/* Segunda linha: Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${getIconBgClasses(card.color)}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-cor-texto/70 text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-cor-texto">{card.value}</p>
            <p className="text-xs text-cor-texto/60 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Terceira linha: TCCs por etapa */}
      <div className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6">
        <h2 className="text-lg font-semibold text-cor-texto mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cor-texto/60" />
          TCCs por etapa
        </h2>
        <div className="space-y-4">
          {etapas.map((etapa, index) => (
            <div key={index}>
              <div className="mb-1">
                <span className="text-sm text-cor-texto/70">{etapa.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-cor-borda/30 rounded-full h-9 relative overflow-hidden">
                  {etapa.count > 0 ? (
                    <div
                      className={`${getBarColor(etapa.cor)} h-9 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80`}
                      style={{ width: `${etapa.widthPercentual}%` }}
                      onMouseEnter={(e) => mostrarTooltip(e, etapa.tooltipHtml)}
                      onMouseMove={(e) => mostrarTooltip(e, etapa.tooltipHtml)}
                      onMouseLeave={esconderTooltip}
                      onClick={() => navigate('/tccs', { state: { filtroEtapas: etapa.etapas } })}
                    >
                      <span className="text-sm text-white font-semibold">{etapa.count}</span>
                    </div>
                  ) : (
                    <div className="h-9 flex items-center justify-center">
                      {/* Vazio - sem contar quando 0 */}
                    </div>
                  )}
                </div>
                <span className="text-sm text-cor-texto/60 w-12 text-right">
                  {etapa.percentual.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip customizado */}
      {tooltip.visivel && (
        <div
          className="fixed z-50 px-3 py-2 bg-cor-texto text-cor-fundo text-xs rounded shadow-lg pointer-events-none"
          style={{
            top: Math.max(tooltip.y - 16, 12),
            left: tooltip.x + 12,
            transform: 'translateY(-100%)',
            maxWidth: '280px'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.texto }}
        />
      )}
    </div>
  )
}
