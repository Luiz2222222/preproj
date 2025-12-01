import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Clock,
  Users,
  FileText,
  CheckCircle,
  BookOpen,
  BarChart3,
  Briefcase
} from 'lucide-react'
import { useAutenticacao } from '../../autenticacao'
import { useToast } from '../../contextos/ToastProvider'
import { useCalendarioSemestre } from '../../hooks'
import { EtapaTCC } from '../../types'
import { formatarDataCurta, formatarIntervalo } from '../../utils/datas'
import { PainelDatasImportantes } from '../../componentes'

export function DashboardAvaliador() {
  const { usuario } = useAutenticacao()
  const { erro: mostrarErro } = useToast()
  const navigate = useNavigate()

  const { calendario } = useCalendarioSemestre()

  // TODO: Implementar hook para buscar co-orientações do avaliador externo
  // Por enquanto usando dados mock
  const coOrientacoes: any[] = []
  const totalCoOrientandos = coOrientacoes.length

  // Estatísticas baseadas nas co-orientações
  const emDesenvolvimento = coOrientacoes.filter((c: any) => c.etapa_atual === EtapaTCC.DESENVOLVIMENTO).length
  const emAvaliacao = coOrientacoes.filter((c: any) =>
    c.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1 ||
    c.etapa_atual === EtapaTCC.AVALIACAO_FASE_1
  ).length
  const defesasAgendadas = coOrientacoes.filter((c: any) =>
    c.etapa_atual === EtapaTCC.AGENDAMENTO_APRESENTACAO ||
    c.etapa_atual === EtapaTCC.APRESENTACAO_FASE_2
  ).length

  // Cards de estatísticas
  const statCards = [
    {
      title: 'Meus co-orientandos',
      value: totalCoOrientandos.toString(),
      change: `${totalCoOrientandos} ${totalCoOrientandos === 1 ? 'TCC ativo' : 'TCCs ativos'}`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Em desenvolvimento',
      value: emDesenvolvimento.toString(),
      change: `${emDesenvolvimento} na fase de desenvolvimento`,
      icon: FileText,
      color: 'yellow'
    },
    {
      title: 'Em avaliação',
      value: emAvaliacao.toString(),
      change: `${emAvaliacao} em processo de avaliação`,
      icon: BookOpen,
      color: 'purple'
    },
    {
      title: 'Defesas agendadas',
      value: defesasAgendadas.toString(),
      change: `${defesasAgendadas} aguardando apresentação`,
      icon: CheckCircle,
      color: 'green'
    }
  ]

  const iconBgClasses = {
    blue: 'bg-[rgb(var(--cor-destaque))]',
    yellow: 'bg-[rgb(var(--cor-alerta))]',
    purple: 'bg-[rgb(var(--cor-info))]',
    green: 'bg-[rgb(var(--cor-sucesso))]'
  }

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
        titulo: 'Submissão de monografia',
        descricao: 'Entrega da versão final para avaliação',
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

  return (
    <div>
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">
          Seja bem-vindo, {usuario?.nome_completo?.split(' ')[0]}!
        </h1>
      </div>

      {/* Primeira linha: Ações Pendentes e Datas Importantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ações Pendentes */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 h-full flex flex-col">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-alerta))]" />
            Ações pendentes
          </h2>

          {/* Estado vazio - sem ações pendentes */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <AlertCircle className="h-12 w-12 text-[rgb(var(--cor-borda))]" />
              </div>
              <p className="text-base font-semibold text-[rgb(var(--cor-texto-primario))] mb-1">
                Sem ações pendentes
              </p>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">
                Nenhuma ação aguardando sua avaliação
              </p>
            </div>
          </div>
        </div>

        {/* Datas Importantes */}
        <PainelDatasImportantes
          datas={datasImportantes}
          calendario={calendario}
        />
      </div>

      {/* Segunda linha: Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${iconBgClasses[card.color as keyof typeof iconBgClasses]}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-[rgb(var(--cor-texto-secundario))] text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{card.value}</p>
            <p className="text-xs text-[rgb(var(--cor-texto-secundario))] mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Terceira linha: Co-orientandos por Grupo */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
          Co-orientandos por grupo
        </h2>

        {totalCoOrientandos === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-[rgb(var(--cor-borda))] mx-auto mb-3" />
            <p className="text-[rgb(var(--cor-texto-secundario))]">
              Você ainda não possui co-orientações ativas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Grupos serão exibidos aqui quando houver co-orientações */}
          </div>
        )}
      </div>
    </div>
  )
}
