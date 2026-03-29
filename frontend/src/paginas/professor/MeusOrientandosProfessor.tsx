import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  Clock,
  Download,
  ArrowRight,
  User,
  Mail,
  GraduationCap,
  XCircle,
  Award
} from 'lucide-react'
import { useTCCsProfessor, useSolicitacoesPendentesProfessor } from '../../hooks'
import { EtapaTCC, StatusDocumento, TipoDocumento } from '../../types'
import { TimelineHorizontalDetalhado } from '../../componentes/TimelineHorizontalDetalhado'
import type { TCC, DocumentoTCC } from '../../types'

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

  const handleVerDetalhes = (tccId: number) => {
    navigate(`/professor/orientacoes/meus-orientandos/${tccId}`)
  }

  // Helper para formatar nome do curso
  const formatarCurso = (curso?: string | null) => {
    if (!curso) return 'Não informado'
    const texto = curso.toLowerCase().replace(/_/g, ' ')
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  // Helper para obter status final do TCC
  const getStatusFinal = (etapa: EtapaTCC): { tipo: 'aprovado' | 'reprovado' | 'descontinuado' | null; label: string } | null => {
    switch (etapa) {
      case EtapaTCC.CONCLUIDO:
        return { tipo: 'aprovado', label: 'Aprovado' }
      case EtapaTCC.REPROVADO_FASE_1:
        return { tipo: 'reprovado', label: 'Reprovado na Fase I' }
      case EtapaTCC.REPROVADO_FASE_2:
        return { tipo: 'reprovado', label: 'Reprovado na Fase II' }
      case EtapaTCC.DESCONTINUADO:
        return { tipo: 'descontinuado', label: 'Descontinuado' }
      default:
        return null
    }
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
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
          <h1 className="text-3xl font-bold text-[rgb(var(--cor-texto-primario))]">Meus orientandos</h1>
        </div>
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
          <div className="space-y-4">
            {tccs.map((tcc) => (
              <div
                key={tcc.id}
                onClick={() => handleVerDetalhes(tcc.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleVerDetalhes(tcc.id)}
                className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6 cursor-pointer hover:shadow-md hover:border-[rgb(var(--cor-destaque))]/50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:ring-offset-2 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">
                      {tcc.titulo}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[rgb(var(--cor-texto-secundario))]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <strong>Aluno:</strong> {tcc.aluno_dados.nome_completo}
                      </div>
                      {(tcc.coorientador_dados || tcc.coorientador_nome) && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <strong>Co-orientador:</strong> {tcc.coorientador_dados?.nome_completo || tcc.coorientador_nome}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge de status final ou seta */}
                  <div className="ml-4 flex items-center">
                    {(() => {
                      const status = getStatusFinal(tcc.etapa_atual)
                      if (!status) {
                        return (
                          <div className="text-[rgb(var(--cor-destaque))]">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        )
                      }
                      const config = {
                        aprovado: {
                          bg: 'bg-[rgb(var(--cor-sucesso))]/10',
                          text: 'text-[rgb(var(--cor-sucesso))]',
                          border: 'border-[rgb(var(--cor-sucesso))]/20',
                          Icon: Award
                        },
                        reprovado: {
                          bg: 'bg-[rgb(var(--cor-erro))]/10',
                          text: 'text-[rgb(var(--cor-erro))]',
                          border: 'border-[rgb(var(--cor-erro))]/20',
                          Icon: XCircle
                        },
                        descontinuado: {
                          bg: 'bg-[rgb(var(--cor-texto-secundario))]/10',
                          text: 'text-[rgb(var(--cor-texto-secundario))]',
                          border: 'border-[rgb(var(--cor-texto-secundario))]/20',
                          Icon: XCircle
                        }
                      }
                      const c = config[status.tipo!]
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text} border ${c.border}`}>
                          <c.Icon className="h-4 w-4" />
                          {status.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                {/* Timeline horizontal */}
                <div className="mt-4 -mx-6">
                  <TimelineHorizontalDetalhado
                    tcc={tcc}
                    documentos={tcc.documentos as DocumentoTCC[] | undefined}
                    className="rounded-none shadow-none border-t border-[rgb(var(--cor-borda))]"
                  />
                </div>

                {/* Datas */}
                <div className="text-xs text-[rgb(var(--cor-texto-secundario))]/70 -mx-6 -mb-6 px-6 py-3 bg-[rgb(var(--cor-fundo))] border-t border-[rgb(var(--cor-borda))] rounded-b-lg">
                  <span>Criado em: {new Date(tcc.criado_em).toLocaleDateString('pt-BR')}</span>
                  <span className="mx-2">•</span>
                  <span>Atualizado em: {new Date(tcc.atualizado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
