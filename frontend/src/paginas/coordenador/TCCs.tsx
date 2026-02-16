/**
 * Página de gestão de TCCs do coordenador
 * Lista todos os TCCs com filtros - Layout completo (sem painel lateral)
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  TrendingUp,
  BarChart3,
  Users,
  Loader2,
  RefreshCw,
  XCircle,
  Edit,
  Download
} from 'lucide-react'
import { useTCCsCoordenador } from '../../hooks'
import { EtapaTCC, EtapaTCCLabels, EtapaTCCColors, CursoLabels } from '../../types/enums'
import type { TCC } from '../../types'
import { TimelineHorizontalDetalhado } from '../../componentes/TimelineHorizontalDetalhado'
import { ModalEditarTCC } from '../../componentes/ModalEditarTCC'

export function TCCs() {
  const navigate = useNavigate()
  const location = useLocation<{ filtroEtapa?: string }>()
  const { tccs, carregando, erro, recarregar } = useTCCsCoordenador()

  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState<string>('todas')
  const [filtroCurso, setFiltroCurso] = useState<string>('todos')
  const [tccEditando, setTccEditando] = useState<TCC | null>(null)

  // Aplicar filtro inicial do state (quando vem do dashboard)
  useEffect(() => {
    if (location.state?.filtroEtapa) {
      setFiltroEtapa(location.state.filtroEtapa)
    }
  }, [location.state])

  // Estatísticas calculadas
  const estatisticas = useMemo(() => {
    const total = tccs.length
    const aguardandoAcao = tccs.filter(t =>
      t.etapa_atual === EtapaTCC.INICIALIZACAO ||
      t.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1 ||
      t.etapa_atual === EtapaTCC.VALIDACAO_FASE_1
    ).length
    const concluidos = tccs.filter(t => t.etapa_atual === EtapaTCC.CONCLUIDO).length
    const comDefesaAgendada = tccs.filter(t => t.data_defesa).length

    return {
      total,
      aguardandoAcao,
      concluidos,
      comDefesaAgendada
    }
  }, [tccs])

  // Gerar etapas disponíveis dinamicamente
  const etapasDisponiveis = useMemo(() => {
    const contadores: Record<string, number> = {}
    tccs.forEach(tcc => {
      contadores[tcc.etapa_atual] = (contadores[tcc.etapa_atual] || 0) + 1
    })

    const etapas = [
      { value: 'todas', label: 'Todas as etapas', count: tccs.length }
    ]

    // Adicionar apenas etapas que existem nos dados (sem grupos)
    Object.entries(EtapaTCCLabels).forEach(([key, label]) => {
      if (contadores[key] && contadores[key] > 0) {
        etapas.push({
          value: key,
          label,
          count: contadores[key]
        })
      }
    })

    return etapas
  }, [tccs])

  // Gerar cursos disponíveis dinamicamente
  const cursosDisponiveis = useMemo(() => {
    const cursosSet = new Set<string>()
    tccs.forEach(tcc => {
      if (tcc.aluno_dados?.curso) {
        cursosSet.add(tcc.aluno_dados.curso)
      }
    })

    return [
      { value: 'todos', label: 'Todos os cursos' },
      ...Array.from(cursosSet).map(curso => ({
        value: curso,
        label: CursoLabels[curso] || curso
      }))
    ]
  }, [tccs])

  // Filtrar TCCs
  const tccsFiltrados = useMemo(() => {
    return tccs.filter(tcc => {
      const nomeAluno = tcc.aluno_dados?.nome_completo ?? ''
      const nomeOrientador = tcc.orientador_dados?.nome_completo ?? ''
      const nomeCoorientador = tcc.coorientador_dados?.nome_completo ?? ''
      const curso = tcc.aluno_dados?.curso ?? ''

      const matchSearch =
        tcc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nomeAluno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nomeOrientador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nomeCoorientador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        curso.toLowerCase().includes(searchTerm.toLowerCase())

      const matchEtapa = filtroEtapa === 'todas' || tcc.etapa_atual === filtroEtapa

      const matchCurso = filtroCurso === 'todos' || tcc.aluno_dados?.curso === filtroCurso

      return matchSearch && matchEtapa && matchCurso
    })
  }, [tccs, searchTerm, filtroEtapa, filtroCurso])

  // Função para determinar status do TCC
  const getStatus = (tcc: TCC): 'normal' | 'atencao' | 'urgente' => {
    // Lógica simplificada - pode ser expandida conforme regras de negócio
    if (tcc.etapa_atual === EtapaTCC.INICIALIZACAO) return 'urgente'
    if (tcc.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1 || tcc.etapa_atual === EtapaTCC.VALIDACAO_FASE_1) return 'atencao'
    return 'normal'
  }

  const getStatusColor = (status: 'normal' | 'atencao' | 'urgente') => {
    switch (status) {
      case 'urgente': return 'text-[rgb(var(--cor-erro))] bg-[rgb(var(--cor-erro))]/10'
      case 'atencao': return 'text-[rgb(var(--cor-alerta))] bg-[rgb(var(--cor-alerta))]/10'
      default: return 'text-[rgb(var(--cor-sucesso))] bg-[rgb(var(--cor-sucesso))]/10'
    }
  }

  const getEtapaColor = (etapa: EtapaTCC) => {
    return EtapaTCCColors[etapa] || 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))]'
  }

  // Estados de carregamento e erro
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--cor-destaque))] mx-auto mb-4" />
          <p className="text-[rgb(var(--cor-texto-secundario))]">Carregando TCCs...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-[rgb(var(--cor-erro))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">Erro ao carregar TCCs</h3>
          <p className="text-[rgb(var(--cor-texto-secundario))] mb-4">{erro}</p>
          <button
            onClick={recarregar}
            className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (tccs.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Gestão de TCCs</h1>
          <p className="text-[rgb(var(--cor-texto-secundario))]">Acompanhe todos os trabalhos de conclusão de curso</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 text-[rgb(var(--cor-icone))] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">Nenhum TCC encontrado</h3>
            <p className="text-[rgb(var(--cor-texto-secundario))]">Ainda não há TCCs cadastrados no sistema.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Gestão de TCCs</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))]">Acompanhe todos os trabalhos de conclusão de curso</p>
      </div>

      {/* Distribuição por Etapa */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-3">Distribuição por etapa</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {etapasDisponiveis.slice(1).map(etapa => (
            <div
              key={etapa.value}
              className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-3 hover:shadow-md hover:bg-[rgb(var(--cor-superficie-hover))] transition-all cursor-pointer"
              onClick={() => setFiltroEtapa(etapa.value)}
            >
              <div className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-1">{etapa.count}</div>
              <div className="text-xs text-[rgb(var(--cor-texto-secundario))]">{etapa.label}</div>
              <div className="mt-2 w-full bg-[rgb(var(--cor-borda-leve))] rounded-full h-1.5">
                <div
                  className="bg-[rgb(var(--cor-destaque))] h-1.5 rounded-full"
                  style={{ width: `${(etapa.count / estatisticas.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--cor-icone))]" />
              <input
                type="text"
                placeholder="Buscar por título, aluno ou orientador..."
                className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
          >
            {etapasDisponiveis.map(etapa => (
              <option key={etapa.value} value={etapa.value}>
                {etapa.label} ({etapa.count})
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
          >
            {cursosDisponiveis.map(curso => (
              <option key={curso.value} value={curso.value}>
                {curso.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de TCCs em Cards com Timeline */}
      <div className="space-y-4">
        {tccsFiltrados.length === 0 ? (
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-8 text-center">
            <AlertCircle className="h-12 w-12 text-[rgb(var(--cor-icone))] mx-auto mb-2" />
            <p className="text-[rgb(var(--cor-texto-secundario))]">Nenhum TCC encontrado com os filtros aplicados</p>
          </div>
        ) : (
          tccsFiltrados.map((tcc) => {
            const status = getStatus(tcc)

            return (
              <div
                key={tcc.id}
                className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/tccs/${tcc.id}`)}
              >
                {/* Header do Card com Informações Principais */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-1">{tcc.titulo}</h3>
                      <div className="flex items-center gap-4 text-sm text-[rgb(var(--cor-texto-secundario))]">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                          <span><strong>Aluno:</strong> {tcc.aluno_dados?.nome_completo || 'N/A'}</span>
                        </div>
                        <div>
                          <span><strong>Orientador:</strong> {tcc.orientador_dados?.nome_completo || 'N/A'}</span>
                          {tcc.coorientador_dados && (
                            <span className="ml-2 text-[rgb(var(--cor-texto-terciario))]">
                              (Co: {tcc.coorientador_dados.nome_completo})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEtapaColor(tcc.etapa_atual)}`}>
                          {EtapaTCCLabels[tcc.etapa_atual]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 text-xs text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-destaque))] hover:bg-[rgb(var(--cor-destaque))]/10 rounded-lg transition-colors flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTccEditando(tcc)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-destaque))] hover:bg-[rgb(var(--cor-destaque))]/10 rounded-lg transition-colors flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Ação de download
                          }}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Horizontal Detalhada */}
                <div className="pt-4 border-t border-[rgb(var(--cor-borda-leve))]">
                  <TimelineHorizontalDetalhado
                    tcc={tcc}
                    documentos={(tcc.documentos || []) as any}
                    mostrarNotas={true}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Paginação */}
      {tccsFiltrados.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] mt-6">
          <div className="text-sm text-[rgb(var(--cor-texto-medio))]">
            Mostrando <span className="font-medium">1</span> a <span className="font-medium">{tccsFiltrados.length}</span> de{' '}
            <span className="font-medium">{tccsFiltrados.length}</span> resultados
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border border-[rgb(var(--cor-borda-forte))] rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] disabled:opacity-50 text-[rgb(var(--cor-texto-secundario))]" disabled>
              Anterior
            </button>
            <button className="px-3 py-1 text-sm bg-[rgb(var(--cor-destaque))] text-white rounded-lg">1</button>
            <button className="px-3 py-1 text-sm border border-[rgb(var(--cor-borda-forte))] rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] disabled:opacity-50 text-[rgb(var(--cor-texto-secundario))]" disabled>
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {tccEditando && (
        <ModalEditarTCC
          tcc={tccEditando}
          onClose={() => setTccEditando(null)}
          onSalvo={() => {
            setTccEditando(null)
            recarregar()
          }}
        />
      )}
    </div>
  )
}
