/**
 * Página de detalhes de um orientando específico (Professor)
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, FileText, Download, AlertCircle, CheckCircle, XCircle, Upload, Presentation } from 'lucide-react'
import { useTCCProfessorDetalhe, useTimelineTCC, useDocumentosTCC, useAcoesProfessor, useAvaliacoesFase2 } from '../../hooks'
import { EtapaTCCLabels, EtapaTCC, StatusDocumento, TipoDocumento, CursoLabels } from '../../types'
import FormAgendamentoDefesa from './components/FormAgendamentoDefesa'
import { Badge } from '../../componentes/Badge'
import { SkeletonCard, SkeletonList } from '../../componentes/Skeleton'
import { TimelineVerticalDetalhada } from '../../componentes/TimelineVerticalDetalhada'
import { AlertaPrazo } from '../../componentes/AlertaPrazo'
import { useToast } from '../../contextos/ToastProvider'
import { extrairMensagemErro } from '../../servicos/api'
import { estaBloqueado, mensagensBloqueio } from '../../utils/permissoes'
import type { DocumentoTCC, EnviarAvaliacaoFase2DTO } from '../../types'
import { FormularioAvaliacaoFase2 } from '../../componentes/FormularioAvaliacaoFase2'
import { StatusAvaliacaoFase2 } from '../../types/enums'
import { useAutenticacao } from '../../autenticacao'

export function DetalheOrientandoProfessor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tccId = id ? parseInt(id, 10) : null
  const { sucesso, erro: toastErro } = useToast()
  const { usuario } = useAutenticacao()

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
      toastErro('Erro ao baixar arquivo')
    }
  }

  const { tcc, carregando, erro, naoEncontrado, recarregar } = useTCCProfessorDetalhe(tccId)
  const { eventos, carregando: carregandoEventos, recarregar: recarregarEventos } = useTimelineTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc
  })
  const { documentos, carregando: carregandoDocumentos, recarregar: recarregarDocumentos } = useDocumentosTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc
  })
  const {
    avaliarDocumento,
    avaliando,
    confirmarContinuidade,
    confirmandoContinuidade,
    rejeitarContinuidade,
    rejeitandoContinuidade,
    enviarTermoAvaliacao,
    enviandoTermo
  } = useAcoesProfessor()

  const [showModalAvaliar, setShowModalAvaliar] = useState(false)
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoTCC | null>(null)
  const [parecer, setParecer] = useState('')
  const [tipoAvaliacao, setTipoAvaliacao] = useState<'APROVADO' | 'REJEITADO'>('APROVADO')
  const [arquivoTermo, setArquivoTermo] = useState<File | null>(null)

  // Estados para Avaliação Fase 2
  const [mostrarAvaliacaoFase2, setMostrarAvaliacaoFase2] = useState(false)
  const [mensagemSucessoFase2, setMensagemSucessoFase2] = useState<string | null>(null)

  // Hook para Fase II
  const {
    avaliacoes: avaliacoesFase2,
    carregando: carregandoFase2,
    enviar: enviarFase2,
    processando: processandoFase2,
    recarregar: recarregarFase2
  } = useAvaliacoesFase2({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc
  })

  const minhaAvaliacaoFase2 = avaliacoesFase2.find(av => av.avaliador === usuario?.id) || null

  const handleAbrirModalAvaliar = (doc: DocumentoTCC, tipo: 'APROVADO' | 'REJEITADO') => {
    setDocumentoSelecionado(doc)
    setTipoAvaliacao(tipo)
    setParecer('')
    setShowModalAvaliar(true)
  }

  const handleAvaliar = async () => {
    if (!documentoSelecionado) return

    try {
      await avaliarDocumento({
        documentoId: documentoSelecionado.id,
        status: tipoAvaliacao,
        parecer: parecer.trim() || undefined
      })

      sucesso(`Documento ${tipoAvaliacao === 'APROVADO' ? 'aprovado' : 'rejeitado'} com sucesso!`)
      setShowModalAvaliar(false)
      setDocumentoSelecionado(null)
      setParecer('')
      await recarregarDocumentos()
      await recarregar()
      await recarregarEventos()
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
  }

  // Helpers para separar tipos de documentos
  const documentosMonografia = documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
  const documentosIniciais = documentos.filter(doc =>
    doc.tipo_documento === TipoDocumento.PLANO_DESENVOLVIMENTO ||
    doc.tipo_documento === TipoDocumento.TERMO_ACEITE
  )
  const documentosTermo = documentos.filter(doc => doc.tipo_documento === TipoDocumento.TERMO_SOLICITACAO_AVALIACAO)

  // Monografia mais recente
  const monografiaRecente = documentosMonografia.length > 0
    ? documentosMonografia.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
    : null

  // Validações para continuidade e termo
  const monografiaAprovada = monografiaRecente?.status === StatusDocumento.APROVADO
  const continuidadeConfirmada = tcc?.flag_continuidade || false
  const avaliacaoLiberada = tcc?.flag_liberado_avaliacao || false

  // Verificar permissões de prazo
  const permiteConfirmarContinuidade = !estaBloqueado(tcc?.permissoes, 'pode_confirmar_continuidade')
  const permiteSolicitarAvaliacao = !estaBloqueado(tcc?.permissoes, 'pode_solicitar_avaliacao')
  const permiteAvaliarMonografia = !estaBloqueado(tcc?.permissoes, 'pode_enviar_monografia') // Quando aluno não pode enviar, professor não pode avaliar novas

  const podeEnviarTermo = continuidadeConfirmada && !avaliacaoLiberada && tcc?.etapa_atual === EtapaTCC.DESENVOLVIMENTO && permiteSolicitarAvaliacao

  // Handlers para continuidade e termo
  const handleConfirmarContinuidade = async () => {
    if (!tcc) return

    try {
      await confirmarContinuidade(tcc.id)
      sucesso('Continuidade confirmada com sucesso!')
      await recarregar()
      await recarregarDocumentos()
      await recarregarEventos()
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
  }

  const handleRejeitarContinuidade = async () => {
    if (!tcc) return

    try {
      await rejeitarContinuidade(tcc.id)
      sucesso('Continuidade rejeitada. O TCC foi descontinuado.')
      await recarregar()
      await recarregarDocumentos()
      await recarregarEventos()
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
  }

  const handleSolicitarAvaliacao = async () => {
    if (!tcc || !arquivoTermo) return

    try {
      await enviarTermoAvaliacao(tcc.id, arquivoTermo)
      sucesso('Termo de avaliação enviado com sucesso!')
      setArquivoTermo(null)
      await recarregar()
      await recarregarDocumentos()
      await recarregarEventos()
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
  }

  const handleArquivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo PDF
    if (file.type !== 'application/pdf') {
      toastErro('Por favor, selecione um arquivo PDF')
      event.target.value = ''
      return
    }

    // Validar tamanho máximo (10MB)
    const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSizeInBytes) {
      toastErro('O arquivo deve ter no máximo 10MB')
      event.target.value = ''
      return
    }

    setArquivoTermo(file)
  }

  // Handlers para Fase II
  const handleSalvarRascunhoFase2 = async (dados: EnviarAvaliacaoFase2DTO) => {
    try {
      setMensagemSucessoFase2(null)
      await enviarFase2(dados)
      setMensagemSucessoFase2('Rascunho salvo com sucesso!')
      await recarregarFase2()
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
  }

  const handleEnviarAvaliacaoFase2 = async (dados: EnviarAvaliacaoFase2DTO) => {
    try {
      setMensagemSucessoFase2(null)
      await enviarFase2(dados)
      setMensagemSucessoFase2('Avaliação enviada com sucesso!')
      sucesso('Avaliação da Fase II enviada com sucesso!')
      await recarregarFase2()
      setMostrarAvaliacaoFase2(false)
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
  }

  const handleCancelarEnvioFase2 = async () => {
    if (!minhaAvaliacaoFase2) return

    try {
      setMensagemSucessoFase2(null)
      await enviarFase2({
        nota_coerencia_conteudo: minhaAvaliacaoFase2.nota_coerencia_conteudo ?? undefined,
        nota_qualidade_apresentacao: minhaAvaliacaoFase2.nota_qualidade_apresentacao ?? undefined,
        nota_dominio_tema: minhaAvaliacaoFase2.nota_dominio_tema ?? undefined,
        nota_clareza_fluencia: minhaAvaliacaoFase2.nota_clareza_fluencia ?? undefined,
        nota_observancia_tempo: minhaAvaliacaoFase2.nota_observancia_tempo ?? undefined,
        parecer: minhaAvaliacaoFase2.parecer || undefined,
        status: StatusAvaliacaoFase2.PENDENTE
      })
      setMensagemSucessoFase2('Avaliação reaberta para edição.')
      await recarregarFase2()
    } catch (err) {
      toastErro(extrairMensagemErro(err))
    }
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
          <h1 className="text-2xl font-bold text-cor-texto">{tcc.titulo}</h1>
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
          {/* Card de Informações do Orientando */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4">Informações do Orientando</h2>
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

              {/* Coorientador (se houver) */}
              {tcc.coorientador_nome && (
                <div>
                  <p className="text-pequeno text-cor-texto opacity-60 mb-1">Coorientador Externo</p>
                  <p className="text-medio text-cor-texto">{tcc.coorientador_nome}</p>
                  {tcc.coorientador_titulacao && (
                    <p className="text-pequeno text-cor-texto opacity-60">
                      {tcc.coorientador_titulacao}
                      {tcc.coorientador_afiliacao && ` - ${tcc.coorientador_afiliacao}`}
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

        {/* Documentos: Monografias e Iniciais (empilhados verticalmente) */}
        <div className="space-y-6">
          {/* Card de Agendamento de Defesa - só aparece quando TCC está em AGENDAMENTO_APRESENTACAO */}
          {tcc.etapa_atual === EtapaTCC.AGENDAMENTO_APRESENTACAO && (
            <FormAgendamentoDefesa
              tccId={tcc.id}
              onSucesso={async () => {
                await recarregar()
              }}
            />
          )}

          {/* Card de Avaliação Fase II - aparece quando TCC está em APRESENTACAO_FASE_2 ou depois */}
          {(tcc.etapa_atual === EtapaTCC.APRESENTACAO_FASE_2 ||
            tcc.etapa_atual === EtapaTCC.ANALISE_FINAL_COORDENADOR ||
            tcc.etapa_atual === EtapaTCC.AGUARDANDO_AJUSTES_FINAIS) && (
            <div className="bg-cor-superficie rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-cor-texto flex items-center gap-2">
                  <Presentation className="h-5 w-5 text-cor-destaque" />
                  Avaliação - Fase II (Apresentação)
                </h2>
                {minhaAvaliacaoFase2 && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      minhaAvaliacaoFase2.status === StatusAvaliacaoFase2.ENVIADO
                        ? 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))]'
                        : minhaAvaliacaoFase2.status === StatusAvaliacaoFase2.CONCLUIDO
                        ? 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]'
                        : minhaAvaliacaoFase2.status === StatusAvaliacaoFase2.BLOQUEADO
                        ? 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))]'
                        : 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]'
                    }`}
                  >
                    {minhaAvaliacaoFase2.status === StatusAvaliacaoFase2.ENVIADO
                      ? 'Enviada'
                      : minhaAvaliacaoFase2.status === StatusAvaliacaoFase2.CONCLUIDO
                      ? 'Concluída'
                      : minhaAvaliacaoFase2.status === StatusAvaliacaoFase2.BLOQUEADO
                      ? 'Bloqueada'
                      : 'Rascunho'}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-cor-texto opacity-75">
                  Avalie a apresentação do seu orientando preenchendo as notas dos critérios da Fase II.
                </p>
              </div>

              {!mostrarAvaliacaoFase2 ? (
                <button
                  onClick={() => setMostrarAvaliacaoFase2(true)}
                  disabled={carregandoFase2}
                  className="w-full px-4 py-3 bg-[rgb(var(--cor-info))] text-white rounded-lg hover:bg-[rgb(var(--cor-info))]/90 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Presentation className="h-5 w-5" />
                  {minhaAvaliacaoFase2 ? 'Ver/Editar Avaliação' : 'Iniciar Avaliação'}
                </button>
              ) : (
                <div className="space-y-4">
                  <FormularioAvaliacaoFase2
                    minhaAvaliacao={minhaAvaliacaoFase2}
                    processando={processandoFase2}
                    mensagemSucesso={mensagemSucessoFase2}
                    onSalvarRascunho={handleSalvarRascunhoFase2}
                    onEnviarAvaliacao={handleEnviarAvaliacaoFase2}
                    onCancelarEnvio={handleCancelarEnvioFase2}
                  />
                  <button
                    onClick={() => setMostrarAvaliacaoFase2(false)}
                    className="w-full px-4 py-2 border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors text-cor-texto font-medium"
                  >
                    Fechar Formulário
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card de Termo de Solicitação de Avaliação - aparece quando monografia aprovada E continuidade confirmada */}
          {monografiaAprovada && continuidadeConfirmada && (
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-cor-destaque" />
              Termo de Solicitação de Avaliação
            </h2>

            {/* Status Atual */}
            <div className="mb-4">
              <p className="text-sm text-cor-texto opacity-75 mb-2">Status:</p>
              <div className="flex items-center gap-2">
                {avaliacaoLiberada ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-[rgb(var(--cor-sucesso))]" />
                    <span className="text-sm font-medium text-[rgb(var(--cor-sucesso))]">Termo Enviado - Avaliação Liberada</span>
                  </>
                ) : continuidadeConfirmada ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-alerta))]" />
                    <span className="text-sm font-medium text-[rgb(var(--cor-alerta))]">Aguardando Envio do Termo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
                    <span className="text-sm text-cor-texto opacity-60">Confirmação de continuidade necessária</span>
                  </>
                )}
              </div>
            </div>

            {/* Informações - só mostra se avaliação ainda não foi liberada */}
            {!avaliacaoLiberada && (
              <div className="bg-cor-fundo p-3 rounded-lg mb-4">
                <p className="text-xs text-cor-texto opacity-75">
                  {continuidadeConfirmada
                    ? 'Envie o termo de solicitação de avaliação para liberar o TCC para a fase de avaliação.'
                    : 'Confirme a continuidade do orientando antes de enviar o termo.'}
                </p>
              </div>
            )}

            {/* Documento enviado ou upload inline */}
            {avaliacaoLiberada && documentosTermo.length > 0 ? (
              <div className="space-y-2">
                {documentosTermo.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cor-texto truncate">
                        {doc.nome_original}
                      </p>
                      <p className="text-xs text-cor-texto opacity-60 mt-1">
                        Enviado em {new Date(doc.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {doc.arquivo && (
                      <a
                        href={doc.arquivo}
                        download
                        className="ml-3 p-2 text-cor-destaque hover:bg-cor-fundo rounded transition-colors"
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : podeEnviarTermo && (
              <div className="space-y-3">
                {/* Campo de upload inline */}
                <div className="border-2 border-dashed border-cor-borda rounded-lg p-4 hover:border-cor-destaque transition-colors">
                  <input
                    type="file"
                    id="termo-upload"
                    accept=".pdf"
                    onChange={handleArquivoChange}
                    className="hidden"
                    disabled={enviandoTermo}
                  />
                  <label
                    htmlFor="termo-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-cor-texto opacity-40 mb-2" />
                    <p className="text-sm font-medium text-cor-texto mb-1 w-full max-w-full px-4 text-center truncate">
                      {arquivoTermo ? arquivoTermo.name : 'Clique para selecionar o arquivo PDF'}
                    </p>
                    <p className="text-xs text-cor-texto opacity-60">
                      {arquivoTermo ? `${(arquivoTermo.size / 1024 / 1024).toFixed(2)} MB` : 'Apenas arquivos PDF (máx. 10MB)'}
                    </p>
                  </label>
                </div>

                {/* Botão Solicitar Avaliação ou Alerta */}
                {permiteSolicitarAvaliacao ? (
                  <button
                    onClick={handleSolicitarAvaliacao}
                    disabled={!arquivoTermo || enviandoTermo}
                    className="w-full px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {enviandoTermo ? 'Enviando...' : 'Solicitar Avaliação'}
                  </button>
                ) : (
                  <AlertaPrazo mensagem={mensagensBloqueio.avaliacaoMonografia} variant="warning" />
                )}
              </div>
            )}

            {/* Alerta se termo necessário mas prazo bloqueado */}
            {continuidadeConfirmada && !avaliacaoLiberada && !podeEnviarTermo && !permiteSolicitarAvaliacao && (
              <AlertaPrazo mensagem={mensagensBloqueio.avaliacaoMonografia} variant="warning" />
            )}
          </div>
          )}

          {/* Card de Confirmação de Continuidade - aparece em DESENVOLVIMENTO quando permitido ou já confirmado */}
          {tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO && (permiteConfirmarContinuidade || continuidadeConfirmada) && (
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-cor-destaque" />
              Confirmação de Continuidade
            </h2>

            {/* Status Atual */}
            <div className="mb-4">
              <p className="text-sm text-cor-texto opacity-75 mb-2">Status:</p>
              <div className="flex items-center gap-2">
                {continuidadeConfirmada ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-[rgb(var(--cor-sucesso))]" />
                    <span className="text-sm font-medium text-[rgb(var(--cor-sucesso))]">Continuidade Confirmada</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-alerta))]" />
                    <span className="text-sm font-medium text-[rgb(var(--cor-alerta))]">Aguardando Confirmação</span>
                  </>
                )}
              </div>
            </div>

            {/* Botões de Confirmar e Rejeitar */}
            {!continuidadeConfirmada && (
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmarContinuidade}
                  disabled={confirmandoContinuidade || rejeitandoContinuidade}
                  className="flex-1 px-4 py-2 bg-[rgb(var(--cor-sucesso))] text-white rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {confirmandoContinuidade ? 'Confirmando...' : 'Confirmar Continuidade'}
                </button>
                <button
                  onClick={handleRejeitarContinuidade}
                  disabled={confirmandoContinuidade || rejeitandoContinuidade}
                  className="flex-1 px-4 py-2 bg-[rgb(var(--cor-erro))] text-white rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {rejeitandoContinuidade ? 'Rejeitando...' : 'Rejeitar Continuidade'}
                </button>
              </div>
            )}
          </div>
          )}

          {/* Monografias */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-cor-destaque" />
              Monografias Enviadas
            </h2>

            {/* Alerta de prazo expirado */}
            {!permiteAvaliarMonografia && (
              <div className="mb-4">
                <AlertaPrazo mensagem={mensagensBloqueio.monografia} variant="warning" />
              </div>
            )}

            {carregandoDocumentos ? (
              <SkeletonList count={3} />
            ) : documentosMonografia.length > 0 ? (
              <div className="space-y-3">
                {documentosMonografia.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-cor-borda rounded-lg hover:bg-cor-fundo/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cor-texto truncate">
                        {doc.nome_original}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-cor-texto opacity-60">
                          {doc.tipo_display}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            doc.status === StatusDocumento.APROVADO
                              ? 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]'
                              : doc.status === StatusDocumento.REJEITADO
                              ? 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))]'
                              : doc.status === StatusDocumento.PENDENTE
                              ? 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]'
                              : 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))]'
                          }`}
                        >
                          {doc.status_display}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {doc.arquivo && (
                        <button
                          onClick={() => baixarArquivo(doc.arquivo!, doc.nome_original)}
                          className="p-2 text-cor-destaque hover:bg-cor-fundo rounded transition-colors"
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {/* Botões de Avaliação (apenas para documentos pendentes E dentro do prazo) */}
                      {doc.status === StatusDocumento.PENDENTE && permiteAvaliarMonografia && (
                        <>
                          <button
                            onClick={() => handleAbrirModalAvaliar(doc, 'APROVADO')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[rgb(var(--cor-sucesso))] text-white text-xs rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 transition-colors font-medium"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleAbrirModalAvaliar(doc, 'REJEITADO')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[rgb(var(--cor-erro))] text-white text-xs rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors font-medium"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Ajustes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-cor-texto opacity-75 text-center py-8">
                Nenhuma monografia enviada ainda.
              </p>
            )}
          </div>

          {/* Documentos Iniciais */}
          <div className="bg-cor-superficie rounded-lg p-6 shadow">
            <h2 className="font-semibold text-cor-texto mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
              Documentos Iniciais
            </h2>
            {carregandoDocumentos ? (
              <SkeletonList count={2} />
            ) : documentosIniciais.length > 0 ? (
              <div className="space-y-2">
                {documentosIniciais.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cor-texto truncate">
                        {doc.nome_original}
                      </p>
                      <p className="text-xs text-cor-texto opacity-60 mt-1">{doc.tipo_display}</p>
                    </div>
                    {doc.arquivo && (
                      <a
                        href={doc.arquivo}
                        download
                        className="ml-3 p-2 text-cor-destaque hover:bg-cor-fundo rounded transition-colors"
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-cor-texto opacity-75 text-center py-8">
                Nenhum documento inicial.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Avaliação de Documento */}
      {showModalAvaliar && documentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-cor-superficie rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              {tipoAvaliacao === 'APROVADO' ? (
                <CheckCircle className="h-6 w-6 text-[rgb(var(--cor-sucesso))]" />
              ) : (
                <XCircle className="h-6 w-6 text-[rgb(var(--cor-erro))]" />
              )}
              <h3 className="text-lg font-semibold text-cor-texto">
                {tipoAvaliacao === 'APROVADO' ? 'Aprovar Documento' : 'Solicitar Ajustes'}
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-cor-texto opacity-75 mb-2">Documento:</p>
              <p className="text-sm font-medium text-cor-texto">{documentoSelecionado.nome_original}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-cor-texto mb-2">
                Mensagem:
              </label>
              <textarea
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                className="w-full px-3 py-2 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque bg-cor-fundo text-cor-texto"
                rows={4}
                placeholder="Escreva uma mensagem (opcional)"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModalAvaliar(false)
                  setDocumentoSelecionado(null)
                  setParecer('')
                }}
                disabled={avaliando}
                className="px-4 py-2 border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors disabled:opacity-50 text-cor-texto"
              >
                Cancelar
              </button>
              <button
                onClick={handleAvaliar}
                disabled={avaliando}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-white ${
                  tipoAvaliacao === 'APROVADO'
                    ? 'bg-[rgb(var(--cor-sucesso))] hover:bg-[rgb(var(--cor-sucesso))]/90'
                    : 'bg-[rgb(var(--cor-erro))] hover:bg-[rgb(var(--cor-erro))]/90'
                }`}
              >
                {avaliando ? 'Processando...' : tipoAvaliacao === 'APROVADO' ? 'Aprovar' : 'Solicitar Ajustes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
