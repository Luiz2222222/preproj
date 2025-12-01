/**
 * Página "Documentos" do aluno
 * Lista e gerencia documentos do TCC
 */

import { useState } from 'react'
import { useMeuTCC, useDocumentosTCC } from '../../hooks'
import {
  FileText,
  Upload,
  Eye,
  Download,
  File,
  FileCheck,
  FilePieChart,
  FileSliders,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import {
  TipoDocumento,
  TipoDocumentoLabels,
  StatusDocumento,
  StatusDocumentoLabels,
  EtapaTCC,
} from '../../types'
import { extrairMensagemErro } from '../../servicos/api'
import { Badge, type BadgeVariant } from '../../componentes/Badge'
import { SkeletonList } from '../../componentes/Skeleton'
import { useToast } from '../../contextos/ToastProvider'
import { ModalEnviarDocumento } from '../../componentes'

const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8111/media'

// Ícones para cada tipo de documento
const iconesPorTipo: Record<TipoDocumento, typeof FileText> = {
  [TipoDocumento.PLANO_DESENVOLVIMENTO]: FilePieChart,
  [TipoDocumento.TERMO_ACEITE]: FileCheck,
  [TipoDocumento.MONOGRAFIA]: FileText,
  [TipoDocumento.MONOGRAFIA_AVALIACAO]: FileText,
  [TipoDocumento.TERMO_SOLICITACAO_AVALIACAO]: FileCheck,
  [TipoDocumento.APRESENTACAO]: FileSliders,
  [TipoDocumento.ATA]: FileCheck,
  [TipoDocumento.OUTRO]: File,
}

// Ícones para cada status
const iconesStatus: Record<StatusDocumento, typeof Clock> = {
  [StatusDocumento.PENDENTE]: Clock,
  [StatusDocumento.EM_ANALISE]: Clock,
  [StatusDocumento.APROVADO]: CheckCircle,
  [StatusDocumento.REJEITADO]: AlertCircle,
}

// Mapear status para variante do Badge
const statusParaBadge: Record<StatusDocumento, BadgeVariant> = {
  [StatusDocumento.PENDENTE]: 'warning',
  [StatusDocumento.EM_ANALISE]: 'info',
  [StatusDocumento.APROVADO]: 'success',
  [StatusDocumento.REJEITADO]: 'error',
}

// Tipos de documento válidos para filtro (visíveis para o aluno)
const tiposDocumentoFiltro: { valor: TipoDocumento; label: string }[] = [
  { valor: TipoDocumento.MONOGRAFIA, label: 'Monografia' },
  { valor: TipoDocumento.TERMO_SOLICITACAO_AVALIACAO, label: 'Termo de Solicitação de Avaliação' },
  { valor: TipoDocumento.TERMO_ACEITE, label: 'Termo de Aceite' },
  { valor: TipoDocumento.PLANO_DESENVOLVIMENTO, label: 'Plano de Desenvolvimento' },
  { valor: TipoDocumento.APRESENTACAO, label: 'Apresentação' },
]

// Status válidos para filtro
const statusFiltro: { valor: StatusDocumento; label: string }[] = [
  { valor: StatusDocumento.PENDENTE, label: 'Pendente' },
  { valor: StatusDocumento.EM_ANALISE, label: 'Em Análise' },
  { valor: StatusDocumento.APROVADO, label: 'Aprovado' },
  { valor: StatusDocumento.REJEITADO, label: 'Rejeitado' },
]

export function Documentos() {
  const { sucesso, erro: toastErro } = useToast()
  const { tcc, carregando: carregandoTCC } = useMeuTCC()
  const { documentos, carregando, enviarDocumento, enviando, recarregar } = useDocumentosTCC({
    tccId: tcc?.id || null,
    autoCarregar: !!tcc,
  })

  const [showModalEnviar, setShowModalEnviar] = useState(false)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')

  // Helpers para calcular monografia pendente
  const getUltimaMonografia = () => {
    if (!documentos.length) return null
    const monografias = documentos.filter(doc => doc.tipo_documento === TipoDocumento.MONOGRAFIA)
    if (monografias.length === 0) return null
    return monografias.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
  }

  const ultimaMonografia = getUltimaMonografia()
  const podeEnviarMonografia =
    tcc?.etapa_atual === EtapaTCC.DESENVOLVIMENTO &&
    (!ultimaMonografia || ultimaMonografia.status === StatusDocumento.REJEITADO)

  // Aplicar filtros
  const documentosFiltrados = documentos.filter((doc) => {
    if (filtroTipo !== 'TODOS' && doc.tipo_documento !== filtroTipo) return false
    if (filtroStatus !== 'TODOS' && doc.status !== filtroStatus) return false
    return true
  })

  const handleEnviarDocumento = async (tipo: TipoDocumento, arquivo: File) => {
    try {
      await enviarDocumento(tipo, arquivo)
      setShowModalEnviar(false)
      await recarregar()
      sucesso('Documento enviado com sucesso!')
    } catch (err) {
      toastErro(extrairMensagemErro(err))
      throw err
    }
  }

  // Monta URL correta (absoluta ou com prefixo MEDIA_URL)
  const montarUrl = (caminhoArquivo: string) => {
    return caminhoArquivo.startsWith('http://') || caminhoArquivo.startsWith('https://')
      ? caminhoArquivo
      : `${MEDIA_URL}/${caminhoArquivo}`
  }

  const visualizarDocumento = (caminhoArquivo: string) => {
    const url = montarUrl(caminhoArquivo)
    window.open(url, '_blank')
  }

  const baixarDocumento = async (caminhoArquivo: string, nomeOriginal: string) => {
    try {
      const url = montarUrl(caminhoArquivo)
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
    } catch (err) {
      toastErro('Erro ao baixar documento')
    }
  }

  if (carregandoTCC) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cor-texto mb-2">Documentos do TCC</h1>
        </div>
        <SkeletonList count={3} />
      </div>
    )
  }

  if (!tcc) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-cor-texto opacity-30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-cor-texto mb-2">
          Você ainda não iniciou seu TCC
        </h2>
        <p className="text-cor-texto opacity-75">
          Inicie seu TCC para poder gerenciar documentos.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cor-texto">Documentos</h1>
        </div>
        {podeEnviarMonografia && (
          <button
            onClick={() => setShowModalEnviar(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cor-destaque text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            <Upload className="h-4 w-4" />
            Enviar TCC
          </button>
        )}
      </div>

      {/* Filtros */}
      {documentos.length > 0 && (
        <div className="bg-cor-superficie rounded-lg p-4 shadow mb-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-pequeno font-medium text-cor-texto mb-2">
                Filtrar por tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
              >
                <option value="TODOS">Todos os tipos</option>
                {tiposDocumentoFiltro.map(({ valor, label }) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-pequeno font-medium text-cor-texto mb-2">
                Filtrar por status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
              >
                <option value="TODOS">Todos os status</option>
                {statusFiltro.map(({ valor, label }) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Documentos */}
      <div className="bg-cor-superficie rounded-lg shadow">
        {carregando ? (
          <div className="p-6">
            <SkeletonList count={5} />
          </div>
        ) : documentos.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-cor-texto opacity-30 mx-auto mb-4" />
            <p className="text-cor-texto opacity-75">Nenhum documento enviado ainda.</p>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-cor-texto opacity-30 mx-auto mb-4" />
            <p className="text-cor-texto opacity-75">Nenhum documento encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-cor-borda">
            {documentosFiltrados.map((documento) => {
              const Icone = iconesPorTipo[documento.tipo_documento as TipoDocumento] || FileText
              const IconeStatus = iconesStatus[documento.status as StatusDocumento] || Clock
              const badgeVariant = statusParaBadge[documento.status as StatusDocumento] || 'neutral'

              // Nome de exibição: para monografia anônima, usar nome_original ou 'Monografia anônima'
              const isMonografiaAnonima = documento.tipo_documento === TipoDocumento.MONOGRAFIA_AVALIACAO
              const nomeExibicao = documento.nome_original || (isMonografiaAnonima ? 'Monografia anônima' : TipoDocumentoLabels[documento.tipo_documento as TipoDocumento] || 'Documento')
              const nomeDownload = documento.nome_original || (isMonografiaAnonima ? 'Monografia_anonima.pdf' : 'Documento.pdf')

              return (
                <div key={documento.id} className="p-6 hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Ícone do tipo de documento */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[rgb(var(--cor-destaque))]/10 rounded-lg flex items-center justify-center">
                        <Icone className="h-6 w-6 text-[rgb(var(--cor-destaque))]" />
                      </div>
                    </div>

                    {/* Informações do documento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-medio font-semibold text-cor-texto truncate" title={nomeExibicao}>
                          {nomeExibicao}
                        </h3>
                        {documento.tipo_documento !== TipoDocumento.MONOGRAFIA_AVALIACAO &&
                         documento.tipo_documento !== TipoDocumento.TERMO_SOLICITACAO_AVALIACAO && (
                          <Badge
                            variant={badgeVariant}
                            icon={<IconeStatus className="h-3 w-3" />}
                          >
                            {StatusDocumentoLabels[documento.status as StatusDocumento]}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-pequeno text-cor-texto opacity-60 mb-2">
                        <span>
                          {isMonografiaAnonima ? 'Monografia anônima' : TipoDocumentoLabels[documento.tipo_documento as TipoDocumento]}
                        </span>
                        {documento.tipo_documento === TipoDocumento.MONOGRAFIA && (
                          <>
                            <span>•</span>
                            <span>Versão {documento.versao}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(documento.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Feedback (se rejeitado) */}
                      {documento.status === StatusDocumento.REJEITADO &&
                        documento.feedback && (
                          <div className="mt-3 p-3 bg-[rgb(var(--cor-erro))]/10 border-l-4 border-[rgb(var(--cor-erro))] rounded">
                            <p className="text-pequeno font-semibold text-[rgb(var(--cor-texto-primario))] mb-1">
                              Feedback do orientador:
                            </p>
                            <p className="text-pequeno text-[rgb(var(--cor-erro))]">
                              {documento.feedback}
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {documento.tipo_documento !== TipoDocumento.MONOGRAFIA && (
                        <button
                          onClick={() => visualizarDocumento(documento.arquivo)}
                          className="p-2 border border-cor-borda rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-cor-texto" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          baixarDocumento(documento.arquivo, nomeDownload)
                        }
                        className="p-2 border border-cor-borda rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors"
                        title={`Baixar ${nomeExibicao}`}
                      >
                        <Download className="h-4 w-4 text-cor-texto" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Enviar Documento */}
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
