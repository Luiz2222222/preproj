import type { ReactElement } from 'react'
import type { EventoTimeline } from '../types'
import {
  Calendar,
  Clock,
  Users,
  Send,
  Lock,
  Unlock,
  FileEdit,
  CheckCircle,
  XCircle,
  FileCheck,
  FileText,
  UserCheck,
  MessageCircle,
  Award,
  CalendarCheck,
  Plus
} from 'lucide-react'
import { Badge } from './Badge'
import { SkeletonList } from './Skeleton'

interface TimelineVerticalEventosProps {
  eventos: EventoTimeline[]
  carregando: boolean
}

// Função para obter ícone e cor baseado no tipo de evento
function getEventoIconeECor(tipoEvento: string): { icone: ReactElement; cor: string; corBg: string } {
  const ICONES: Record<string, { icone: ReactElement; cor: string; corBg: string }> = {
    // Eventos iniciais
    CRIACAO_TCC: {
      icone: <Plus className="h-4 w-4" />,
      cor: 'text-blue-600',
      corBg: 'bg-blue-100'
    },
    SOLICITACAO_ENVIADA: {
      icone: <Send className="h-4 w-4" />,
      cor: 'text-blue-600',
      corBg: 'bg-blue-100'
    },
    SOLICITACAO_ACEITA: {
      icone: <UserCheck className="h-4 w-4" />,
      cor: 'text-green-600',
      corBg: 'bg-green-100'
    },
    SOLICITACAO_RECUSADA: {
      icone: <XCircle className="h-4 w-4" />,
      cor: 'text-red-600',
      corBg: 'bg-red-100'
    },

    // Documentos
    UPLOAD_DOCUMENTO: {
      icone: <FileText className="h-4 w-4" />,
      cor: 'text-purple-600',
      corBg: 'bg-purple-100'
    },
    FEEDBACK_ORIENTADOR: {
      icone: <MessageCircle className="h-4 w-4" />,
      cor: 'text-indigo-600',
      corBg: 'bg-indigo-100'
    },

    // Continuidade
    APROVACAO_CONTINUIDADE: {
      icone: <CheckCircle className="h-4 w-4" />,
      cor: 'text-green-600',
      corBg: 'bg-green-100'
    },
    REPROVACAO_CONTINUIDADE: {
      icone: <XCircle className="h-4 w-4" />,
      cor: 'text-red-600',
      corBg: 'bg-red-100'
    },
    LIBERACAO_AVALIACAO: {
      icone: <FileCheck className="h-4 w-4" />,
      cor: 'text-cyan-600',
      corBg: 'bg-cyan-100'
    },

    // Fase I
    FORMACAO_BANCA: {
      icone: <Users className="h-4 w-4" />,
      cor: 'text-orange-600',
      corBg: 'bg-orange-100'
    },
    AVALIACAO_ENVIADA: {
      icone: <Send className="h-4 w-4" />,
      cor: 'text-blue-600',
      corBg: 'bg-blue-100'
    },
    AVALIACAO_REABERTA: {
      icone: <FileEdit className="h-4 w-4" />,
      cor: 'text-yellow-600',
      corBg: 'bg-yellow-100'
    },
    BLOQUEIO_AVALIACOES: {
      icone: <Lock className="h-4 w-4" />,
      cor: 'text-gray-600',
      corBg: 'bg-gray-100'
    },
    DESBLOQUEIO_AVALIACOES: {
      icone: <Unlock className="h-4 w-4" />,
      cor: 'text-green-600',
      corBg: 'bg-green-100'
    },
    SOLICITACAO_AJUSTES: {
      icone: <FileEdit className="h-4 w-4" />,
      cor: 'text-amber-600',
      corBg: 'bg-amber-100'
    },
    APROVACAO_PARCIAL: {
      icone: <CheckCircle className="h-4 w-4" />,
      cor: 'text-teal-600',
      corBg: 'bg-teal-100'
    },
    RESULTADO_FASE_1: {
      icone: <Award className="h-4 w-4" />,
      cor: 'text-purple-600',
      corBg: 'bg-purple-100'
    },

    // Fase II
    AGENDAMENTO_DEFESA: {
      icone: <CalendarCheck className="h-4 w-4" />,
      cor: 'text-indigo-600',
      corBg: 'bg-indigo-100'
    },
    RESULTADO_FINAL: {
      icone: <Award className="h-4 w-4" />,
      cor: 'text-purple-600',
      corBg: 'bg-purple-100'
    },

    // Outros
    DEFESA_REALIZADA: {
      icone: <Award className="h-4 w-4" />,
      cor: 'text-green-600',
      corBg: 'bg-green-100'
    },
    CONCLUSAO: {
      icone: <Award className="h-4 w-4" />,
      cor: 'text-green-600',
      corBg: 'bg-green-100'
    }
  }

  return ICONES[tipoEvento] || {
    icone: <Calendar className="h-4 w-4" />,
    cor: 'text-gray-600',
    corBg: 'bg-gray-100'
  }
}

export function TimelineVerticalEventos({ eventos, carregando }: TimelineVerticalEventosProps) {
  if (carregando) {
    return <SkeletonList count={4} />
  }

  if (eventos.length === 0) {
    return (
      <p className="text-cor-texto opacity-75 text-center py-8">
        Nenhum evento registrado ainda.
      </p>
    )
  }

  // Inverter ordem para cronológica (mais antigo primeiro)
  let eventosOrdenados = [...eventos].reverse()

  // Remover o primeiro evento de criação duplicado (mais antigo)
  if (eventosOrdenados.length > 0 && eventosOrdenados[0].tipo_evento === 'CRIACAO_TCC') {
    eventosOrdenados = eventosOrdenados.slice(1)
  }

  return (
    <div className="space-y-3">
      {eventosOrdenados.map((evento, index) => {
        const { icone, cor, corBg } = getEventoIconeECor(evento.tipo_evento)

        return (
          <div
            key={evento.id}
            className="relative flex gap-4 pl-6"
          >
            {/* Linha vertical conectora */}
            {index < eventosOrdenados.length - 1 && (
              <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Ícone do evento */}
            <div className={`
              relative z-10 flex-shrink-0 w-6 h-6 rounded-full
              ${corBg} ${cor} flex items-center justify-center
              border-2 border-white shadow-sm
            `}>
              {icone}
            </div>

            {/* Conteúdo do evento */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-cor-texto text-sm leading-snug">{evento.descricao}</p>
                <Badge variant="info" className="flex-shrink-0 text-xs">
                  {evento.tipo_display}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mt-1 text-pequeno text-cor-texto opacity-60">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(evento.timestamp).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(evento.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              {evento.usuario_dados && (
                <p className="text-pequeno text-cor-texto opacity-60 mt-1">
                  Por: {evento.usuario_dados.nome_completo}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
