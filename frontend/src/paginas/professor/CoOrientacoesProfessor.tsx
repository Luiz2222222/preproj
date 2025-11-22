import { useState } from 'react'
import {
  Users,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  User,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react'
import type { EtapaTCC } from '../../types/enums'

interface CoOrientacao {
  id: number
  titulo: string
  aluno_nome: string
  orientador_principal: string
  orientador_email: string
  orientador_telefone?: string
  status: 'ATIVO' | 'AGUARDANDO_ACEITE' | 'CONCLUIDO'
  status_display: string
  etapa: EtapaTCC
  etapa_display: string
  data_inicio?: string
  data_fim?: string
  curso: string
}

export function CoOrientacoesProfessor() {
  // Mock data - 3 co-orientações
  const coOrientacoesMock: CoOrientacao[] = [
    {
      id: 1,
      titulo: 'Desenvolvimento de Aplicativo Mobile para Gestão de Energia',
      aluno_nome: 'Carla Mendes',
      orientador_principal: 'Prof. Dr. Roberto Alves',
      orientador_email: 'roberto.alves@university.edu',
      orientador_telefone: '(81) 99876-5432',
      status: 'ATIVO',
      status_display: 'Ativo',
      etapa: 'DESENVOLVIMENTO',
      etapa_display: 'Desenvolvimento',
      data_inicio: '2025-02-20',
      curso: 'Engenharia Elétrica'
    },
    {
      id: 2,
      titulo: 'Análise de Desempenho em Redes 5G',
      aluno_nome: 'Pedro Oliveira',
      orientador_principal: 'Profa. Dra. Ana Paula Costa',
      orientador_email: 'ana.costa@university.edu',
      orientador_telefone: '(81) 98765-4321',
      status: 'AGUARDANDO_ACEITE',
      status_display: 'Aguardando Aceite',
      etapa: 'INICIALIZACAO',
      etapa_display: 'Inicialização',
      data_inicio: '2025-03-01',
      curso: 'Engenharia Elétrica'
    },
    {
      id: 3,
      titulo: 'Sistema de Detecção de Falhas em Motores Elétricos',
      aluno_nome: 'Juliana Souza',
      orientador_principal: 'Prof. Dr. Marcos Lima',
      orientador_email: 'marcos.lima@university.edu',
      status: 'ATIVO',
      status_display: 'Ativo',
      etapa: 'AVALIACAO_FASE_1',
      etapa_display: 'Avaliação Fase 1',
      data_inicio: '2025-01-15',
      curso: 'Engenharia Elétrica'
    }
  ]

  const [coOrientacoes] = useState<CoOrientacao[]>(coOrientacoesMock)
  const [selectedCoOrientacao, setSelectedCoOrientacao] = useState<CoOrientacao | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')

  // Estatísticas
  const stats = {
    total: coOrientacoes.length,
    ativas: coOrientacoes.filter(c => c.status === 'ATIVO').length,
    aguardando: coOrientacoes.filter(c => c.status === 'AGUARDANDO_ACEITE').length,
    concluidas: coOrientacoes.filter(c => c.status === 'CONCLUIDO').length
  }

  // Filtrar co-orientações
  const coOrientacoesFiltradas = filtroStatus === 'TODOS'
    ? coOrientacoes
    : coOrientacoes.filter(c => c.status === filtroStatus)

  // Static color maps
  const statusColors: Record<string, string> = {
    ATIVO: 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] border-[rgb(var(--cor-sucesso))]/20',
    AGUARDANDO_ACEITE: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/20',
    CONCLUIDO: 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] border-[rgb(var(--cor-destaque))]/20'
  }

  const etapaColors: Record<EtapaTCC, string> = {
    INICIALIZACAO: 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] border-[rgb(var(--cor-borda))]',
    DESENVOLVIMENTO: 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] border-[rgb(var(--cor-destaque))]/20',
    FORMACAO_BANCA_FASE_1: 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))] border-[rgb(var(--cor-info))]/20',
    AVALIACAO_FASE_1: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/20',
    VALIDACAO_FASE_1: 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))] border-[rgb(var(--cor-info))]/20',
    AGENDAMENTO_APRESENTACAO: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/20',
    APRESENTACAO_FASE_2: 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))] border-[rgb(var(--cor-info))]/20',
    APROVADO: 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] border-[rgb(var(--cor-sucesso))]/20',
    ANALISE_FINAL_COORDENADOR: 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))] border-[rgb(var(--cor-info))]/20',
    AGUARDANDO_AJUSTES_FINAIS: 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/20',
    CONCLUIDO: 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] border-[rgb(var(--cor-sucesso))]/20',
    REPROVADO_FASE_1: 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] border-[rgb(var(--cor-erro))]/20',
    REPROVADO_FASE_2: 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] border-[rgb(var(--cor-erro))]/20',
    DESCONTINUADO: 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] border-[rgb(var(--cor-erro))]/20'
  }

  const getStatusColor = (status: string) => {
    return statusColors[status] || 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] border-[rgb(var(--cor-borda))]'
  }

  const getEtapaColor = (etapa: EtapaTCC) => {
    return etapaColors[etapa] || 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] border-[rgb(var(--cor-borda))]'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <CheckCircle className="h-4 w-4" />
      case 'AGUARDANDO_ACEITE':
        return <Clock className="h-4 w-4" />
      case 'CONCLUIDO':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  // Se uma co-orientação foi selecionada, mostrar página de detalhes
  if (selectedCoOrientacao) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-md p-8">
            <button
              onClick={() => setSelectedCoOrientacao(null)}
              className="flex items-center gap-2 text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 mb-4 transition"
            >
              <Users className="h-4 w-4" />
              <span>Voltar para lista de co-orientações</span>
            </button>

            <h2 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-4">{selectedCoOrientacao.titulo}</h2>

            <div className="space-y-4">
              <div>
                <strong className="text-[rgb(var(--cor-texto-primario))]">Aluno:</strong> {selectedCoOrientacao.aluno_nome}
              </div>
              <div>
                <strong className="text-[rgb(var(--cor-texto-primario))]">Orientador Principal:</strong> {selectedCoOrientacao.orientador_principal}
              </div>
              <div>
                <strong className="text-[rgb(var(--cor-texto-primario))]">Email:</strong>{' '}
                <a href={`mailto:${selectedCoOrientacao.orientador_email}`} className="text-[rgb(var(--cor-destaque))] hover:underline">
                  {selectedCoOrientacao.orientador_email}
                </a>
              </div>
              {selectedCoOrientacao.orientador_telefone && (
                <div>
                  <strong className="text-[rgb(var(--cor-texto-primario))]">Telefone:</strong> {selectedCoOrientacao.orientador_telefone}
                </div>
              )}
              <div>
                <strong className="text-[rgb(var(--cor-texto-primario))]">Status:</strong> {selectedCoOrientacao.status_display}
              </div>
              <div>
                <strong className="text-[rgb(var(--cor-texto-primario))]">Etapa:</strong> {selectedCoOrientacao.etapa_display}
              </div>
              <div>
                <strong className="text-[rgb(var(--cor-texto-primario))]">Curso:</strong> {selectedCoOrientacao.curso}
              </div>
              {selectedCoOrientacao.data_inicio && (
                <div>
                  <strong className="text-[rgb(var(--cor-texto-primario))]">Data de Início:</strong>{' '}
                  {new Date(selectedCoOrientacao.data_inicio).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition"
              >
                <Mail className="h-4 w-4" />
                Enviar Lembrete
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-icone))] text-white rounded-lg hover:bg-[rgb(var(--cor-icone))]/90 transition"
              >
                <FileText className="h-4 w-4" />
                Ver Documentos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-[rgb(var(--cor-info))]" />
          <h1 className="text-3xl font-bold text-[rgb(var(--cor-texto-primario))]">Co-orientações</h1>
        </div>
        <p className="text-[rgb(var(--cor-texto-secundario))] ml-11">
          Acompanhe os TCCs em que você atua como co-orientador
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-l-4 border-[rgb(var(--cor-info))]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Total</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-[rgb(var(--cor-info))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-l-4 border-[rgb(var(--cor-sucesso))]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Ativas</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.ativas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-[rgb(var(--cor-sucesso))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-l-4 border-[rgb(var(--cor-alerta))]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Aguardando</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.aguardando}</p>
            </div>
            <Clock className="h-8 w-8 text-[rgb(var(--cor-alerta))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 border-l-4 border-[rgb(var(--cor-destaque))]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Concluídas</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.concluidas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Filtrar por status:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroStatus('TODOS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroStatus === 'TODOS'
                  ? 'bg-[rgb(var(--cor-info))] text-white'
                  : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroStatus('ATIVO')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroStatus === 'ATIVO'
                  ? 'bg-[rgb(var(--cor-sucesso))] text-white'
                  : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setFiltroStatus('AGUARDANDO_ACEITE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroStatus === 'AGUARDANDO_ACEITE'
                  ? 'bg-[rgb(var(--cor-alerta))] text-white'
                  : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50'
              }`}
            >
              Aguardando
            </button>
            <button
              onClick={() => setFiltroStatus('CONCLUIDO')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroStatus === 'CONCLUIDO'
                  ? 'bg-[rgb(var(--cor-destaque))] text-white'
                  : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))]/50'
              }`}
            >
              Concluídas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Co-orientações */}
      {coOrientacoesFiltradas.length === 0 ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-md p-12 text-center">
          <Users className="h-12 w-12 text-[rgb(var(--cor-icone))]/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
            Nenhuma co-orientação encontrada
          </h3>
          <p className="text-[rgb(var(--cor-texto-secundario))]">
            {filtroStatus === 'TODOS'
              ? 'Você ainda não possui co-orientações ativas.'
              : `Não há co-orientações com status "${filtroStatus.toLowerCase().replace('_', ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {coOrientacoesFiltradas.map((coOrientacao) => (
            <div
              key={coOrientacao.id}
              className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-[rgb(var(--cor-borda))]"
              onClick={() => setSelectedCoOrientacao(coOrientacao)}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">
                    {coOrientacao.titulo}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-[rgb(var(--cor-texto-secundario))]">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span><strong>Aluno:</strong> {coOrientacao.aluno_nome}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span><strong>Curso:</strong> {coOrientacao.curso}</span>
                    </div>
                  </div>
                </div>

                {/* Badges de Status e Etapa */}
                <div className="flex flex-col gap-2 ml-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${getStatusColor(coOrientacao.status)}`}>
                    {getStatusIcon(coOrientacao.status)}
                    {coOrientacao.status_display}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getEtapaColor(coOrientacao.etapa)}`}>
                    {coOrientacao.etapa_display}
                  </span>
                </div>
              </div>

              {/* Informações do Orientador Principal */}
              <div className="border-t border-[rgb(var(--cor-borda))]/50 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                  <span className="text-[rgb(var(--cor-texto-secundario))]">
                    <strong>Orientador Principal:</strong> {coOrientacao.orientador_principal}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                  <a
                    href={`mailto:${coOrientacao.orientador_email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[rgb(var(--cor-destaque))] hover:underline"
                  >
                    {coOrientacao.orientador_email}
                  </a>
                </div>
                {coOrientacao.orientador_telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                    <span className="text-[rgb(var(--cor-texto-secundario))]">{coOrientacao.orientador_telefone}</span>
                  </div>
                )}
                {coOrientacao.data_inicio && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                    <span className="text-[rgb(var(--cor-texto-secundario))]">
                      <strong>Início:</strong> {new Date(coOrientacao.data_inicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações Rápidas */}
              {coOrientacao.status === 'AGUARDANDO_ACEITE' && (
                <div className="border-t border-[rgb(var(--cor-borda))]/50 pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-alerta))] bg-[rgb(var(--cor-alerta))]/5 p-3 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>Aguardando sua confirmação como co-orientador</span>
                  </div>
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {}}
                      className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-sucesso))] text-white rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 transition text-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aceitar Co-orientação
                    </button>
                    <button
                      onClick={() => {}}
                      className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-erro))] text-white rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition text-sm"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
