/**
 * Página "Meu TCC" do aluno
 * Exibe detalhes do TCC, timeline e ações
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMeuTCC, useTimelineTCC, useSolicitacoesAluno, useDocumentosTCC, useCalendarioSemestre } from '../../hooks'
import { FileText, User, AlertTriangle, LayoutList, LayoutDashboard, Clock, XCircle, X, Upload } from 'lucide-react'
import { EtapaTCCLabels, EtapaTCC, TipoDocumento, StatusDocumento } from '../../types'
import { extrairMensagemErro } from '../../servicos/api'
import { Badge } from '../../componentes/Badge'
import { SkeletonCard, SkeletonList } from '../../componentes/Skeleton'
import { useToast } from '../../contextos/ToastProvider'
import { CardStatus } from '../../componentes/CardStatus'
import { TimelineHorizontalDetalhado, ModalEnviarDocumento } from '../../componentes'
import { TimelineVerticalDetalhada } from '../../componentes/TimelineVerticalDetalhada'
import { AlertaPrazo } from '../../componentes/AlertaPrazo'
import { estaBloqueado, mensagensBloqueio, prazoExpirado } from '../../utils/permissoes'

export function MeuTCC() {
  const navigate = useNavigate()
  const { sucesso, erro: toastErro } = useToast()
  const { tcc, recusa, carregando, recarregar } = useMeuTCC()
  const { calendario } = useCalendarioSemestre()
  const { eventos, carregando: carregandoEventos } = useTimelineTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc,
  })
  const { enviarDocumento, enviando } = useDocumentosTCC({
    tccId: tcc?.id || null,
    autoCarregar: false
  })
  const { cancelarSolicitacao, cancelando } = useSolicitacoesAluno()
  const [showModalCancelar, setShowModalCancelar] = useState(false)
  const [showModalEnviar, setShowModalEnviar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [modoTimeline, setModoTimeline] = useState<'horizontal' | 'vertical'>('vertical')
  const [mostrarRecusa, setMostrarRecusa] = useState(true)

  const handleCancelar = async () => {
    if (!tcc || !tcc.solicitacao_pendente_id) return

    try {
      setErro(null)
      await cancelarSolicitacao(tcc.solicitacao_pendente_id)
      await recarregar()
      sucesso('Solicitação cancelada com sucesso')
      setShowModalCancelar(false)
      navigate('/aluno')
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      setErro(mensagem)
      toastErro(mensagem)
    }
  }

  const handleEnviarDocumento = async (tipo: TipoDocumento, arquivo: File) => {
    try {
      await enviarDocumento(tipo, arquivo)
      setShowModalEnviar(false)
      await recarregar()
      sucesso('Documento enviado com sucesso!')
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      toastErro(mensagem)
      throw err
    }
  }

  if (carregando) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonList count={3} />
      </div>
    )
  }

  const foiRecusado = Boolean(recusa)

  if (!tcc || foiRecusado) {
    // Verificar prazo de cadastro quando não tem TCC
    const prazoCadastroExpirado = prazoExpirado(calendario?.envio_documentos_fim)

    return (
      <div className="space-y-6">
        {/* Card de Recusa */}
        {foiRecusado && mostrarRecusa && recusa && (
          <div className="bg-[rgb(var(--cor-erro))]/10 border-2 border-[rgb(var(--cor-erro))]/40 rounded-lg p-5 shadow-sm relative">
            <button
              onClick={() => setMostrarRecusa(false)}
              className="absolute top-3 right-3 text-[rgb(var(--cor-erro))] hover:text-[rgb(var(--cor-erro))]/80 transition-colors"
              aria-label="Fechar aviso"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-1">
                  Solicitação recusada
                </h3>
                <p className="text-pequeno text-[rgb(var(--cor-texto-medio))] mb-3">
                  Sua solicitação de orientação foi recusada pela coordenação em{' '}
                  {(() => {
                    const data = new Date(recusa.recusado_em)
                    const dataStr = data.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                    const horaStr = data.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    return `${dataStr} ${horaStr}`
                  })()}
                </p>
                {recusa.parecer && (
                  <div className="bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-erro))]/30 rounded p-3">
                    <p className="text-medio text-[rgb(var(--cor-texto-medio))]">{recusa.parecer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alerta de prazo expirado */}
        {prazoCadastroExpirado && (
          <AlertaPrazo
            mensagem="Período de envio de documentos encerrado. Solicite ao coordenador a liberação manual para iniciar seu TCC."
            variant="warning"
          />
        )}

        {/* Bloco "Você ainda não iniciou seu TCC" */}
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-cor-texto opacity-30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-cor-texto mb-2">
            Você ainda não iniciou seu TCC
          </h2>
          <p className="text-cor-texto opacity-75 mb-6">
            {prazoCadastroExpirado
              ? 'O prazo para iniciar o TCC expirou'
              : 'Clique no botão abaixo para começar'
            }
          </p>
          <button
            onClick={() => navigate('/aluno/iniciar-tcc')}
            disabled={prazoCadastroExpirado}
            className="px-6 py-3 bg-cor-destaque text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar TCC
          </button>
        </div>
      </div>
    )
  }

  const estaPendente = tcc.etapa_atual === EtapaTCC.INICIALIZACAO && !tcc.orientador

  // Função auxiliar para buscar a última monografia (ordenada por criado_em)
  const getUltimaMonografia = () => {
    if (!tcc?.documentos) return null
    const monografias = tcc.documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
    if (monografias.length === 0) return null
    // Ordenar por criado_em (mais recente primeiro)
    return monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
  }

  const ultimaMonografia = getUltimaMonografia()

  // Calcular se pode enviar monografia
  const necessitaEnvioMonografia =
    tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO &&
    (!ultimaMonografia || ultimaMonografia.status === StatusDocumento.REJEITADO)

  const permiteEnvioMonografia = !estaBloqueado(tcc.permissoes, 'pode_enviar_monografia')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Alerta de Monografia Rejeitada */}
      {ultimaMonografia?.status === StatusDocumento.REJEITADO && (
        <div className="bg-[rgb(var(--cor-erro))]/10 border-2 border-[rgb(var(--cor-erro))]/40 rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-[rgb(var(--cor-erro))] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-1">
                Ajustes solicitados pelo orientador
              </h3>
              <p className="text-pequeno text-[rgb(var(--cor-texto-medio))]">
                Sua monografia foi analisada e necessita de correções antes de prosseguir.{ultimaMonografia.feedback && ' Mensagem do orientador:'}
              </p>
              {ultimaMonografia.feedback && (
                <div className="bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-erro))]/30 rounded p-3 mt-2">
                  <p className="text-medio text-[rgb(var(--cor-texto-medio))]">{ultimaMonografia.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cor-texto mb-2">{tcc.titulo}</h1>
          <div className="flex items-center gap-3 text-medio">
            <Badge variant="success">
              {EtapaTCCLabels[tcc.etapa_atual as EtapaTCC]}
            </Badge>
            <span className="text-cor-texto opacity-60">Semestre {tcc.semestre}</span>
          </div>
        </div>
        {necessitaEnvioMonografia && (
          <div>
            {permiteEnvioMonografia ? (
              <button
                onClick={() => setShowModalEnviar(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cor-destaque text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                <Upload className="h-4 w-4" />
                Enviar TCC
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Alerta de prazo bloqueado */}
      {necessitaEnvioMonografia && !permiteEnvioMonografia && (
        <AlertaPrazo
          mensagem={mensagensBloqueio.monografia}
          variant="warning"
        />
      )}

      {/* Alerta se pendente */}
      {estaPendente && (
        <CardStatus
          variant="warning"
          icone={Clock}
          titulo="Aguardando aprovação do coordenador"
          descricao="Sua solicitação de orientação foi enviada ao coordenador. Aguarde a aprovação para continuar."
          acao={
            <button
              onClick={() => setShowModalCancelar(true)}
              disabled={!tcc.solicitacao_pendente_id}
              className="text-[rgb(var(--cor-erro))] hover:text-[rgb(var(--cor-erro))]/80 font-semibold text-pequeno disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar solicitação
            </button>
          }
        />
      )}

      {/* Card de Informações */}
      <div className="bg-cor-superficie rounded-lg p-6 shadow">
        <h2 className="font-semibold text-cor-texto mb-4">Informações do TCC</h2>

        <div className="space-y-4">
          {tcc.resumo && (
            <div>
              <p className="text-pequeno text-cor-texto opacity-60 mb-1">Resumo</p>
              <p className="text-medio text-cor-texto">{tcc.resumo}</p>
            </div>
          )}

          {tcc.orientador_dados && (
            <div>
              <p className="text-pequeno text-cor-texto opacity-60 mb-1">Orientador</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-cor-destaque" />
                <p className="text-medio font-semibold text-cor-texto">
                  {tcc.orientador_dados.nome_completo}
                </p>
              </div>
            </div>
          )}

          {tcc.coorientador_nome && (
            <div>
              <p className="text-pequeno text-cor-texto opacity-60 mb-1">Coorientador externo</p>
              <p className="text-medio text-cor-texto">{tcc.coorientador_nome}</p>
              {tcc.coorientador_titulacao && (
                <p className="text-pequeno text-cor-texto opacity-60">
                  {tcc.coorientador_titulacao.charAt(0).toUpperCase() + tcc.coorientador_titulacao.slice(1)}
                  {tcc.coorientador_afiliacao && ` - ${tcc.coorientador_afiliacao}`}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cor-borda">
            <div>
              <p className="text-pequeno text-cor-texto opacity-60 mb-1">Criado em</p>
              <p className="text-medio text-cor-texto">
                {new Date(tcc.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-pequeno text-cor-texto opacity-60 mb-1">Atualizado em</p>
              <p className="text-medio text-cor-texto">
                {new Date(tcc.atualizado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline de Eventos */}
      <div className="bg-cor-superficie rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-cor-texto">Timeline de eventos</h2>

          {/* Botões de alternância */}
          <div className="flex gap-2 bg-cor-fundo rounded-lg p-1">
            <button
              onClick={() => setModoTimeline('vertical')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded text-pequeno font-medium transition-all
                ${
                  modoTimeline === 'vertical'
                    ? 'bg-cor-destaque text-white'
                    : 'text-cor-texto opacity-60 hover:opacity-100'
                }
              `}
            >
              <LayoutList className="w-4 h-4" />
              Vertical
            </button>
            <button
              onClick={() => setModoTimeline('horizontal')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded text-pequeno font-medium transition-all
                ${
                  modoTimeline === 'horizontal'
                    ? 'bg-cor-destaque text-white'
                    : 'text-cor-texto opacity-60 hover:opacity-100'
                }
              `}
            >
              <LayoutDashboard className="w-4 h-4" />
              Horizontal
            </button>
          </div>
        </div>

        {/* Renderização condicional */}
        {modoTimeline === 'horizontal' ? (
          <TimelineHorizontalDetalhado
            tcc={tcc}
            documentos={tcc.documentos as any}
            mostrarNotas={tcc.etapa_atual === 'CONCLUIDO'}
          />
        ) : (
          <TimelineVerticalDetalhada tcc={tcc} eventos={eventos} carregando={carregandoEventos} />
        )}
      </div>

      {/* Modal Cancelar */}
      {showModalCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-[rgb(var(--cor-alerta))]" />
              <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">Cancelar solicitação</h3>
            </div>

            <p className="text-[rgb(var(--cor-texto-medio))] mb-6">
              Tem certeza que deseja cancelar a solicitação de orientação? Esta ação não pode ser
              desfeita e você precisará enviar uma nova solicitação.
            </p>

            {erro && (
              <div className="bg-[rgb(var(--cor-erro))]/10 border border-[rgb(var(--cor-erro))]/30 rounded p-3 mb-4">
                <p className="text-[rgb(var(--cor-erro))] text-pequeno">{erro}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModalCancelar(false)}
                disabled={cancelando}
                className="px-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors disabled:opacity-50 text-[rgb(var(--cor-texto-primario))]"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="px-4 py-2 bg-[rgb(var(--cor-erro))] text-white rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors disabled:opacity-50"
              >
                {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enviar Monografia */}
      <ModalEnviarDocumento
        show={showModalEnviar}
        onClose={() => setShowModalEnviar(false)}
        onEnviar={handleEnviarDocumento}
        enviando={enviando}
        tipoFixo={TipoDocumento.MONOGRAFIA}
        tituloModal="Enviar monografia"
      />
    </div>
  )
}
