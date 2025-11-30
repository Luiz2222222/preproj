/**
 * Timeline Vertical Detalhada - Baseada no layout do projeto legado
 * Exibe grupos colapsáveis com sub-estados e informações adicionais
 */

import { useState, useMemo } from 'react'
import type { ReactElement } from 'react'
import {
  UserCheck,
  FileText,
  Users,
  CheckSquare,
  Calendar,
  Mic,
  Award,
  Circle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { TCC, EventoTimeline } from '../types'
import {
  GrupoTimelineDetalhada,
  SubEstadoVisual
} from '../types/timelineDetalhada'
import {
  GRUPOS_TIMELINE,
  determinarEstadoAtual,
  obterStatusGrupo,
  extrairDadosTCC
} from '../utils/timelineDetalhadaHelpers'

interface TimelineVerticalDetalhadaProps {
  tcc: TCC
  eventos?: EventoTimeline[]
  carregando?: boolean
}

export function TimelineVerticalDetalhada({ tcc, eventos: _eventos = [], carregando }: TimelineVerticalDetalhadaProps) {
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<GrupoTimelineDetalhada>>(new Set())

  // Determinar estado atual baseado no TCC
  const dadosTCC = useMemo(() => extrairDadosTCC(tcc), [tcc])
  const estadoAtual = useMemo(() => determinarEstadoAtual(dadosTCC), [dadosTCC])

  // Toggle expansão de grupo
  const toggleGrupo = (grupoId: GrupoTimelineDetalhada) => {
    const newExpanded = new Set(gruposExpandidos)
    if (newExpanded.has(grupoId)) {
      newExpanded.delete(grupoId)
    } else {
      newExpanded.add(grupoId)
    }
    setGruposExpandidos(newExpanded)
  }

  // Ícones por grupo
  const getIconeGrupo = (icone: string): ReactElement => {
    const icones: Record<string, ReactElement> = {
      'UserCheck': <UserCheck className="w-6 h-6" />,
      'FileText': <FileText className="w-6 h-6" />,
      'Users': <Users className="w-6 h-6" />,
      'CheckSquare': <CheckSquare className="w-6 h-6" />,
      'Calendar': <Calendar className="w-6 h-6" />,
      'Mic': <Mic className="w-6 h-6" />,
      'Award': <Award className="w-6 h-6" />
    }
    return icones[icone] || <Circle className="w-6 h-6" />
  }

  // Cores e estilos por status
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'concluido':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-600',
          iconBg: 'bg-green-100',
          line: 'bg-green-400',
          badge: 'bg-green-100 text-green-800'
        }
      case 'em_andamento':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          line: 'bg-blue-400',
          badge: 'bg-blue-100 text-blue-800'
        }
      case 'aguardando':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          line: 'bg-yellow-400',
          badge: 'bg-yellow-100 text-yellow-800'
        }
      case 'problema':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          line: 'bg-red-400',
          badge: 'bg-red-100 text-red-800'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-500',
          icon: 'text-gray-400',
          iconBg: 'bg-gray-100',
          line: 'bg-gray-300',
          badge: 'bg-gray-100 text-gray-600'
        }
    }
  }

  // Ícone de status do sub-estado
  const getSubEstadoIcon = (isCompleto: boolean, isAtual: boolean) => {
    if (isCompleto) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (isAtual) return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
    return <Circle className="w-4 h-4 text-gray-300" />
  }

  // Determinar se um sub-estado está completo
  const isSubEstadoCompleto = (grupoId: GrupoTimelineDetalhada, subEstadoId: SubEstadoVisual): boolean => {
    const ordemGrupos = GRUPOS_TIMELINE.map(g => g.id)
    const indiceGrupoAtual = ordemGrupos.indexOf(estadoAtual.grupo)
    const indiceGrupo = ordemGrupos.indexOf(grupoId)

    // Se o grupo já foi concluído
    if (indiceGrupo < indiceGrupoAtual) return true

    // Se é o grupo atual, verificar o sub-estado
    if (grupoId === estadoAtual.grupo) {
      const grupo = GRUPOS_TIMELINE.find(g => g.id === grupoId)
      if (!grupo) return false

      const subEstados = grupo.subEstados
      const indiceSubAtual = subEstados.findIndex(s => s.id === estadoAtual.subEstado)
      const indiceSub = subEstados.findIndex(s => s.id === subEstadoId)

      return indiceSub < indiceSubAtual
    }

    return false
  }

  // Verificar se é o sub-estado atual
  const isSubEstadoAtual = (grupoId: GrupoTimelineDetalhada, subEstadoId: SubEstadoVisual): boolean => {
    return grupoId === estadoAtual.grupo && subEstadoId === estadoAtual.subEstado
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Timeline Vertical */}
      <div className="relative">
        {/* Linha vertical conectora */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Grupos */}
        <div className="space-y-4">
          {GRUPOS_TIMELINE.map((grupo, index) => {
            const status = obterStatusGrupo(grupo.id, estadoAtual)
            const styles = getStatusStyles(status)
            const isAtual = grupo.id === estadoAtual.grupo
            const isExpanded = gruposExpandidos.has(grupo.id) || isAtual

            return (
              <div key={grupo.id} className="relative">
                {/* Linha colorida até este ponto */}
                {index > 0 && status !== 'futuro' && (
                  <div
                    className={`absolute left-8 -top-4 w-0.5 h-4 ${styles.line}`}
                  />
                )}

                {/* Card do grupo */}
                <div className={`ml-16 ${styles.bg} ${styles.border} border rounded-lg overflow-hidden`}>
                  {/* Cabeçalho do grupo */}
                  <div
                    className="p-4 cursor-pointer hover:bg-opacity-75 transition-colors"
                    onClick={() => toggleGrupo(grupo.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Número e ícone do grupo */}
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${styles.text}`}>
                            {grupo.numero}.
                          </span>
                          <div className={styles.icon}>
                            {getIconeGrupo(grupo.icone)}
                          </div>
                        </div>

                        {/* Label do grupo */}
                        <div>
                          <h4 className={`font-semibold ${styles.text}`}>
                            {grupo.label}
                          </h4>
                          {isAtual && (
                            <p className="text-xs text-gray-600 mt-1">
                              Etapa atual
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badges e chevron */}
                      <div className="flex items-center gap-2">
                        {/* Badge de status */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                          {status === 'concluido' ? 'Concluído' :
                           status === 'em_andamento' ? 'Em andamento' :
                           status === 'aguardando' ? 'Aguardando' :
                           status === 'problema' ? 'Problema' :
                           'Não iniciado'}
                        </span>

                        {/* Chevron */}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo expandido - Sub-estados */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="mt-3 space-y-2">
                        {grupo.subEstados.map((subEstado) => {
                          const isCompleto = isSubEstadoCompleto(grupo.id, subEstado.id)
                          const isSubAtual = isSubEstadoAtual(grupo.id, subEstado.id)

                          return (
                            <div
                              key={subEstado.id}
                              className={`
                                flex items-start gap-2 p-2 rounded-lg
                                ${isSubAtual ? 'bg-blue-50 border border-blue-200' :
                                  isCompleto ? 'bg-green-50' : 'bg-white'}
                              `}
                            >
                              {/* Ícone do sub-estado */}
                              <div className="mt-0.5">
                                {getSubEstadoIcon(isCompleto, isSubAtual)}
                              </div>

                              {/* Texto do sub-estado */}
                              <div className="flex-1">
                                <p className={`text-sm ${
                                  isSubAtual ? 'font-semibold text-blue-700' :
                                  isCompleto ? 'text-green-700' : 'text-gray-600'
                                }`}>
                                  {subEstado.label}
                                </p>
                              </div>

                              {/* Indicador adicional para estado atual */}
                              {isSubAtual && (
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Atual
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Círculo indicador na linha vertical */}
                <div
                  className={`
                    absolute left-4 top-8 w-8 h-8 rounded-full
                    ${styles.iconBg} ${styles.border} border-2
                    flex items-center justify-center
                  `}
                >
                  {status === 'concluido' ? (
                    <CheckCircle className={`w-5 h-5 ${styles.icon}`} />
                  ) : status === 'em_andamento' ? (
                    <Clock className={`w-5 h-5 ${styles.icon} animate-pulse`} />
                  ) : status === 'aguardando' ? (
                    <Clock className={`w-5 h-5 ${styles.icon}`} />
                  ) : status === 'problema' ? (
                    <XCircle className={`w-5 h-5 ${styles.icon}`} />
                  ) : (
                    <Circle className={`w-5 h-5 ${styles.icon}`} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
