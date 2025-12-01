import { useNavigate } from 'react-router-dom'
import {
  Users,
  ArrowRight,
  User,
  XCircle,
  Award,
  Clock,
  Mail,
  GraduationCap,
  Download
} from 'lucide-react'
import { useCoOrientacoes } from '../../hooks'
import { EtapaTCC } from '../../types'
import { TimelineHorizontalDetalhado } from '../../componentes/TimelineHorizontalDetalhado'
import type { TCC } from '../../types'

export function CoOrientacoesProfessor() {
  const navigate = useNavigate()

  const { tccs, carregando, erro } = useCoOrientacoes()

  // Separar TCCs pendentes (aguardando coordenador) dos aprovados
  const tccsPendentes = tccs.filter(tcc => tcc.etapa_atual === EtapaTCC.INICIALIZACAO)
  const tccsAprovados = tccs.filter(tcc => tcc.etapa_atual !== EtapaTCC.INICIALIZACAO)

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

  const handleVerDetalhes = (tccId: number) => {
    navigate(`/professor/orientacoes/coorientacoes/${tccId}`)
  }

  if (erro) {
    return (
      <div className="p-6">
        <div className="bg-[rgb(var(--cor-erro))]/5 border border-[rgb(var(--cor-erro))]/20 rounded-lg p-4">
          <p className="text-[rgb(var(--cor-erro))] font-medium">Erro ao carregar dados</p>
          <p className="text-[rgb(var(--cor-erro))]/80 text-sm mt-1">{erro}</p>
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
          <h1 className="text-3xl font-bold text-[rgb(var(--cor-texto-primario))]">Minhas co-orientações</h1>
        </div>
        <p className="text-[rgb(var(--cor-texto-secundario))] ml-11">
          Acompanhe os TCCs em que você atua como co-orientador
        </p>
      </div>

      {/* TCCs aguardando aprovação do coordenador (apenas informativo, não clicável) */}
      {!carregando && tccsPendentes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-[rgb(var(--cor-alerta))]" />
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Aguardando aprovação do coordenador</h2>
          </div>
          <div className="space-y-4">
            {tccsPendentes.map((tcc: TCC) => (
              <div
                key={tcc.id}
                className="border border-[rgb(var(--cor-alerta))]/20 rounded-lg p-6 bg-[rgb(var(--cor-alerta))]/5 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-3">
                      {tcc.titulo}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                          <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                          <strong>Aluno:</strong> {tcc.aluno_dados?.nome_completo || 'Não informado'}
                        </div>
                        {tcc.aluno_dados?.email && (
                          <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                            <Mail className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                            <strong>E-mail:</strong> {tcc.aluno_dados.email}
                          </div>
                        )}
                        {tcc.aluno_dados?.curso && (
                          <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                            <GraduationCap className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                            <strong>Curso:</strong> {formatarCurso(tcc.aluno_dados.curso)}
                          </div>
                        )}
                      </div>

                      {tcc.orientador_dados && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[rgb(var(--cor-texto-primario))]">
                            <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                            <strong>Orientador:</strong> {tcc.orientador_dados.nome_completo}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documentos */}
                    {tcc.documentos && tcc.documentos.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[rgb(var(--cor-texto-primario))] font-medium mb-2 text-sm">Documentos anexados:</p>
                        <div className="flex flex-wrap gap-2">
                          {tcc.documentos.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.arquivo || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] rounded text-xs hover:bg-[rgb(var(--cor-destaque))]/20 transition"
                            >
                              <Download className="h-3 w-3" />
                              {doc.tipo_documento_display || doc.tipo_documento}
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
      )}

      {/* Lista de Co-orientações aprovadas */}
      {carregando ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-[rgb(var(--cor-icone))] animate-pulse" />
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Carregando co-orientações...</h2>
          </div>
        </div>
      ) : tccsAprovados.length === 0 && tccsPendentes.length === 0 ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-md p-12 text-center">
          <Users className="h-16 w-16 text-[rgb(var(--cor-icone))]/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">
            Nenhuma co-orientação encontrada
          </h3>
          <p className="text-[rgb(var(--cor-texto-secundario))]">
            Você ainda não possui TCCs como co-orientador.
          </p>
        </div>
      ) : tccsAprovados.length === 0 ? (
        // Tem pendentes mas não tem aprovados
        null
      ) : (
        <div>
          <div className="space-y-4">
            {tccsAprovados.map((tcc: TCC) => (
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
                      {tcc.orientador_dados && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <strong>Orientador:</strong> {tcc.orientador_dados.nome_completo}
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
                    documentos={tcc.documentos}
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
