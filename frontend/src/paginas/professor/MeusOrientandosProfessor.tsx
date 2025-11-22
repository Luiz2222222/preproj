import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  CheckCircle,
  BookOpen,
  Clock,
  Download,
  ArrowRight,
  User,
  Mail,
  GraduationCap
} from 'lucide-react'
import { useTCCsProfessor, useSolicitacoesPendentesProfessor } from '../../hooks'
import { EtapaTCC, EtapaTCCLabels, StatusDocumento, TipoDocumento } from '../../types'
import { Badge } from '../../componentes/Badge'
import type { TCC } from '../../types'

export function MeusOrientandosProfessor() {
  const navigate = useNavigate()

  // Hooks reais de API
  const { tccs, carregando: carregandoTCCs, erro: erroTCCs } = useTCCsProfessor()
  const { solicitacoes, carregando: carregandoSolicitacoes, erro: erroSolicitacoes } = useSolicitacoesPendentesProfessor()

  // Helper para pegar última monografia
  const getUltimaMonografia = (tcc: TCC) => {
    if (!tcc?.documentos) return null
    const monografias = tcc.documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
    if (monografias.length === 0) return null
    return monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
  }

  // Orientandos com monografia pendente
  const orientandosComMonografiaPendente = tccs.filter((tcc) => {
    const monografia = getUltimaMonografia(tcc)
    return tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO &&
           monografia &&
           (monografia.status === StatusDocumento.PENDENTE || monografia.status === StatusDocumento.EM_ANALISE)
  })

  // Calcular estatísticas baseadas nos TCCs reais
  const totalOrientandos = tccs.length
  const emDesenvolvimento = tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO).length
  const formacaoBanca = tccs.filter(tcc =>
    tcc.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1 ||
    tcc.etapa_atual === EtapaTCC.AVALIACAO_FASE_1
  ).length
  const defesasAgendadas = tccs.filter(tcc =>
    tcc.etapa_atual === EtapaTCC.AGENDAMENTO_APRESENTACAO ||
    tcc.etapa_atual === EtapaTCC.APRESENTACAO_FASE_2
  ).length

  // Cards de estatísticas
  const statCards = [
    {
      title: 'Total de orientandos',
      value: totalOrientandos.toString(),
      change: `${totalOrientandos} ${totalOrientandos === 1 ? 'TCC ativo' : 'TCCs ativos'}`,
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
      title: 'Formação de banca',
      value: formacaoBanca.toString(),
      change: `${formacaoBanca} em processo de avaliação`,
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

  const handleVerDetalhes = (tccId: number) => {
    navigate(`/professor/orientacoes/meus-orientandos/${tccId}`)
  }

  // Helper para formatar nome do curso
  const formatarCurso = (curso?: string | null) => {
    if (!curso) return 'Não informado'
    const texto = curso.toLowerCase().replace(/_/g, ' ')
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  if (erroTCCs || erroSolicitacoes) {
    return (
      <div className="p-6">
        <div className="bg-[rgb(var(--cor-erro))]/5 border border-[rgb(var(--cor-erro))]/20 rounded-lg p-4">
          <p className="text-[rgb(var(--cor-erro))] font-medium">Erro ao carregar dados</p>
          <p className="text-[rgb(var(--cor-erro))]/80 text-sm mt-1">
            {erroTCCs || erroSolicitacoes}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
          <h1 className="text-3xl font-bold text-[rgb(var(--cor-texto-primario))]">Meus orientandos</h1>
        </div>
        <p className="text-[rgb(var(--cor-texto-secundario))] ml-11">
          Acompanhe o progresso dos alunos que você está orientando
        </p>
      </div>

      {/* Banner de Monografias Pendentes */}
      {orientandosComMonografiaPendente.length > 0 && (
        <div className="bg-[rgb(var(--cor-alerta))]/5 border-l-4 border-[rgb(var(--cor-alerta))] p-4 mb-6 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-[rgb(var(--cor-alerta))]" />
              <div>
                <h3 className="font-semibold text-[rgb(var(--cor-alerta))]">
                  Monografias aguardando avaliação
                </h3>
                <p className="text-sm text-[rgb(var(--cor-alerta))]/80">
                  {orientandosComMonografiaPendente.length} {orientandosComMonografiaPendente.length === 1 ? 'orientando precisa' : 'orientandos precisam'} de avaliação
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/professor/orientacoes/meus-orientandos/${orientandosComMonografiaPendente[0].id}`)}
              className="px-4 py-2 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 transition flex items-center gap-2"
            >
              Avaliar primeiro
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cards de Estatísticas */}
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
            <p className="text-xs text-[rgb(var(--cor-texto-secundario))]/70 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Convites encaminhados ao coordenador (apenas informativo) */}
      {carregandoSolicitacoes ? (
        <div className="mb-8 bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-[rgb(var(--cor-alerta))] animate-pulse" />
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Carregando convites...</h2>
          </div>
        </div>
      ) : solicitacoes.length > 0 ? (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-[rgb(var(--cor-alerta))]" />
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Convites encaminhados ao coordenador</h2>
          </div>
          <div className="space-y-4">
            {solicitacoes.map((solicitacao) => (
              <div
                key={solicitacao.id}
                className="border border-[rgb(var(--cor-alerta))]/20 rounded-lg p-6 bg-[rgb(var(--cor-alerta))]/5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-3">
                      {solicitacao.tcc_dados?.titulo || 'TCC sem título'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                          <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                          <strong>Aluno:</strong> {solicitacao.aluno_nome}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                          <Mail className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                          <strong>E-mail:</strong> {solicitacao.aluno_email || 'Não informado'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                          <GraduationCap className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                          <strong>Curso:</strong> {formatarCurso(solicitacao.aluno_curso)}
                        </div>
                      </div>

                      {solicitacao.coorientador_nome && (
                        <div className="space-y-2">
                          <p className="text-sm text-[rgb(var(--cor-texto-primario))]">
                            <strong>Co-orientador sugerido:</strong> {solicitacao.coorientador_nome}
                          </p>
                          {solicitacao.coorientador_titulacao && (
                            <p className="text-sm text-[rgb(var(--cor-texto-primario))]">
                              <strong>Titulação:</strong> {solicitacao.coorientador_titulacao === 'mestre' ? 'Mestre' : solicitacao.coorientador_titulacao === 'doutor' ? 'Doutor' : solicitacao.coorientador_titulacao}
                            </p>
                          )}
                          {solicitacao.coorientador_lattes && (
                            <a
                              href={solicitacao.coorientador_lattes}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 underline flex items-center gap-1"
                            >
                              Ver currículo Lattes
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {solicitacao.mensagem && (
                      <div className="mt-3 p-3 bg-[rgb(var(--cor-superficie))]/60 rounded">
                        <p className="text-[rgb(var(--cor-texto-primario))] font-medium mb-1">Mensagem do aluno:</p>
                        <p className="text-[rgb(var(--cor-texto-secundario))] text-sm">{solicitacao.mensagem}</p>
                      </div>
                    )}

                    {/* Documentos */}
                    {solicitacao.documentos && solicitacao.documentos.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[rgb(var(--cor-texto-primario))] font-medium mb-2 text-sm">Documentos anexados:</p>
                        <div className="flex flex-wrap gap-2">
                          {solicitacao.documentos.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] rounded text-xs hover:bg-[rgb(var(--cor-destaque))]/20 transition"
                            >
                              <Download className="h-3 w-3" />
                              {doc.tipo_display}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge de status */}
                  <div className="ml-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] rounded-lg font-medium text-sm whitespace-nowrap">
                      <Clock className="h-4 w-4" />
                      Aguardando coordenador
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Meus Orientandos */}
      {carregandoTCCs ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-[rgb(var(--cor-icone))] animate-pulse" />
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Carregando orientandos...</h2>
          </div>
        </div>
      ) : tccs.length === 0 ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-md p-12 text-center">
          <Users className="h-16 w-16 text-[rgb(var(--cor-icone))]/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">
            Nenhum orientando encontrado
          </h3>
          <p className="text-[rgb(var(--cor-texto-secundario))]">
            Quando o coordenador aprovar solicitações de orientação, seus orientandos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-[rgb(var(--cor-destaque))]" />
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Meus orientandos ativos</h2>
          </div>
          <div className="space-y-4">
            {tccs.map((tcc) => (
              <div
                key={tcc.id}
                className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">
                      {tcc.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-secundario))] mb-3">
                      <User className="h-4 w-4" />
                      <strong>Aluno:</strong> {tcc.aluno_dados.nome_completo}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="info">
                        {EtapaTCCLabels[tcc.etapa_atual as EtapaTCC]}
                      </Badge>
                      {tcc.flag_continuidade && (
                        <Badge variant="success">Continuidade aprovada</Badge>
                      )}
                      {tcc.flag_liberado_avaliacao && (
                        <Badge variant="success">Liberado para avaliação</Badge>
                      )}
                      {tcc.avaliacao_fase1_bloqueada && (
                        <Badge variant="warning">Avaliação bloqueada</Badge>
                      )}
                    </div>

                    {/* Datas */}
                    <div className="text-xs text-[rgb(var(--cor-texto-secundario))]/70 mb-3">
                      <span>Criado em: {new Date(tcc.criado_em).toLocaleDateString('pt-BR')}</span>
                      <span className="mx-2">•</span>
                      <span>Atualizado em: {new Date(tcc.atualizado_em).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {/* Documentos - Apenas Monografias */}
                    {(() => {
                      const monografias = tcc.documentos?.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA) || []
                      return monografias.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">Monografias:</p>
                          <div className="flex flex-wrap gap-2">
                            {monografias.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--cor-fundo))] rounded text-xs"
                              >
                                <FileText className="h-3 w-3 text-[rgb(var(--cor-icone))]" />
                                <span className="text-[rgb(var(--cor-texto-primario))]">{doc.tipo_documento_display}</span>
                                <span className={`ml-1 ${
                                  doc.status === StatusDocumento.APROVADO ? 'text-[rgb(var(--cor-sucesso))]' :
                                  doc.status === StatusDocumento.REJEITADO ? 'text-[rgb(var(--cor-erro))]' :
                                  'text-[rgb(var(--cor-alerta))]'
                                }`}>
                                  ({doc.status})
                                </span>
                                {doc.arquivo && (
                                  <a
                                    href={doc.arquivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 ml-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-[rgb(var(--cor-texto-secundario))]/70 mt-2">
                            Documentos iniciais disponíveis na página de detalhes
                          </p>
                        </div>
                      ) : null
                    })()}
                  </div>

                  <button
                    onClick={() => handleVerDetalhes(tcc.id)}
                    className="ml-4 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition flex items-center gap-2 whitespace-nowrap"
                  >
                    Ver detalhes
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
