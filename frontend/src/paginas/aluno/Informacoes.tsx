/**
 * Página "Informações" do aluno
 * Informações estáticas sobre o processo do TCC
 */

import { useState, useEffect, useMemo } from 'react'
import { Calendar, FileText, Clock, BookOpen, Users, CheckCircle, Briefcase, Download, Loader2, Eye } from 'lucide-react'
import { useCalendarioSemestre } from '../../hooks'
import { PainelDatasImportantes } from '../../componentes'
import { formatarDataCurta, formatarIntervalo } from '../../utils/datas'
import { listarDocumentosReferencia, type DocumentoReferencia } from '../../servicos/documentos'
import { useToast } from '../../contextos/ToastProvider'

export function Informacoes() {
  const { calendario } = useCalendarioSemestre()
  const { erro: mostrarErro } = useToast()

  // Estados para documentos
  const [documentos, setDocumentos] = useState<DocumentoReferencia[]>([])
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(true)

  // Carregar documentos ao montar
  useEffect(() => {
    carregarDocumentos()
  }, [])

  const carregarDocumentos = async () => {
    try {
      setCarregandoDocumentos(true)
      const data = await listarDocumentosReferencia()
      setDocumentos(data)
    } catch (err: any) {
      mostrarErro(err.response?.data?.detail || 'Erro ao carregar documentos')
    } finally {
      setCarregandoDocumentos(false)
    }
  }

  // Ordem de exibição dos documentos
  const ordemDocumentos = [
    'ORIENTACOES_GERAIS',
    'TERMO_ACEITE',
    'PLANO_DESENVOLVIMENTO',
    'TEMPLATE_WORD',
    'ABNT_BIBLIOGRAFIA',
    'ABNT_BIBLIOGRAFIA_2018',
  ]

  // Mapa de nomes amigáveis para os tipos de documentos
  const nomesDocumentos: Record<string, string> = {
    'ORIENTACOES_GERAIS': 'Orientações gerais sobre o TCC',
    'TERMO_ACEITE': 'Termo de Aceite de Orientação',
    'PLANO_DESENVOLVIMENTO': 'Plano de Desenvolvimento',
    'TEMPLATE_WORD': 'Template Word - TCC',
    'ABNT_BIBLIOGRAFIA': 'ABNT - Estilo de bibliografia do Word',
    'ABNT_BIBLIOGRAFIA_2018': 'ABNT - Estilo de bibliografia do Word 2018',
  }

  // Ordenar documentos de acordo com a ordem definida
  const documentosOrdenados = useMemo(() => {
    return ordemDocumentos
      .map(tipo => documentos.find(doc => doc.tipo === tipo))
      .filter(doc => doc !== undefined) as DocumentoReferencia[]
  }, [documentos])

  // Datas importantes
  const datasImportantes = useMemo(() => {
    return [
      {
        id: 1,
        titulo: 'Reunião com alunos',
        descricao: 'Orientações gerais sobre o TCC e Regulamento',
        data: formatarDataCurta(calendario?.reuniao_alunos),
        icone: Users,
        cor: 'blue',
        temDados: !!calendario?.reuniao_alunos
      },
      {
        id: 2,
        titulo: 'Envio de documentos',
        descricao: 'Prazo para envio do plano e termo',
        data: formatarDataCurta(calendario?.envio_documentos_fim),
        icone: FileText,
        cor: 'cyan',
        temDados: !!calendario?.envio_documentos_fim
      },
      {
        id: 3,
        titulo: 'Avaliação de continuidade',
        descricao: 'Prazo para orientador avaliar progresso',
        data: formatarDataCurta(calendario?.avaliacao_continuidade_fim),
        icone: Clock,
        cor: 'yellow',
        temDados: !!calendario?.avaliacao_continuidade_fim
      },
      {
        id: 4,
        titulo: 'Submissão de monografia + termo',
        descricao: 'Entrega da versão final + Termo',
        data: formatarDataCurta(calendario?.submissao_monografia_fim),
        icone: FileText,
        cor: 'orange',
        temDados: !!calendario?.submissao_monografia_fim
      },
      {
        id: 5,
        titulo: 'Preparação das bancas (Fase I)',
        descricao: 'Período de formação das bancas avaliadoras',
        data: formatarIntervalo(calendario?.preparacao_bancas_fase1_inicio, calendario?.preparacao_bancas_fase1_fim),
        icone: Briefcase,
        cor: 'violet',
        temDados: !!(calendario?.preparacao_bancas_fase1_inicio || calendario?.preparacao_bancas_fase1_fim)
      },
      {
        id: 6,
        titulo: 'Avaliação - Fase I',
        descricao: 'Prazo final para avaliação pela banca',
        data: formatarDataCurta(calendario?.avaliacao_fase1_fim),
        icone: BookOpen,
        cor: 'purple',
        temDados: !!calendario?.avaliacao_fase1_fim
      },
      {
        id: 7,
        titulo: 'Preparação das bancas (Fase II)',
        descricao: 'Formação das bancas para apresentação',
        data: formatarDataCurta(calendario?.preparacao_bancas_fase2),
        icone: Briefcase,
        cor: 'pink',
        temDados: !!calendario?.preparacao_bancas_fase2
      },
      {
        id: 8,
        titulo: 'Apresentação dos trabalhos (Fase II)',
        descricao: 'Prazo final para apresentações orais',
        data: formatarDataCurta(calendario?.defesas_fim),
        icone: Users,
        cor: 'indigo',
        temDados: !!calendario?.defesas_fim
      },
      {
        id: 9,
        titulo: 'Ajustes finais',
        descricao: 'Prazo para correções pós-defesa',
        data: formatarDataCurta(calendario?.ajustes_finais_fim),
        icone: CheckCircle,
        cor: 'green',
        temDados: !!calendario?.ajustes_finais_fim
      }
    ]
  }, [calendario])

  return (
    <div>
      <h1 className="text-2xl font-bold text-cor-texto mb-6">Informações</h1>

      {/* Calendário de Datas Importantes */}
      <PainelDatasImportantes
        datas={datasImportantes}
        calendario={calendario}
      />

      {/* Seção de Documentos de Referência */}
      <div className="mt-6 bg-cor-superficie rounded-xl shadow-sm border border-cor-borda p-6">
        <h2 className="text-lg font-semibold text-cor-texto mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cor-destaque" />
          Documentos de Referência
        </h2>
        <p className="text-sm text-cor-texto-secundario mb-6">
          Baixe os documentos modelo e orientações disponibilizados pela coordenação.
        </p>

        {carregandoDocumentos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cor-destaque" />
            <span className="ml-2 text-cor-texto-secundario">Carregando documentos...</span>
          </div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-cor-texto-secundario mx-auto mb-3 opacity-50" />
            <p className="text-sm text-cor-texto-secundario">
              Nenhum documento disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentosOrdenados.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cor-destaque/10 rounded-lg group-hover:bg-cor-destaque/20 transition-colors">
                    <FileText className="h-5 w-5 text-cor-destaque" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cor-texto">
                      {nomesDocumentos[doc.tipo] || doc.tipo}
                    </p>
                    {doc.arquivo_nome && (
                      <p className="text-xs text-cor-texto-secundario truncate max-w-[200px]">
                        {doc.arquivo_nome}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (!doc.arquivo_url) {
                        mostrarErro('Documento sem URL disponível')
                        return
                      }
                      window.open(doc.arquivo_url, '_blank')
                    }}
                    className="p-2 text-cor-texto-secundario hover:text-cor-destaque hover:bg-cor-destaque/10 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!doc.arquivo_url) {
                        mostrarErro('Documento sem URL disponível')
                        return
                      }
                      try {
                        const response = await fetch(doc.arquivo_url)
                        const blob = await response.blob()
                        const blobUrl = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = blobUrl
                        link.download = doc.arquivo_nome || `${nomesDocumentos[doc.tipo] || doc.tipo}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(blobUrl)
                      } catch {
                        mostrarErro('Erro ao baixar documento')
                      }
                    }}
                    className="p-2 text-cor-texto-secundario hover:text-cor-destaque hover:bg-cor-destaque/10 rounded-lg transition-colors"
                    title="Baixar"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
