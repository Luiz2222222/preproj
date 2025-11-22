import { useState } from 'react'
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  User,
  X,
  ChevronRight
} from 'lucide-react'

export function BancasFase1() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  // Dados placeholder de TCCs prontos para banca
  const tccsParaBanca = [
    {
      id: '1',
      titulo: 'Sistema de Automação Residencial com IoT',
      aluno: 'João Silva',
      orientador: 'Prof. Dr. Carlos Andrade',
      curso: 'ECA',
      dataSubmissao: '15/01/2025',
      documentosOk: true,
      prazoFormacao: '22/01/2025',
      status: 'pendente'
    },
    {
      id: '2',
      titulo: 'Análise de Eficiência Energética em Motores Elétricos',
      aluno: 'Maria Santos',
      orientador: 'Prof. Dr. Roberto Lima',
      curso: 'EE',
      dataSubmissao: '14/01/2025',
      documentosOk: true,
      prazoFormacao: '21/01/2025',
      status: 'atencao'
    },
    {
      id: '3',
      titulo: 'Desenvolvimento de Sistema SCADA para Indústria 4.0',
      aluno: 'Pedro Oliveira',
      orientador: 'Prof. Dr. Fernando Souza',
      curso: 'ECA',
      dataSubmissao: '10/01/2025',
      documentosOk: false,
      prazoFormacao: '17/01/2025',
      status: 'bloqueado'
    }
  ]

  // Lista de avaliadores disponíveis (placeholder)
  const avaliadoresDisponiveis = [
    { id: '1', nome: 'Prof. Dr. Roberto Lima', departamento: 'EE', disponivel: true },
    { id: '2', nome: 'Prof. Dr. Fernando Souza', departamento: 'ECA', disponivel: true },
    { id: '3', nome: 'Prof. MSc. Ana Costa', departamento: 'EE', disponivel: false },
    { id: '4', nome: 'Prof. Dr. Paulo Mendes', departamento: 'ECA', disponivel: true },
    { id: '5', nome: 'Prof. Dr. Marcos Silva', departamento: 'EE', disponivel: true }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bloqueado':
        return 'bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] border-[rgb(var(--cor-erro))]/30'
      case 'atencao':
        return 'bg-[rgb(var(--cor-alerta))]/10 text-[rgb(var(--cor-alerta))] border-[rgb(var(--cor-alerta))]/30'
      case 'pendente':
        return 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))] border-[rgb(var(--cor-destaque))]/30'
      default:
        return 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] border-[rgb(var(--cor-borda))]'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'bloqueado':
        return <AlertCircle className="h-4 w-4" />
      case 'atencao':
        return <Clock className="h-4 w-4" />
      case 'pendente':
        return <FileText className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Formação de Bancas - Fase 1</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))]">Gerencie a formação das bancas avaliadoras para a primeira fase</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Aguardando Banca</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">8</p>
            </div>
            <Clock className="h-8 w-8 text-[rgb(var(--cor-alerta))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Bancas Formadas</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">15</p>
            </div>
            <CheckCircle className="h-8 w-8 text-[rgb(var(--cor-sucesso))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Bloqueados</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">2</p>
            </div>
            <AlertCircle className="h-8 w-8 text-[rgb(var(--cor-erro))]" />
          </div>
        </div>

        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg border border-[rgb(var(--cor-borda))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Avaliadores</p>
              <p className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">12</p>
            </div>
            <Users className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
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

      {/* Lista de TCCs */}
      <div className="space-y-4">
        {tccsParaBanca.map((tcc) => (
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
                    <Calendar className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                    <span>Submetido: {tcc.dataSubmissao}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                    <span>Prazo: {tcc.prazoFormacao}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    tcc.status
                  )}`}
                >
                  {getStatusIcon(tcc.status)}
                  {tcc.status === 'bloqueado'
                    ? 'Bloqueado'
                    : tcc.status === 'atencao'
                    ? 'Atenção'
                    : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Checklist de Pré-requisitos */}
            <div className="border-t border-[rgb(var(--cor-borda))]/30 pt-4 mb-4">
              <h4 className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-3">Pré-requisitos para Formação de Banca</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {tcc.documentosOk ? (
                    <CheckCircle className="h-4 w-4 text-[rgb(var(--cor-sucesso))]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-[rgb(var(--cor-erro))]" />
                  )}
                  <span className={`text-sm ${tcc.documentosOk ? 'text-[rgb(var(--cor-sucesso))]' : 'text-[rgb(var(--cor-erro))]'}`}>
                    Documentos obrigatórios submetidos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[rgb(var(--cor-sucesso))]" />
                  <span className="text-sm text-[rgb(var(--cor-sucesso))]">Orientador aprovou para avaliação</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[rgb(var(--cor-sucesso))]" />
                  <span className="text-sm text-[rgb(var(--cor-sucesso))]">Dentro do prazo regulamentar</span>
                </div>
              </div>
            </div>

            {/* Mensagem de alerta se bloqueado */}
            {tcc.status === 'bloqueado' && (
              <div className="bg-[rgb(var(--cor-erro))]/5 border border-[rgb(var(--cor-erro))]/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-erro))] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--cor-erro))]">Não é possível formar banca</p>
                    <p className="text-xs text-[rgb(var(--cor-erro))] mt-1">
                      O aluno ainda não submeteu todos os documentos obrigatórios.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de ação */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (tcc.status !== 'bloqueado') {
                    setShowWizard(true)
                    setWizardStep(1)
                  }
                }}
                disabled={tcc.status === 'bloqueado'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  tcc.status === 'bloqueado'
                    ? 'bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                <Users className="h-4 w-4" />
                Formar Banca
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal/Wizard de Formação de Banca */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[rgb(var(--cor-borda))]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Formar Banca Avaliadora - Fase 1</h2>
                <button
                  onClick={() => setShowWizard(false)}
                  className="p-2 text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Steps indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 h-1 rounded-full ${wizardStep >= 1 ? 'bg-primary-500' : 'bg-[rgb(var(--cor-borda))]'}`}
                ></div>
                <div
                  className={`flex-1 h-1 rounded-full ${wizardStep >= 2 ? 'bg-primary-500' : 'bg-[rgb(var(--cor-borda))]'}`}
                ></div>
                <div
                  className={`flex-1 h-1 rounded-full ${wizardStep >= 3 ? 'bg-primary-500' : 'bg-[rgb(var(--cor-borda))]'}`}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-[rgb(var(--cor-texto-secundario))]">
                <span className={wizardStep >= 1 ? 'font-medium text-primary-600' : ''}>1. Verificação</span>
                <span className={wizardStep >= 2 ? 'font-medium text-primary-600' : ''}>2. Avaliadores</span>
                <span className={wizardStep >= 3 ? 'font-medium text-primary-600' : ''}>3. Confirmação</span>
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Verificação */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Informações do TCC</h3>
                    <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Título</p>
                        <p className="font-medium text-[rgb(var(--cor-texto-primario))]">Sistema de Automação Residencial com IoT</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Aluno</p>
                          <p className="font-medium text-[rgb(var(--cor-texto-primario))]">João Silva</p>
                        </div>
                        <div>
                          <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">Orientador</p>
                          <p className="font-medium text-[rgb(var(--cor-texto-primario))]">Prof. Dr. Carlos Andrade</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Checklist de Pré-requisitos</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-[rgb(var(--cor-sucesso))]/5 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-[rgb(var(--cor-sucesso))]" />
                        <span className="text-sm text-[rgb(var(--cor-sucesso))]">Todos os documentos foram submetidos</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[rgb(var(--cor-sucesso))]/5 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-[rgb(var(--cor-sucesso))]" />
                        <span className="text-sm text-[rgb(var(--cor-sucesso))]">Orientador aprovou para avaliação</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[rgb(var(--cor-sucesso))]/5 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-[rgb(var(--cor-sucesso))]" />
                        <span className="text-sm text-[rgb(var(--cor-sucesso))]">Prazo regulamentar respeitado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Seleção de Avaliadores */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Selecione os Avaliadores</h3>
                    <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-4">Selecione 2 ou 3 avaliadores para compor a banca</p>

                    <div className="space-y-2">
                      {avaliadoresDisponiveis.map((avaliador) => (
                        <div
                          key={avaliador.id}
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                            avaliador.disponivel
                              ? 'border-[rgb(var(--cor-borda))] hover:border-primary-500 hover:bg-primary-50'
                              : 'border-[rgb(var(--cor-borda))]/50 bg-[rgb(var(--cor-fundo))] cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              disabled={!avaliador.disponivel}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-[rgb(var(--cor-borda))] rounded"
                            />
                            <div>
                              <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{avaliador.nome}</p>
                              <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{avaliador.departamento}</p>
                            </div>
                          </div>
                          {!avaliador.disponivel && (
                            <span className="text-xs text-[rgb(var(--cor-texto-secundario))] bg-[rgb(var(--cor-fundo))] px-2 py-1 rounded">
                              Indisponível
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Data e Horário (opcional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Data da Defesa</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1">Horário</label>
                        <input
                          type="time"
                          className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="—"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmação */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-[rgb(var(--cor-sucesso))]/5 border border-[rgb(var(--cor-sucesso))]/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[rgb(var(--cor-sucesso))] mt-0.5" />
                      <div>
                        <h3 className="text-lg font-semibold text-[rgb(var(--cor-sucesso))] mb-2">Banca Pronta para Formação</h3>
                        <p className="text-sm text-[rgb(var(--cor-sucesso))]">
                          Revise as informações abaixo antes de confirmar a formação da banca.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-3">Composição da Banca</h3>
                    <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                        <span className="text-sm text-[rgb(var(--cor-texto-primario))]">Prof. Dr. Roberto Lima (Avaliador 1)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                        <span className="text-sm text-[rgb(var(--cor-texto-primario))]">Prof. Dr. Paulo Mendes (Avaliador 2)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-3">Data e Horário</h3>
                    <div className="bg-[rgb(var(--cor-fundo))] rounded-lg p-4">
                      <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">A definir</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer com botões */}
            <div className="p-6 border-t border-[rgb(var(--cor-borda))] flex justify-between">
              <button
                onClick={() => {
                  if (wizardStep > 1) {
                    setWizardStep(wizardStep - 1)
                  } else {
                    setShowWizard(false)
                  }
                }}
                className="px-4 py-2 text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition"
              >
                {wizardStep === 1 ? 'Cancelar' : 'Voltar'}
              </button>
              <button
                onClick={() => {
                  if (wizardStep < 3) {
                    setWizardStep(wizardStep + 1)
                  } else {
                    // Confirmar formação
                    setShowWizard(false)
                  }
                }}
                className="px-6 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition flex items-center gap-2"
              >
                {wizardStep === 3 ? 'Confirmar Formação' : 'Próximo'}
                {wizardStep < 3 && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
