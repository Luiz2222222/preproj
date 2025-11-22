import { useState } from 'react'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  Star,
  Download,
  X,
  Send,
  Edit
} from 'lucide-react'

export function AvaliacaoFase1() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSolicitarAjustes, setShowSolicitarAjustes] = useState(false)
  const [showAprovar, setShowAprovar] = useState(false)

  // TCCs aguardando pareceres
  const aguardandoPareceres = [
    {
      id: '1',
      titulo: 'Sistema de Automação Residencial com IoT',
      aluno: 'João Silva',
      orientador: 'Prof. Dr. Carlos Andrade',
      dataSubmissao: '15/01/2025',
      prazoAvaliacao: '22/01/2025',
      pareceres: {
        total: 2,
        recebidos: 1,
        pendentes: 1
      },
      status: 'aguardando'
    },
    {
      id: '2',
      titulo: 'Análise de Eficiência Energética em Motores Elétricos',
      aluno: 'Maria Santos',
      orientador: 'Prof. Dr. Roberto Lima',
      dataSubmissao: '14/01/2025',
      prazoAvaliacao: '21/01/2025',
      pareceres: {
        total: 2,
        recebidos: 0,
        pendentes: 2
      },
      status: 'aguardando'
    }
  ]

  // TCCs prontos para análise final
  const prontosAnalise = [
    {
      id: '3',
      titulo: 'Desenvolvimento de Sistema SCADA para Indústria 4.0',
      aluno: 'Pedro Oliveira',
      orientador: 'Prof. Dr. Fernando Souza',
      dataSubmissao: '10/01/2025',
      dataAvaliacao: '17/01/2025',
      pareceres: [
        {
          avaliador: 'Prof. Dr. Roberto Lima',
          nota: 8.5,
          parecer: 'Trabalho bem estruturado com boa fundamentação teórica. Recomendo aprovação.',
          data: '16/01/2025',
          recomendacao: 'aprovado'
        },
        {
          avaliador: 'Prof. Dr. Paulo Mendes',
          nota: 9.0,
          parecer: 'Excelente trabalho. Demonstra domínio do tema e aplicação prática adequada.',
          data: '17/01/2025',
          recomendacao: 'aprovado'
        }
      ],
      media: 8.75,
      status: 'pronto'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aguardando':
        return 'bg-[rgb(var(--cor-alerta))]/5 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/20'
      case 'pronto':
        return 'bg-[rgb(var(--cor-sucesso))]/5 text-[rgb(var(--cor-sucesso))] border-[rgb(var(--cor-sucesso))]/20'
      default:
        return 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] border-[rgb(var(--cor-borda))]'
    }
  }

  const getRecomendacaoBadge = (recomendacao: string) => {
    switch (recomendacao) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-sucesso))]/10 text-[rgb(var(--cor-sucesso))]">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </span>
        )
      case 'ajustes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))]">
            <AlertCircle className="h-3 w-3" />
            Com Ajustes
          </span>
        )
      case 'reprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))]">
            <X className="h-3 w-3" />
            Reprovado
          </span>
        )
      default:
        return null
    }
  }

  const renderStars = (nota: number) => {
    const stars = Math.round((nota / 10) * 5)
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < stars ? 'fill-[rgb(var(--cor-alerta))] text-[rgb(var(--cor-alerta))]' : 'text-[rgb(var(--cor-borda))]'}`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{nota.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Avaliação Fase 1</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))]">Gerencie as avaliações e pareceres da primeira fase dos TCCs</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Aguardando Pareceres</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">8</p>
            </div>
            <Clock className="h-8 w-8 text-[rgb(var(--cor-alerta))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Pronto para Analisar</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">4</p>
            </div>
            <CheckCircle className="h-8 w-8 text-[rgb(var(--cor-sucesso))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Aprovados</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">12</p>
            </div>
            <CheckCircle className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Com Ajustes</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">3</p>
            </div>
            <AlertCircle className="h-8 w-8 text-[rgb(var(--cor-alerta))]" />
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--cor-icone))]" />
          <input
            type="text"
            placeholder="Buscar por título ou aluno..."
            className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Seção: Aguardando Pareceres */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Aguardando Pareceres</h2>
        <div className="space-y-4">
          {aguardandoPareceres.map((tcc) => (
            <div key={tcc.id} className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">{tcc.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--cor-texto-secundario))]">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                      <span>
                        <strong>Aluno:</strong> {tcc.aluno}
                      </span>
                    </div>
                    <div>
                      <span>
                        <strong>Orientador:</strong> {tcc.orientador}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                      <span>Prazo: {tcc.prazoAvaliacao}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    tcc.status
                  )}`}
                >
                  <Clock className="h-4 w-4" />
                  Aguardando
                </span>
              </div>

              <div className="bg-[rgb(var(--cor-alerta))]/5 border border-[rgb(var(--cor-alerta))]/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--cor-alerta))]">
                      Pareceres: {tcc.pareceres.recebidos}/{tcc.pareceres.total}
                    </p>
                    <p className="text-xs text-[rgb(var(--cor-alerta))] mt-1">
                      {tcc.pareceres.pendentes} parecer(es) pendente(s)
                    </p>
                  </div>
                  <button
                    onClick={() => {}}
                    className="px-3 py-1.5 text-xs bg-[rgb(var(--cor-alerta))] text-white hover:bg-[rgb(var(--cor-alerta))]/90 rounded-lg transition flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    Enviar Lembrete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção: Pronto para Analisar */}
      <div>
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Pronto para Análise Final</h2>
        <div className="space-y-4">
          {prontosAnalise.map((tcc) => (
            <div key={tcc.id} className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-2">{tcc.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--cor-texto-secundario))]">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                      <span>
                        <strong>Aluno:</strong> {tcc.aluno}
                      </span>
                    </div>
                    <div>
                      <span>
                        <strong>Orientador:</strong> {tcc.orientador}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      tcc.status
                    )}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Pronto
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[rgb(var(--cor-texto-secundario))]">Média:</span>
                    <span className="text-2xl font-bold text-[rgb(var(--cor-sucesso))]">{tcc.media.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pareceres individuais */}
              <div className="space-y-3 mb-4">
                {tcc.pareceres.map((parecer, index) => (
                  <div key={index} className="border border-[rgb(var(--cor-borda))] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{parecer.avaliador}</p>
                          {getRecomendacaoBadge(parecer.recomendacao)}
                        </div>
                        {renderStars(parecer.nota)}
                      </div>
                      <span className="text-xs text-[rgb(var(--cor-texto-secundario))]">{parecer.data}</span>
                    </div>
                    <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mt-2">{parecer.parecer}</p>
                  </div>
                ))}
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {}}
                  className="px-4 py-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Pareceres
                </button>
                <button
                  onClick={() => setShowSolicitarAjustes(true)}
                  className="px-4 py-2 bg-[rgb(var(--cor-alerta))] text-white hover:bg-[rgb(var(--cor-alerta))]/90 rounded-lg transition flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Solicitar Ajustes
                </button>
                <button
                  onClick={() => setShowAprovar(true)}
                  className="px-4 py-2 bg-[rgb(var(--cor-sucesso))] text-white hover:bg-[rgb(var(--cor-sucesso))]/90 rounded-lg transition flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar Fase 1
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Solicitar Ajustes */}
      {showSolicitarAjustes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-[rgb(var(--cor-borda))]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Solicitar Ajustes</h2>
                <button
                  onClick={() => setShowSolicitarAjustes(false)}
                  className="p-2 text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                    Descreva os ajustes necessários
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Detalhe quais aspectos do trabalho precisam ser ajustados..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">Prazo para ajustes</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[rgb(var(--cor-borda))] flex justify-end gap-3">
              <button
                onClick={() => setShowSolicitarAjustes(false)}
                className="px-4 py-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowSolicitarAjustes(false)}
                className="px-6 py-2 bg-[rgb(var(--cor-alerta))] text-white hover:bg-[rgb(var(--cor-alerta))]/90 rounded-lg transition flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aprovar Fase 1 */}
      {showAprovar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-[rgb(var(--cor-borda))]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Aprovar Fase 1</h2>
                <button
                  onClick={() => setShowAprovar(false)}
                  className="p-2 text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-[rgb(var(--cor-sucesso))]/5 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-[rgb(var(--cor-sucesso))] mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-sucesso))] mb-2">Confirmar Aprovação</h3>
                    <p className="text-sm text-[rgb(var(--cor-sucesso))]">
                      Você está prestes a aprovar o TCC para prosseguir para a próxima fase. Esta ação não poderá ser
                      desfeita.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-3">Resumo da Avaliação</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Média das Notas:</span>
                      <span className="font-bold text-[rgb(var(--cor-texto-primario))]">8.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Pareceres Favoráveis:</span>
                      <span className="font-bold text-[rgb(var(--cor-texto-primario))]">2/2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[rgb(var(--cor-texto-secundario))]">Status:</span>
                      <span className="font-bold text-[rgb(var(--cor-sucesso))]">Aprovado</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                    Observações da coordenação (opcional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Adicione observações sobre a aprovação..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[rgb(var(--cor-borda))] flex justify-end gap-3">
              <button
                onClick={() => setShowAprovar(false)}
                className="px-4 py-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAprovar(false)}
                className="px-6 py-2 bg-[rgb(var(--cor-sucesso))] text-white hover:bg-[rgb(var(--cor-sucesso))]/90 rounded-lg transition flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
