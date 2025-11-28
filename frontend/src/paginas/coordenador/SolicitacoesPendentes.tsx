import { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Eye
} from 'lucide-react'
import { useToast } from '../../contextos/ToastProvider'
import { useSolicitacoesPendentesCoordenador } from '../../hooks'
import { ModalAprovarSolicitacao } from '../../componentes/ModalAprovarSolicitacao'
import { ModalRecusarSolicitacao } from '../../componentes/ModalRecusarSolicitacao'
import api, { extrairMensagemErro } from '../../servicos/api'
import type { SolicitacaoOrientacao } from '../../types'
import { formatarCurso } from '../../utils/formatadores'

export function SolicitacoesPendentes() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { erro: mostrarErro, sucesso } = useToast()
  const { solicitacoes, carregando, erro, recarregar } = useSolicitacoesPendentesCoordenador()

  // Estado dos modais
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoOrientacao | null>(null)
  const [modalAprovarAberto, setModalAprovarAberto] = useState(false)
  const [modalRecusarAberto, setModalRecusarAberto] = useState(false)
  const [processando, setProcessando] = useState(false)

  // Estado de busca
  const [termoBusca, setTermoBusca] = useState('')

  // Refs para scroll
  const solicitacaoRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Mostrar erro via toast
  useEffect(() => {
    if (erro) {
      mostrarErro(`Erro ao carregar solicitações: ${erro}`)
    }
  }, [erro, mostrarErro])

  // Scroll para solicitação específica se ID for passado
  useEffect(() => {
    const solicitacaoId =
      (location.state as { solicitacaoId?: number })?.solicitacaoId ||
      (searchParams.get('id') ? Number(searchParams.get('id')) : null)

    if (solicitacaoId && solicitacaoRefs.current[solicitacaoId]) {
      setTimeout(() => {
        solicitacaoRefs.current[solicitacaoId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
        // Adicionar destaque temporário
        solicitacaoRefs.current[solicitacaoId]?.classList.add('ring-2', 'ring-[rgb(var(--cor-destaque))]')
        setTimeout(() => {
          solicitacaoRefs.current[solicitacaoId]?.classList.remove('ring-2', 'ring-[rgb(var(--cor-destaque))]')
        }, 2000)
      }, 300)
    }
  }, [location.state, searchParams, solicitacoes])

  // Handler para documentos
  const handleVisualizarDocumento = (url: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  // Handlers para abrir modais
  const handleAbrirModalAprovar = (solicitacao: SolicitacaoOrientacao) => {
    setSolicitacaoSelecionada(solicitacao)
    setModalAprovarAberto(true)
  }

  const handleAbrirModalRecusar = (solicitacao: SolicitacaoOrientacao) => {
    setSolicitacaoSelecionada(solicitacao)
    setModalRecusarAberto(true)
  }

  const handleFecharModais = () => {
    if (!processando) {
      setModalAprovarAberto(false)
      setModalRecusarAberto(false)
      setSolicitacaoSelecionada(null)
    }
  }

  // Handler para aprovar solicitação
  const handleAprovar = async () => {
    if (!solicitacaoSelecionada) return

    try {
      setProcessando(true)
      await api.post(`/solicitacoes/${solicitacaoSelecionada.id}/aceitar/`)

      sucesso('Solicitação aprovada com sucesso!')
      handleFecharModais()
      await recarregar()
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      mostrarErro(`Erro ao aprovar solicitação: ${mensagem}`)
    } finally {
      setProcessando(false)
    }
  }

  // Handler para recusar solicitação
  const handleRecusar = async (parecer: string) => {
    if (!solicitacaoSelecionada) return

    try {
      setProcessando(true)
      await api.post(`/solicitacoes/${solicitacaoSelecionada.id}/recusar/`, { parecer })

      sucesso('Solicitação recusada com sucesso!')
      handleFecharModais()
      await recarregar()
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      mostrarErro(`Erro ao recusar solicitação: ${mensagem}`)
    } finally {
      setProcessando(false)
    }
  }

  // Formatação de data (sem vírgula entre data e hora)
  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO)
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const horaFormatada = data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    return `${dataFormatada} ${horaFormatada}`
  }

  // Capitalizar primeira letra (doutor -> Doutor)
  const capitalizarPrimeiraLetra = (texto: string) => {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
  }

  // Filtrar solicitações por termo de busca
  const solicitacoesFiltradas = solicitacoes.filter((sol) => {
    if (!termoBusca.trim()) return true

    const termo = termoBusca.toLowerCase()
    return (
      sol.aluno_nome.toLowerCase().includes(termo) ||
      sol.aluno_email.toLowerCase().includes(termo) ||
      (sol.tcc_dados?.titulo && sol.tcc_dados.titulo.toLowerCase().includes(termo)) ||
      sol.professor_dados.nome_completo.toLowerCase().includes(termo)
    )
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Solicitações Pendentes</h1>
      </div>

      {/* Barra de busca */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--cor-icone))]" />
              <input
                type="text"
                placeholder="Buscar por aluno, e-mail, título do TCC..."
                className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="text-sm text-[rgb(var(--cor-texto-secundario))] whitespace-nowrap">
            {carregando ? (
              'Carregando...'
            ) : (
              <>
                {solicitacoesFiltradas.length}{' '}
                {solicitacoesFiltradas.length === 1 ? 'solicitação encontrada' : 'solicitações encontradas'}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {carregando ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-12">
          <div className="text-center">
            <Clock className="h-12 w-12 text-[rgb(var(--cor-icone))] animate-pulse mx-auto mb-3" />
            <p className="text-base font-semibold text-[rgb(var(--cor-texto-primario))] mb-1">Carregando...</p>
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Buscando solicitações pendentes</p>
          </div>
        </div>
      ) : solicitacoesFiltradas.length > 0 ? (
        <div className="space-y-4">
          {solicitacoesFiltradas.map((solicitacao) => {
            return (
              <div
                key={solicitacao.id}
                ref={(el) => {
                  solicitacaoRefs.current[solicitacao.id] = el
                }}
                className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6"
              >
                {/* Header com botões */}
                <div className="flex items-start justify-end gap-2 mb-4">
                  <button
                    onClick={() => handleAbrirModalAprovar(solicitacao)}
                    className="px-4 py-2 bg-[rgb(var(--cor-sucesso))] text-white rounded hover:bg-[rgb(var(--cor-sucesso))]/90 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleAbrirModalRecusar(solicitacao)}
                    className="px-4 py-2 bg-[rgb(var(--cor-erro))] text-white rounded hover:bg-[rgb(var(--cor-erro))]/90 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>

                {/* Informações completas */}
                <div className="space-y-2 text-sm">
                  {/* Grid com dados do aluno e orientador/co-orientador */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Coluna esquerda: Dados do aluno */}
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Aluno:</span>{' '}
                        <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.aluno_nome}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Email:</span>{' '}
                        <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.aluno_email}</span>
                      </div>
                      {solicitacao.aluno_curso && (
                        <div>
                          <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Curso:</span>{' '}
                          <span className="text-[rgb(var(--cor-texto-medio))]">{formatarCurso(solicitacao.aluno_curso)}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Título do TCC:</span>{' '}
                        <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.tcc_dados?.titulo || 'Título não informado'}</span>
                      </div>
                    </div>

                    {/* Coluna direita: Orientador e Co-orientador */}
                    <div className="space-y-3">
                      {/* Orientador */}
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Orientador:</span>{' '}
                          <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.professor_dados.nome_completo}</span>
                        </div>
                        {(solicitacao.professor_dados.tratamento || solicitacao.professor_dados.afiliacao) && (
                          <div>
                            {solicitacao.professor_dados.tratamento && (
                              <>
                                <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Titulação:</span>{' '}
                                <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.professor_dados.tratamento}</span>
                              </>
                            )}
                            {solicitacao.professor_dados.afiliacao && (
                              <>
                                <span className="font-semibold text-[rgb(var(--cor-texto-primario))] ml-8">Afiliação:</span>{' '}
                                <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.professor_dados.afiliacao}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Co-orientador */}
                      <div className="space-y-1">
                        {solicitacao.coorientador_nome ? (
                          <>
                            <div>
                              <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Co-orientador:</span>{' '}
                              <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.coorientador_nome}</span>
                            </div>
                            {(solicitacao.coorientador_titulacao || solicitacao.coorientador_afiliacao) && (
                              <div>
                                {solicitacao.coorientador_titulacao && (
                                  <>
                                    <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Titulação:</span>{' '}
                                    <span className="text-[rgb(var(--cor-texto-medio))]">{capitalizarPrimeiraLetra(solicitacao.coorientador_titulacao)}</span>
                                  </>
                                )}
                                {solicitacao.coorientador_afiliacao && (
                                  <>
                                    <span className="font-semibold text-[rgb(var(--cor-texto-primario))] ml-8">Afiliação:</span>{' '}
                                    <span className="text-[rgb(var(--cor-texto-medio))]">{solicitacao.coorientador_afiliacao}</span>
                                  </>
                                )}
                              </div>
                            )}
                            {solicitacao.coorientador_lattes && (
                              <div>
                                <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Lattes:</span>{' '}
                                <a
                                  href={solicitacao.coorientador_lattes}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[rgb(var(--cor-destaque))] hover:text-[rgb(var(--cor-destaque))]/80 underline"
                                >
                                  {solicitacao.coorientador_lattes}
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[rgb(var(--cor-texto-secundario))] italic">Sem co-orientador sugerido</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mensagem do aluno (se houver) */}
                  {solicitacao.mensagem && (
                    <div className="pt-1">
                      <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Mensagem do aluno:</p>
                      <p className="text-sm text-[rgb(var(--cor-texto-medio))] bg-[rgb(var(--cor-superficie-hover))] rounded p-3">
                        {solicitacao.mensagem}
                      </p>
                    </div>
                  )}

                  {/* Data da solicitação */}
                  <div>
                    <span className="font-semibold text-[rgb(var(--cor-texto-primario))]">Data da solicitação:</span>{' '}
                    <span className="text-[rgb(var(--cor-texto-medio))]">{formatarData(solicitacao.criado_em)}</span>
                  </div>
                </div>

                {/* Documentos anexados */}
                {solicitacao.documentos && solicitacao.documentos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">Documentos anexados:</p>
                    <div className="flex flex-wrap gap-2">
                      {solicitacao.documentos.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => doc.url && handleVisualizarDocumento(doc.url)}
                          className="flex items-center px-3 py-1 bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] rounded text-sm hover:bg-[rgb(var(--cor-destaque))]/20 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{doc.tipo_display}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-12">
          <div className="text-center">
            <FileText className="h-16 w-16 text-[rgb(var(--cor-icone))] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-[rgb(var(--cor-texto-secundario))]">
              {termoBusca
                ? 'Tente ajustar sua busca para encontrar solicitações.'
                : 'Quando houver novas solicitações, elas aparecerão aqui.'}
            </p>
          </div>
        </div>
      )}

      {/* Modais */}
      {modalAprovarAberto && solicitacaoSelecionada && (
        <ModalAprovarSolicitacao
          solicitacao={solicitacaoSelecionada}
          onClose={handleFecharModais}
          onConfirm={handleAprovar}
          carregando={processando}
        />
      )}

      {modalRecusarAberto && solicitacaoSelecionada && (
        <ModalRecusarSolicitacao
          solicitacao={solicitacaoSelecionada}
          onClose={handleFecharModais}
          onConfirm={handleRecusar}
          carregando={processando}
        />
      )}
    </div>
  )
}
