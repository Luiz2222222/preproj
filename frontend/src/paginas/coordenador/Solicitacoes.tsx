/**
 * Página "Solicitações" do coordenador
 * Lista e gerencia solicitações de orientação pendentes
 */

import { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Calendar,
  Eye,
  Search,
  UserPlus,
} from 'lucide-react'
import api, { extrairMensagemErro } from '../../servicos/api'
import { useToast } from '../../contextos/ToastProvider'
import { SkeletonList } from '../../componentes/Skeleton'
import { formatarCurso } from '../../utils/formatadores'

interface Documento {
  id: number
  tipo: string
  tipo_display: string
  nome_original: string
  versao: number
  url: string | null
  criado_em: string
}

interface SolicitacaoOrientacao {
  id: number
  tcc: number
  tcc_dados?: {
    id: number
    titulo: string
    semestre: string
    aluno_dados?: {
      curso?: string
    }
  }
  professor_dados: {
    id: number
    nome_completo: string
    email: string
  }
  mensagem: string
  status: string
  status_display: string
  aluno_nome: string
  aluno_curso: string | null
  documentos: Documento[]
  criado_em: string
  coorientador_nome?: string
  coorientador_titulacao?: string
  coorientador_afiliacao?: string
}

export default function Solicitacoes() {
  const { sucesso, erro: toastErro } = useToast()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoOrientacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalSolicitacao, setModalSolicitacao] = useState<SolicitacaoOrientacao | null>(null)
  const [resposta, setResposta] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    buscarSolicitacoes()
  }, [])

  const buscarSolicitacoes = async () => {
    try {
      setCarregando(true)
      const response = await api.get('/solicitacoes/pendentes/')
      setSolicitacoes(response.data)
    } catch (error) {
      const mensagem = extrairMensagemErro(error)
      toastErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  const aprovarSolicitacao = async () => {
    if (!modalSolicitacao) return

    try {
      setProcessando(true)
      await api.post(`/solicitacoes/${modalSolicitacao.id}/aceitar/`, {
        resposta: resposta.trim(),
      })
      sucesso('Solicitação aprovada com sucesso!')
      setModalSolicitacao(null)
      setResposta('')
      await buscarSolicitacoes()
    } catch (error) {
      const mensagem = extrairMensagemErro(error)
      toastErro(mensagem)
    } finally {
      setProcessando(false)
    }
  }

  const recusarSolicitacao = async () => {
    if (!modalSolicitacao) return

    if (!resposta.trim()) {
      toastErro('Por favor, informe o motivo da recusa')
      return
    }

    try {
      setProcessando(true)
      await api.post(`/solicitacoes/${modalSolicitacao.id}/recusar/`, {
        resposta: resposta.trim(),
      })
      sucesso('Solicitação recusada')
      setModalSolicitacao(null)
      setResposta('')
      await buscarSolicitacoes()
    } catch (error) {
      const mensagem = extrairMensagemErro(error)
      toastErro(mensagem)
    } finally {
      setProcessando(false)
    }
  }

  const solicitacoesFiltradas = solicitacoes.filter((sol) => {
    const matchSearch =
      (sol.tcc_dados?.titulo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.professor_dados.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const stats = {
    total: solicitacoes.length,
    comDocumentos: solicitacoes.filter((s) => s.documentos.length > 0).length,
    comCoorientador: solicitacoes.filter((s) => s.coorientador_nome).length,
  }

  if (carregando) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-6">Solicitações de Orientação</h1>
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Solicitações de Orientação</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))]">
          Analise e aprove solicitações de orientação enviadas pelos alunos
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Total Pendentes</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.total}</p>
            </div>
            <Clock className="h-8 w-8 text-[rgb(var(--cor-alerta))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-destaque))]/10 rounded-lg border border-[rgb(var(--cor-destaque))]/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-destaque))]">Com Documentos</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.comDocumentos}</p>
            </div>
            <FileText className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-fase2-cabecalho))]/10 rounded-lg border border-[rgb(var(--cor-fase2-cabecalho))]/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-fase2-cabecalho))]">Com Coorientador</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">{stats.comCoorientador}</p>
            </div>
            <UserPlus className="h-8 w-8 text-[rgb(var(--cor-fase2-cabecalho))]" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--cor-icone))]" />
          <input
            type="text"
            placeholder="Buscar por título, aluno ou professor..."
            className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Solicitações */}
      {solicitacoesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))]">
          <Clock className="h-16 w-16 text-[rgb(var(--cor-borda-forte))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">Nenhuma solicitação pendente</h3>
          <p className="text-[rgb(var(--cor-texto-secundario))]">Não há solicitações aguardando sua aprovação no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoesFiltradas.map((solicitacao) => (
            <div
              key={solicitacao.id}
              className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))]">
                      <UserPlus className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                          {solicitacao.tcc_dados?.titulo ?? 'Título não disponível'}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/20">
                          Pendente
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                        <div className="flex items-center gap-2 text-[rgb(var(--cor-texto-secundario))]">
                          <User className="h-4 w-4" />
                          <span>Aluno: {solicitacao.aluno_nome}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[rgb(var(--cor-texto-secundario))]">
                          <UserPlus className="h-4 w-4" />
                          <span>Orientador: {solicitacao.professor_dados.nome_completo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[rgb(var(--cor-texto-secundario))]">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Enviado em {new Date(solicitacao.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {solicitacao.mensagem && (
                        <p className="text-[rgb(var(--cor-texto-secundario))] text-sm mb-3 line-clamp-2">
                          {solicitacao.mensagem}
                        </p>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-[rgb(var(--cor-texto-terciario))]">
                          Semestre: {solicitacao.tcc_dados?.semestre ?? '—'}
                        </span>
                        {solicitacao.aluno_curso && (
                          <span className="text-sm text-[rgb(var(--cor-texto-terciario))]">Curso: {formatarCurso(solicitacao.aluno_curso)}</span>
                        )}
                        {solicitacao.documentos.length > 0 && (
                          <span className="text-sm text-[rgb(var(--cor-texto-terciario))]">
                            <FileText className="h-4 w-4 inline mr-1" />
                            {solicitacao.documentos.length} documento(s)
                          </span>
                        )}
                        {solicitacao.coorientador_nome && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--cor-fase2-cabecalho))]/10 text-[rgb(var(--cor-fase2-cabecalho))]">
                            Com coorientador
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => {
                      setModalSolicitacao(solicitacao)
                      setResposta('')
                    }}
                    className="px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    Analisar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Análise */}
      {modalSolicitacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">
                    Análise de Solicitação de Orientação
                  </h2>
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mt-1">{modalSolicitacao.aluno_nome}</p>
                </div>
                <button
                  onClick={() => setModalSolicitacao(null)}
                  disabled={processando}
                  className="text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-secundario))] disabled:opacity-50"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-1">Título do TCC</h3>
                  <p className="text-[rgb(var(--cor-texto-primario))]">{modalSolicitacao.tcc_dados?.titulo ?? 'Título não disponível'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-1">Aluno</h3>
                    <p className="text-[rgb(var(--cor-texto-primario))]">{modalSolicitacao.aluno_nome}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-1">Professor Orientador</h3>
                    <p className="text-[rgb(var(--cor-texto-primario))]">{modalSolicitacao.professor_dados.nome_completo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-1">Semestre</h3>
                    <p className="text-[rgb(var(--cor-texto-primario))]">{modalSolicitacao.tcc_dados?.semestre ?? '—'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-1">Data da Solicitação</h3>
                    <p className="text-[rgb(var(--cor-texto-primario))]">
                      {new Date(modalSolicitacao.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {modalSolicitacao.mensagem && (
                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-1">Mensagem do Aluno</h3>
                    <p className="text-[rgb(var(--cor-texto-primario))] whitespace-pre-wrap">{modalSolicitacao.mensagem}</p>
                  </div>
                )}

                {modalSolicitacao.coorientador_nome && (
                  <div className="bg-[rgb(var(--cor-fase2-cabecalho))]/10 border border-[rgb(var(--cor-fase2-cabecalho))]/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                      Coorientador Externo
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-[rgb(var(--cor-texto-primario))]">
                        <span className="font-medium">Nome:</span> {modalSolicitacao.coorientador_nome}
                      </p>
                      {modalSolicitacao.coorientador_titulacao && (
                        <p className="text-[rgb(var(--cor-texto-primario))]">
                          <span className="font-medium">Titulação:</span>{' '}
                          {modalSolicitacao.coorientador_titulacao}
                        </p>
                      )}
                      {modalSolicitacao.coorientador_afiliacao && (
                        <p className="text-[rgb(var(--cor-texto-primario))]">
                          <span className="font-medium">Afiliação:</span>{' '}
                          {modalSolicitacao.coorientador_afiliacao}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {modalSolicitacao.documentos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-2">Documentos Anexados</h3>
                    <div className="space-y-2">
                      {modalSolicitacao.documentos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-superficie-hover))]"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                            <div>
                              <p className="text-sm text-[rgb(var(--cor-texto-primario))] font-medium">{doc.tipo_display}</p>
                              <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">{doc.nome_original} (v{doc.versao})</p>
                            </div>
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 text-sm font-medium"
                            >
                              Visualizar
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-terciario))] mb-2">
                    Parecer (opcional para aprovação, obrigatório para recusa)
                  </h3>
                  <textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                    rows={4}
                    placeholder="Digite seu parecer sobre esta solicitação..."
                    disabled={processando}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={aprovarSolicitacao}
                  disabled={processando}
                  className="flex-1 px-4 py-2 bg-[rgb(var(--cor-sucesso))] text-white rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="h-5 w-5" />
                  {processando ? 'Aprovando...' : 'Aprovar'}
                </button>
                <button
                  onClick={recusarSolicitacao}
                  disabled={processando}
                  className="flex-1 px-4 py-2 bg-[rgb(var(--cor-erro))] text-white rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="h-5 w-5" />
                  {processando ? 'Recusando...' : 'Recusar'}
                </button>
                <button
                  onClick={() => setModalSolicitacao(null)}
                  disabled={processando}
                  className="flex-1 px-4 py-2 border border-[rgb(var(--cor-borda-forte))] text-[rgb(var(--cor-texto-medio))] rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
