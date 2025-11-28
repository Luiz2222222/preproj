/**
 * Dashboard principal do aluno
 * Exibe resumo do TCC, ações rápidas e status
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao'
import { useMeuTCC, useDocumentosTCC, useCalendarioSemestre } from '../hooks'
import { FileText, Clock, Plus, Eye, Download, AlertCircle, Calendar, Activity, CheckCircle, Upload, X } from 'lucide-react'
import { EtapaTCC, TipoDocumento, StatusDocumento } from '../types'
import { SkeletonCard } from '../componentes/Skeleton'
import { TimelineHorizontalDetalhado, ModalEnviarDocumento } from '../componentes'
import { AlertaPrazo } from '../componentes/AlertaPrazo'
import { useToast } from '../contextos/ToastProvider'
import { extrairMensagemErro } from '../servicos/api'
import { prazoExpirado, estaBloqueado, mensagemPrazoEncerrado } from '../utils/permissoes'
import { formatarDataCurta } from '../utils/datas'

export function DashboardAluno() {
  useAutenticacao()
  const { sucesso, erro: toastErro } = useToast()
  const { tcc, recusa, carregando, recarregar: recarregarTCC } = useMeuTCC()
  const [mostrarRecusa, setMostrarRecusa] = useState(true)
  const { calendario } = useCalendarioSemestre()
  const { enviarDocumento, enviando } = useDocumentosTCC({
    tccId: tcc?.id || null,
    autoCarregar: false
  })
  const navigate = useNavigate()
  const [showModalEnviar, setShowModalEnviar] = useState(false)

  // Handler para enviar documento via modal
  const handleEnviarDocumento = async (tipo: TipoDocumento, arquivo: File) => {
    try {
      await enviarDocumento(tipo, arquivo)
      setShowModalEnviar(false)
      await recarregarTCC()
      sucesso('Documento enviado com sucesso!')
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      toastErro(mensagem)
      throw err // Repassar erro para o modal mostrar
    }
  }

  // Função para formatar data
  const formatarData = (dataISO: string | null | undefined): string => {
    if (!dataISO) return '-'
    try {
      const data = new Date(dataISO)
      const dataStr = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      const horaStr = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      return `${dataStr} ${horaStr}`
    } catch {
      return '-'
    }
  }

  // Função auxiliar para buscar documento por tipo
  const getDocumentoPorTipo = (tipo: string) => {
    if (!tcc?.documentos) return null
    return tcc.documentos.find(doc => doc.tipo_documento === tipo) || null
  }

  // Função auxiliar para buscar a última monografia (ordenada por criado_em)
  const getUltimaMonografia = () => {
    if (!tcc?.documentos) return null
    const monografias = tcc.documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
    if (monografias.length === 0) return null
    // Ordenar por criado_em (mais recente primeiro)
    return monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
  }

  // Helper para calcular próximo prazo baseado no calendário
  const calcularProximoPrazo = (): { label: string; data: string | null; eHoje: boolean } => {
    if (!calendario) {
      return { label: 'Sem prazos futuros', data: null, eHoje: false }
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de datas

    // Array de candidatos: [rótulo, dataISO]
    const candidatos: Array<[string, string | null | undefined]> = [
      ['Envio de documentos', calendario.envio_documentos_fim],
      ['Avaliação de continuidade', calendario.avaliacao_continuidade_fim],
      ['Submissão de monografia', calendario.submissao_monografia_fim],
      ['Avaliação - Fase I', calendario.avaliacao_fase1_fim],
      ['Período de defesas', calendario.defesas_fim],
      ['Ajustes finais', calendario.ajustes_finais_fim],
    ]

    // Filtrar e encontrar a menor data futura
    let proximaDataISO: string | null = null
    let proximoLabel: string | null = null
    let menorTimestamp: number | null = null
    let proximaDataLocal: Date | null = null

    for (const [label, dataISO] of candidatos) {
      if (!dataISO) continue

      try {
        // Extrair componentes da data sem conversão de fuso horário
        const [ano, mes, dia] = dataISO.split('T')[0].split('-')
        const dataLocal = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        const timestamp = dataLocal.getTime()

        // Se a data é futura e (não temos próxima OU esta é menor que a atual próxima)
        if (dataLocal >= hoje && (menorTimestamp === null || timestamp < menorTimestamp)) {
          menorTimestamp = timestamp
          proximaDataISO = dataISO
          proximoLabel = label
          proximaDataLocal = dataLocal
        }
      } catch {
        // Ignorar datas inválidas
        continue
      }
    }

    if (!proximaDataISO || !proximoLabel || !proximaDataLocal) {
      return { label: 'Sem prazos futuros', data: null, eHoje: false }
    }

    // Verificar se a data é hoje
    const eHoje = proximaDataLocal.getTime() === hoje.getTime()

    // Usar formatarDataCurta para evitar problemas de fuso horário
    return { label: proximoLabel, data: formatarDataCurta(proximaDataISO), eHoje }
  }

  if (carregando) {
    return (
      <div>
        <SkeletonCard />
      </div>
    )
  }

  // Sem TCC ou TCC recusado: Mostrar botão para iniciar
  if (!tcc || tcc.solicitacao_recusada) {
    const prazoCadastroExpirado = prazoExpirado(calendario?.envio_documentos_fim)

    return (
      <div>
        {/* Aviso de solicitação recusada */}
        {recusa && mostrarRecusa && (
          <div className="bg-[rgb(var(--cor-erro))]/10 border-2 border-[rgb(var(--cor-erro))]/40 rounded-lg p-5 shadow-sm relative mb-6">
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

        <div className="bg-cor-superficie rounded-lg p-8 shadow text-center">
          <div className="max-w-md mx-auto">
            <FileText className="h-16 w-16 text-cor-destaque mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-cor-texto mb-2">
              Você ainda não iniciou seu TCC
            </h2>
            <p className="text-cor-texto opacity-75 mb-6">
              Preencha as informações do seu trabalho e envie uma solicitação de orientação para começar.
            </p>

            {prazoCadastroExpirado && (
              <AlertaPrazo
                mensagem={mensagemPrazoEncerrado(calendario?.envio_documentos_fim, 'envio de documentos')}
                variant="warning"
                className="mb-4"
              />
            )}

            <button
              onClick={() => navigate('/aluno/iniciar-tcc')}
              disabled={prazoCadastroExpirado}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cor-destaque text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
              Iniciar TCC
            </button>
          </div>
        </div>
      </div>
    )
  }

  // TCC existe: Dashboard completo com 3 cards + timeline + documentos

  const ultimaMonografia = getUltimaMonografia()
  const proximoPrazo = calcularProximoPrazo()

  // Determinar texto de ação necessária baseado na etapa
  let acaoNecessaria = 'Sem solicitação pendente'
  let acaoDescricao = 'Nenhuma solicitação aguardando ação'
  let acaoIcone = AlertCircle
  let acaoIconeCor = 'text-cor-borda'
  let acaoBtn: (() => void) | null = null
  let acaoBtnTexto = ''
  let acaoBtnCor = 'bg-cor-destaque hover:opacity-90'

  // Apenas modificar se houver ação necessária do aluno:
  // - Estamos em DESENVOLVIMENTO E
  // - (não existe monografia OU última monografia tem status REJEITADO) E
  // - As permissões permitem envio
  const necessitaEnvioMonografia =
    tcc.etapa_atual === EtapaTCC.DESENVOLVIMENTO &&
    (!ultimaMonografia || ultimaMonografia.status === StatusDocumento.REJEITADO)

  const permiteEnvioMonografia = !estaBloqueado(tcc.permissoes, 'pode_enviar_monografia')

  const podeEnviarMonografia = necessitaEnvioMonografia && permiteEnvioMonografia

  if (necessitaEnvioMonografia) {
    if (permiteEnvioMonografia) {
      // Pode enviar
      acaoNecessaria = 'Enviar versão do TCC'
      acaoDescricao = 'Submeta a monografia para avaliação do orientador.'
      acaoIcone = Upload
      acaoIconeCor = 'text-[rgb(var(--cor-alerta))]'
      acaoBtn = () => setShowModalEnviar(true)
      acaoBtnTexto = 'Enviar'
      acaoBtnCor = 'bg-[rgb(var(--cor-alerta))] hover:bg-[rgb(var(--cor-alerta))]/90'
    } else {
      // Necessita enviar mas está bloqueado
      acaoNecessaria = 'Prazo encerrado'
      acaoDescricao = mensagemPrazoEncerrado(tcc.calendario_semestre?.submissao_monografia_fim, 'envio de monografia')
      acaoIcone = AlertCircle
      acaoIconeCor = 'text-[rgb(var(--cor-erro))]'
    }
  }

  const AcaoIcone = acaoIcone

  return (
    <div>
      {/* Grade de 3 Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Ação Pendente */}
        <div className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6 min-h-[180px] flex flex-col">
          {podeEnviarMonografia ? (
            <>
              {/* Layout com ação: cabeçalho com ícone pequeno na lateral */}
              <div className="flex items-center justify-center mb-3 relative">
                <h3 className="text-sm font-medium text-cor-texto opacity-60">Ação pendente</h3>
                <AcaoIcone className={`h-5 w-5 ${acaoIconeCor} absolute right-0`} />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-lg font-semibold text-cor-texto mb-1">
                  {acaoNecessaria}
                </p>
                <p className="text-sm text-cor-texto/70 mb-3">
                  {acaoDescricao}
                </p>
                <button
                  onClick={acaoBtn!}
                  className={`w-full px-4 py-2 ${acaoBtnCor} text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 mt-auto`}
                >
                  {acaoBtnTexto}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Layout sem ação: ícone centralizado (estado vazio) */}
              <h3 className="text-sm font-medium text-cor-texto opacity-60 mb-3 text-center">Ação pendente</h3>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <AcaoIcone className="h-6 w-6 text-[rgb(var(--cor-icone))]" />
                  </div>
                  <p className="text-base font-semibold text-cor-texto mb-1">
                    {acaoNecessaria}
                  </p>
                  <p className="text-sm text-cor-texto opacity-60">
                    {acaoDescricao}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Card 2: Próximo Prazo */}
        <div className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6 flex flex-col">
          <div className="flex items-center justify-center mb-3 relative">
            <h3 className="text-sm font-medium text-cor-texto opacity-60">Próximo prazo</h3>
            <Calendar className="h-5 w-5 text-[rgb(var(--cor-destaque))] absolute right-0" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-bold text-[rgb(var(--cor-destaque))] mb-1">
              {proximoPrazo.label || 'Sem prazos futuros'}
            </p>
            <p className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">
              {proximoPrazo.data ? `${proximoPrazo.data}${proximoPrazo.eHoje ? ' - Hoje' : ''}` : '-'}
            </p>
          </div>
        </div>

        {/* Card 3: Fase Atual / Agendamento */}
        <div className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6 flex flex-col">
          <div className="flex items-center justify-center mb-3 relative">
            <h3 className="text-sm font-medium text-cor-texto opacity-60">
              {tcc.data_defesa ? 'Defesa agendada' : 'Fase atual'}
            </h3>
            <Activity className="h-5 w-5 text-[rgb(var(--cor-fase2-cabecalho))] absolute right-0" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {tcc.data_defesa ? (
              <>
                <p className="text-lg font-bold text-[rgb(var(--cor-fase2-cabecalho))] mb-1">
                  {tcc.data_defesa}
                </p>
                {tcc.hora_defesa && (
                  <p className="text-base font-semibold text-[rgb(var(--cor-fase2-cabecalho))]">
                    {tcc.hora_defesa}
                  </p>
                )}
                {tcc.local_defesa && (
                  <p className="text-sm text-cor-texto opacity-70 mt-1">
                    {tcc.local_defesa}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-[rgb(var(--cor-fase2-cabecalho))] mb-1">
                  {tcc.etapa_display}
                </p>
                <p className="text-xl font-bold text-transparent select-none">-</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Horizontal */}
      <div className="mb-6">
        <TimelineHorizontalDetalhado
          tcc={tcc}
          documentos={tcc.documentos as any}
        />
      </div>

      {/* Tabela de Documentos */}
      <div className="bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cor-texto">Documentos</h2>
          <button
            onClick={() => navigate('/aluno/documentos')}
            className="text-sm text-cor-destaque hover:opacity-80 transition"
          >
            Ver todos os documentos
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cor-borda">
                <th className="text-center py-2 px-3 text-xs font-medium text-cor-texto opacity-60 uppercase">Data</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-cor-texto opacity-60 uppercase">Tipo de documento</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-cor-texto opacity-60 uppercase">Nome do arquivo</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-cor-texto opacity-60 uppercase">Status</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-cor-texto opacity-60 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Termo de Aceite */}
              {(() => {
                const doc = getDocumentoPorTipo(TipoDocumento.TERMO_ACEITE)
                return (
                  <tr className="border-b border-cor-borda hover:bg-cor-fundo">
                    <td className="py-2 px-3 text-sm text-cor-texto text-center">
                      {doc ? formatarData(doc.criado_em) : '-'}
                    </td>
                    <td className="py-2 px-3 text-sm text-cor-texto text-center">
                      Termo de aceite
                    </td>
                    <td className="py-2 px-3 text-sm text-cor-texto text-center truncate max-w-xs">
                      {doc ? doc.nome_original : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {doc ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          doc.status === StatusDocumento.APROVADO ? 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]' :
                          doc.status === StatusDocumento.PENDENTE ? 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]' :
                          'bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))]'
                        }`}>
                          {doc.status === StatusDocumento.APROVADO ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprovado
                            </>
                          ) : doc.status === StatusDocumento.PENDENTE ? (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Em análise
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1" />
                              Enviado
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))]">
                          <Upload className="w-3 h-3 mr-1" />
                          Não enviado
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {doc && doc.arquivo ? (
                          <>
                            <button
                              onClick={() => window.open(doc.arquivo!, '_blank')}
                              className="text-cor-destaque hover:opacity-80"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = doc.arquivo!
                                link.download = doc.arquivo!.split('/').pop() || 'termo_aceite.pdf'
                                link.click()
                              }}
                              className="text-cor-destaque hover:opacity-80"
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[rgb(var(--cor-texto-terciario))] text-sm">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })()}

              {/* Plano de Desenvolvimento */}
              {(() => {
                const doc = getDocumentoPorTipo(TipoDocumento.PLANO_DESENVOLVIMENTO)
                return (
                  <tr className="border-b border-cor-borda hover:bg-cor-fundo">
                    <td className="py-2 px-3 text-sm text-cor-texto text-center">
                      {doc ? formatarData(doc.criado_em) : '-'}
                    </td>
                    <td className="py-2 px-3 text-sm text-cor-texto text-center">
                      Plano de desenvolvimento
                    </td>
                    <td className="py-2 px-3 text-sm text-cor-texto text-center truncate max-w-xs">
                      {doc ? doc.nome_original : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {doc ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          doc.status === StatusDocumento.APROVADO ? 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]' :
                          doc.status === StatusDocumento.PENDENTE ? 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]' :
                          'bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))]'
                        }`}>
                          {doc.status === StatusDocumento.APROVADO ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprovado
                            </>
                          ) : doc.status === StatusDocumento.PENDENTE ? (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Em análise
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1" />
                              Enviado
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))]">
                          <Upload className="w-3 h-3 mr-1" />
                          Não enviado
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {doc && doc.arquivo ? (
                          <>
                            <button
                              onClick={() => window.open(doc.arquivo!, '_blank')}
                              className="text-cor-destaque hover:opacity-80"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = doc.arquivo!
                                link.download = doc.arquivo!.split('/').pop() || 'plano_desenvolvimento.pdf'
                                link.click()
                              }}
                              className="text-cor-destaque hover:opacity-80"
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[rgb(var(--cor-texto-terciario))] text-sm">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })()}

              {/* Monografia Fase I */}
              {(() => {
                const doc = getDocumentoPorTipo(TipoDocumento.MONOGRAFIA)
                return (
                  <tr className="border-b border-cor-borda hover:bg-cor-fundo">
                    <td className="py-2 px-3 text-sm text-cor-texto text-center">
                      {doc ? formatarData(doc.criado_em) : '-'}
                    </td>
                    <td className="py-2 px-3 text-sm text-cor-texto text-center">
                      Monografia fase I
                    </td>
                    <td className="py-2 px-3 text-sm text-cor-texto text-center truncate max-w-xs">
                      {doc ? doc.nome_original : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {doc ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          doc.status === StatusDocumento.APROVADO ? 'bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]' :
                          doc.status === StatusDocumento.REJEITADO ? 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]' :
                          doc.status === StatusDocumento.PENDENTE ? 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]' :
                          'bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))]'
                        }`}>
                          {doc.status === StatusDocumento.APROVADO ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprovado
                            </>
                          ) : doc.status === StatusDocumento.REJEITADO ? (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Correções solicitadas
                            </>
                          ) : doc.status === StatusDocumento.PENDENTE ? (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Em análise
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-1" />
                              Enviado
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-[rgb(var(--cor-borda))]/20 text-[rgb(var(--cor-texto-secundario))]">
                          <Upload className="w-3 h-3 mr-1" />
                          Não enviado
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {doc && doc.arquivo ? (
                          <>
                            <button
                              onClick={() => window.open(doc.arquivo!, '_blank')}
                              className="text-cor-destaque hover:opacity-80"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = doc.arquivo!
                                link.download = doc.arquivo!.split('/').pop() || 'monografia.pdf'
                                link.click()
                              }}
                              className="text-cor-destaque hover:opacity-80"
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[rgb(var(--cor-texto-terciario))] text-sm">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Enviar Monografia */}
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
