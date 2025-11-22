/**
 * Página de detalhes do TCC - Visão do Coordenador
 * Layout completo baseado no projeto legado
 */

import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  User,
  Download,
  Edit,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Clock,
  FileCheck,
  FileQuestion,
  FileX,
  FilePenLine
} from 'lucide-react'
import { useTCCsCoordenador, useTimelineTCC } from '../../hooks'
import { EtapaTCC, EtapaTCCLabels, EtapaTCCColors, TipoDocumentoLabels } from '../../types/enums'
import type { TCC } from '../../types'
import { TimelineVerticalDetalhada } from '../../componentes/TimelineVerticalDetalhada'
import { FormacaoBancaFase1 } from './components/FormacaoBancaFase1'
import { AnalisarAvaliacoesFase1 } from './components/AnalisarAvaliacoesFase1'
import { AnalisarAvaliacoesFase2 } from './components/AnalisarAvaliacoesFase2'
import { AnaliseFinalCoordenador } from './components/AnaliseFinalCoordenador'
import { formatarDataCurta } from '../../utils/datas'
import { useMemo } from 'react'

export function TCCDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tccs, carregando, erro, recarregar } = useTCCsCoordenador()

  // Encontrar o TCC específico
  const tcc = useMemo(() => {
    return tccs.find(t => t.id === Number(id))
  }, [tccs, id])

  // Carregar eventos da timeline
  const { eventos, carregando: carregandoTimeline } = useTimelineTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc
  })

  // Função para determinar status do TCC
  const getStatus = (tcc: TCC): 'normal' | 'atencao' | 'urgente' => {
    if (tcc.etapa_atual === 'INICIALIZACAO') return 'urgente'
    if (tcc.etapa_atual === 'FORMACAO_BANCA_FASE_1' || tcc.etapa_atual === 'VALIDACAO_FASE_1') return 'atencao'
    return 'normal'
  }

  const getStatusColor = (status: 'normal' | 'atencao' | 'urgente') => {
    switch (status) {
      case 'urgente': return 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] border-[rgb(var(--cor-erro))]/30'
      case 'atencao': return 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/30'
      default: return 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))] border-[rgb(var(--cor-sucesso))]/30'
    }
  }

  const getStatusLabel = (status: 'normal' | 'atencao' | 'urgente') => {
    switch (status) {
      case 'urgente': return 'Urgente'
      case 'atencao': return 'Atenção'
      default: return 'Normal'
    }
  }

  // Ícone do documento por status (StatusDocumento: PENDENTE, EM_ANALISE, APROVADO, REJEITADO)
  const getDocumentoIcon = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <FileCheck className="h-6 w-6 text-[rgb(var(--cor-sucesso))]" />
      case 'REJEITADO':
        return <FileX className="h-6 w-6 text-[rgb(var(--cor-erro))]" />
      case 'EM_ANALISE':
        return <FileQuestion className="h-6 w-6 text-[rgb(var(--cor-alerta))]" />
      case 'PENDENTE':
        return <FilePenLine className="h-6 w-6 text-[rgb(var(--cor-destaque))]" />
      default:
        return <FileText className="h-6 w-6 text-[rgb(var(--cor-icone))]" />
    }
  }

  // Estados de carregamento e erro
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--cor-destaque))] mx-auto mb-4" />
          <p className="text-[rgb(var(--cor-texto-secundario))]">Carregando detalhes do TCC...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-[rgb(var(--cor-erro))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">Erro ao carregar TCC</h3>
          <p className="text-[rgb(var(--cor-texto-secundario))] mb-4">{erro}</p>
          <button
            onClick={() => navigate('/tccs')}
            className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  if (!tcc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-[rgb(var(--cor-alerta))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">TCC não encontrado</h3>
          <p className="text-[rgb(var(--cor-texto-secundario))] mb-4">O TCC solicitado não foi encontrado.</p>
          <button
            onClick={() => navigate('/tccs')}
            className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  const status = getStatus(tcc)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header com navegação */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/tccs')}
          className="flex items-center gap-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista de TCCs
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">{tcc.titulo}</h1>
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${EtapaTCCColors[tcc.etapa_atual]}`}>
                {EtapaTCCLabels[tcc.etapa_atual]}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                {status === 'urgente' && <AlertCircle className="h-3 w-3 mr-1" />}
                {status === 'atencao' && <Clock className="h-3 w-3 mr-1" />}
                {status === 'normal' && <CheckCircle className="h-3 w-3 mr-1" />}
                {getStatusLabel(status)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-destaque))] hover:bg-[rgb(var(--cor-destaque))]/5 rounded-lg transition-colors flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </button>
            <button className="px-4 py-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-destaque))] hover:bg-[rgb(var(--cor-destaque))]/5 rounded-lg transition-colors flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Enviar Mensagem
            </button>
            <button className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white hover:bg-[rgb(var(--cor-destaque))]/90 rounded-lg transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Informações Gerais - Topo - Grid de 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Informações do Aluno */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
            Informações do Aluno
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Nome</p>
              <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{tcc.aluno_dados?.nome_completo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">E-mail</p>
              <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{tcc.aluno_dados?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Curso</p>
              <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{tcc.aluno_dados?.curso || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Informações da Orientação */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
            Orientação
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Orientador</p>
              <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{tcc.orientador_dados?.nome_completo || 'N/A'}</p>
              {tcc.orientador_dados?.email && (
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{tcc.orientador_dados.email}</p>
              )}
            </div>
            {(tcc.coorientador_dados || tcc.coorientador_nome) && (
              <div>
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Co-orientador</p>
                <p className="font-medium text-[rgb(var(--cor-texto-primario))]">
                  {tcc.coorientador_dados?.nome_completo || tcc.coorientador_nome}
                </p>
                {tcc.coorientador_dados?.email && (
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{tcc.coorientador_dados.email}</p>
                )}
                {!tcc.coorientador_dados && tcc.coorientador_afiliacao && (
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{tcc.coorientador_afiliacao}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Descrição do Trabalho */}
        {tcc.resumo && (
          <div className="lg:col-span-2 bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Descrição do Trabalho</h3>
            <p className="text-[rgb(var(--cor-texto-primario))]">{tcc.resumo}</p>
          </div>
        )}
      </div>

      {/* Formação da Banca da Fase I */}
      {tcc.etapa_atual === EtapaTCC.FORMACAO_BANCA_FASE_1 && (
        <FormacaoBancaFase1 tcc={tcc} />
      )}

      {/* Análise das Avaliações da Fase I */}
      {(tcc.etapa_atual === EtapaTCC.AVALIACAO_FASE_1 || tcc.etapa_atual === EtapaTCC.VALIDACAO_FASE_1) && (
        <AnalisarAvaliacoesFase1 tcc={tcc} />
      )}

      {/* Análise das Avaliações da Fase II */}
      {(tcc.etapa_atual === EtapaTCC.APRESENTACAO_FASE_2 || tcc.etapa_atual === EtapaTCC.ANALISE_FINAL_COORDENADOR) && (
        <AnalisarAvaliacoesFase2 tcc={tcc} onAvaliacoesAtualizadas={recarregar} />
      )}

      {/* Análise Final e Conclusão - só aparece quando todas avaliações bloqueadas */}
      {tcc.etapa_atual === EtapaTCC.ANALISE_FINAL_COORDENADOR && tcc.avaliacao_fase2_bloqueada && (
        <AnaliseFinalCoordenador tcc={tcc} onConclusao={recarregar} />
      )}

      {/* Seção Inferior - Timeline à esquerda (2 cols), Documentos e Prazos à direita (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Vertical - Esquerda (2 colunas de largura) */}
        <div className="lg:col-span-2 bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <TimelineVerticalDetalhada
            tcc={tcc}
            eventos={eventos}
            carregando={carregandoTimeline}
          />
        </div>

        {/* Documentos e Avaliações - Direita (1 coluna de largura) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Documentos */}
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
              Documentos do TCC
            </h3>
            {tcc.documentos && tcc.documentos.length > 0 ? (
              <div className="space-y-3">
                {tcc.documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-[rgb(var(--cor-borda))] rounded-lg hover:bg-[rgb(var(--cor-fundo))]/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {getDocumentoIcon(doc.status)}
                      <div>
                        <p className="font-medium text-[rgb(var(--cor-texto-primario))] text-sm">
                          {TipoDocumentoLabels[doc.tipo_documento]}
                        </p>
                        <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">
                          {formatarDataCurta(doc.criado_em)} • v{doc.versao}
                        </p>
                      </div>
                    </div>
                    {doc.arquivo && (
                      <a
                        href={doc.arquivo}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-[rgb(var(--cor-destaque))] hover:bg-[rgb(var(--cor-destaque))]/5 rounded-lg transition"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-10 w-10 text-[rgb(var(--cor-icone))]/60 mx-auto mb-2" />
                <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Nenhum documento enviado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
