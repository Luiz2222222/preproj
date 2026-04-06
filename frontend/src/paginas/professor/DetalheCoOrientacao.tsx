/**
 * Página de detalhes de uma co-orientação (somente leitura)
 * Para professores que são co-orientadores
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, FileText, Download, AlertCircle } from 'lucide-react'
import { useTCCProfessorDetalhe, useTimelineTCC, useDocumentosTCC } from '../../hooks'
import { EtapaTCCLabels, EtapaTCC, StatusDocumento, TipoDocumento, CursoLabels } from '../../types'
import { Badge } from '../../componentes/Badge'
import { SkeletonCard, SkeletonList } from '../../componentes/Skeleton'
import { TimelineVerticalDetalhada } from '../../componentes/TimelineVerticalDetalhada'

export function DetalheCoOrientacao() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tccId = id ? parseInt(id, 10) : null

  const baixarArquivo = async (url: string, nomeOriginal: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = nomeOriginal
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      console.error('Erro ao baixar arquivo')
    }
  }

  const { tcc, carregando, erro, naoEncontrado } = useTCCProfessorDetalhe(tccId)
  const { eventos, carregando: carregandoEventos } = useTimelineTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc
  })
  const { documentos, carregando: carregandoDocumentos } = useDocumentosTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc
  })

  // Helpers para separar tipos de documentos
  const documentosMonografia = documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
  const documentosIniciais = documentos.filter(doc =>
    doc.tipo_documento === TipoDocumento.PLANO_DESENVOLVIMENTO ||
    doc.tipo_documento === TipoDocumento.TERMO_ACEITE
  )

  // Monografia mais recente
  const monografiaRecente = documentosMonografia.length > 0
    ? documentosMonografia.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
    : null

  // Status do documento para exibição
  const getStatusBadge = (status: StatusDocumento) => {
    const config: Record<StatusDocumento, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
      [StatusDocumento.PENDENTE]: { label: 'Pendente', variant: 'warning' },
      [StatusDocumento.EM_ANALISE]: { label: 'Em análise', variant: 'warning' },
      [StatusDocumento.APROVADO]: { label: 'Aprovado', variant: 'success' },
      [StatusDocumento.REJEITADO]: { label: 'Rejeitado', variant: 'error' },
    }
    return config[status] || { label: status, variant: 'neutral' }
  }

  // Estado de carregamento
  if (carregando) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // TCC não encontrado
  if (naoEncontrado || !tcc) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[rgb(var(--cor-erro))]/5 border-2 border-[rgb(var(--cor-erro))]/20 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-[rgb(var(--cor-erro))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[rgb(var(--cor-erro))] mb-2">
            TCC não encontrado
          </h2>
          <p className="text-[rgb(var(--cor-erro))] mb-6">
            O TCC solicitado não foi localizado ou você não tem permissão para visualizá-lo.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[rgb(var(--cor-erro))] text-white rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // Erro ao carregar
  if (erro) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[rgb(var(--cor-alerta))]/5 border-2 border-[rgb(var(--cor-alerta))]/20 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-[rgb(var(--cor-alerta))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[rgb(var(--cor-alerta))] mb-2">
            Erro ao carregar
          </h2>
          <p className="text-[rgb(var(--cor-alerta))] mb-6">{erro}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[rgb(var(--cor-alerta))] text-white rounded-lg hover:bg-[rgb(var(--cor-alerta))]/90 transition-colors font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho com Botão Voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-cor-fundo rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5 text-cor-texto" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-cor-texto mb-1">{tcc.titulo}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="success">
              {EtapaTCCLabels[tcc.etapa_atual as EtapaTCC]}
            </Badge>
            <span className="text-sm text-cor-texto opacity-60">Semestre {tcc.semestre}</span>
          </div>
        </div>
      </div>

      {/* Grid de 2 Colunas: Informações + Timeline e Documentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Informações + Timeline */}
        <div className="space-y-6">
          {/* Card de Informações */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4">Informações do TCC</h2>
            <div className="space-y-4">
              {/* Aluno */}
              {tcc.aluno_dados && (
                <div>
                  <p className="text-pequeno text-cor-texto opacity-60 mb-1">Aluno</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-cor-destaque" />
                    <p className="text-medio font-semibold text-cor-texto">
                      {tcc.aluno_dados.nome_completo}
                    </p>
                  </div>
                  {tcc.aluno_dados.email && (
                    <p className="text-pequeno text-cor-texto opacity-60 mt-1">
                      {tcc.aluno_dados.email}
                    </p>
                  )}
                  {tcc.aluno_dados.curso && (
                    <p className="text-pequeno text-cor-texto opacity-60 mt-1">
                      {CursoLabels[tcc.aluno_dados.curso] || tcc.aluno_dados.curso}
                    </p>
                  )}
                </div>
              )}

              {/* Orientador Principal */}
              {tcc.orientador_dados && (
                <div>
                  <p className="text-pequeno text-cor-texto opacity-60 mb-1">Orientador Principal</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-cor-destaque" />
                    <p className="text-medio font-semibold text-cor-texto">
                      {tcc.orientador_dados.nome_completo}
                    </p>
                  </div>
                  {tcc.orientador_dados.email && (
                    <p className="text-pequeno text-cor-texto opacity-60 mt-1">
                      {tcc.orientador_dados.email}
                    </p>
                  )}
                </div>
              )}

              {/* Datas */}
              <div>
                <p className="text-pequeno text-cor-texto opacity-60 mb-1">Criado em</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cor-destaque" />
                  <p className="text-medio text-cor-texto">
                    {new Date(tcc.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Resumo */}
              {tcc.resumo && (
                <div className="pt-4 border-t border-cor-borda">
                  <p className="text-pequeno text-cor-texto opacity-60 mb-1">Resumo</p>
                  <p className="text-medio text-cor-texto">{tcc.resumo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline de Eventos */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cor-destaque" />
              Timeline de Eventos
            </h2>
            {carregandoEventos ? (
              <SkeletonList count={4} />
            ) : (
              <TimelineVerticalDetalhada tcc={tcc} eventos={eventos} carregando={carregandoEventos} />
            )}
          </div>
        </div>

        {/* Coluna Direita: Documentos (somente visualização) */}
        <div className="space-y-6">
          {/* Monografia */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-cor-destaque" />
              Monografia
            </h2>

            {carregandoDocumentos ? (
              <SkeletonList count={2} />
            ) : monografiaRecente ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-cor-fundo rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-cor-destaque" />
                    <div>
                      <p className="text-sm font-medium text-cor-texto">
                        {monografiaRecente.nome_original || 'Monografia'}
                      </p>
                      <p className="text-xs text-cor-texto opacity-60">
                        Versão {monografiaRecente.versao} • {new Date(monografiaRecente.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadge(monografiaRecente.status).variant}>
                      {getStatusBadge(monografiaRecente.status).label}
                    </Badge>
                    {monografiaRecente.arquivo && (
                      <a
                        href={monografiaRecente.arquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-cor-destaque hover:bg-cor-fundo rounded-lg transition-colors"
                        title="Baixar documento"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Feedback do orientador */}
                {monografiaRecente.feedback && (
                  <div className="p-3 bg-[rgb(var(--cor-info))]/5 border border-[rgb(var(--cor-info))]/20 rounded-lg">
                    <p className="text-xs font-medium text-[rgb(var(--cor-info))] mb-1">Parecer do Orientador</p>
                    <p className="text-sm text-cor-texto">{monografiaRecente.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-cor-texto opacity-60 text-center py-4">
                Nenhuma monografia enviada ainda.
              </p>
            )}

            {/* Versões anteriores */}
            {documentosMonografia.length > 1 && (
              <div className="mt-4 pt-4 border-t border-cor-borda">
                <p className="text-xs font-medium text-cor-texto opacity-60 mb-2">Versões anteriores</p>
                <div className="space-y-2">
                  {documentosMonografia
                    .filter(doc => doc.id !== monografiaRecente?.id)
                    .map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-cor-fundo/50 rounded text-sm">
                        <span className="text-cor-texto opacity-60">Versão {doc.versao}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadge(doc.status).variant}>
                            {getStatusBadge(doc.status).label}
                          </Badge>
                          {doc.arquivo && (
                            <a
                              href={doc.arquivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-cor-destaque hover:bg-cor-fundo rounded transition-colors"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Documentos Iniciais */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-cor-destaque" />
              Documentos Iniciais
            </h2>

            {carregandoDocumentos ? (
              <SkeletonList count={2} />
            ) : documentosIniciais.length > 0 ? (
              <div className="space-y-3">
                {documentosIniciais.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-cor-fundo rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-cor-destaque" />
                      <div>
                        <p className="text-sm font-medium text-cor-texto">
                          {doc.tipo_display || doc.nome_original}
                        </p>
                        <p className="text-xs text-cor-texto opacity-60">
                          {new Date(doc.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(doc.status).variant}>
                        {getStatusBadge(doc.status).label}
                      </Badge>
                      {doc.arquivo && (
                        <button
                          onClick={() => baixarArquivo(doc.arquivo!, doc.nome_original || doc.tipo_display)}
                          className="p-2 text-cor-destaque hover:bg-cor-fundo rounded-lg transition-colors"
                          title="Baixar documento"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-cor-texto opacity-60 text-center py-4">
                Nenhum documento inicial enviado ainda.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
