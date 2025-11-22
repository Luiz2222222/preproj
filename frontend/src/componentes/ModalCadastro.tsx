import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Alerta } from './Alerta'

const API_BASE_URL = 'http://localhost:8111/api'

interface ModalCadastroProps {
  onClose: () => void
  onSuccess?: () => void
}

interface DadosFormulario {
  nome_completo: string
  email: string
  senha: string
  confirmar_senha: string
  codigo_cadastro: string
  // Campos específicos
  curso?: string
  tratamento?: string
  tratamento_customizado?: string
  departamento?: string
  afiliacao?: string
  afiliacao_customizada?: string
}

interface TipoUsuario {
  value: string
  label: string
  icon: string
  descricao: string
}

export function ModalCadastro({ onClose, onSuccess }: ModalCadastroProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('')
  const [dadosFormulario, setDadosFormulario] = useState<DadosFormulario>({
    nome_completo: '',
    email: '',
    senha: '',
    confirmar_senha: '',
    codigo_cadastro: ''
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [formularioValidado, setFormularioValidado] = useState(false)

  const tiposUsuario: TipoUsuario[] = [
    {
      value: 'aluno',
      label: 'Aluno',
      icon: '👨‍🎓',
      descricao: 'Estudante de graduacao'
    },
    {
      value: 'professor',
      label: 'Professor',
      icon: '👨‍🏫',
      descricao: 'Docente orientador'
    },
    {
      value: 'avaliador',
      label: 'Avaliador Externo',
      icon: '🏢',
      descricao: 'Membro externo de banca'
    }
  ]

  const validarFormulario = (): boolean => {
    if (!dadosFormulario.nome_completo.trim()) {
      setErro('Nome completo eh obrigatorio')
      return false
    }
    if (!dadosFormulario.email.trim()) {
      setErro('Email eh obrigatorio')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosFormulario.email)) {
      setErro('Email invalido')
      return false
    }
    if (!dadosFormulario.senha) {
      setErro('Senha eh obrigatoria')
      return false
    }
    if (dadosFormulario.senha.length < 6) {
      setErro('Senha deve ter no minimo 6 caracteres')
      return false
    }
    if (dadosFormulario.senha !== dadosFormulario.confirmar_senha) {
      setErro('As senhas nao coincidem')
      return false
    }
    if (!dadosFormulario.codigo_cadastro.trim()) {
      setErro('Codigo de cadastro eh obrigatorio')
      return false
    }

    // Validações específicas por tipo
    if (tipoSelecionado === 'aluno' && !dadosFormulario.curso) {
      setErro('Curso eh obrigatorio')
      return false
    }
    if (tipoSelecionado === 'professor') {
      if (!dadosFormulario.tratamento) {
        setErro('Tratamento eh obrigatorio')
        return false
      }
      if (!dadosFormulario.departamento?.trim()) {
        setErro('Departamento eh obrigatorio')
        return false
      }
    }
    if (tipoSelecionado === 'avaliador') {
      if (!dadosFormulario.tratamento) {
        setErro('Tratamento eh obrigatorio')
        return false
      }
      if (!dadosFormulario.afiliacao?.trim()) {
        setErro('Afiliacao eh obrigatoria')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setSucesso('')

    // Marcar formulário como validado
    setFormularioValidado(true)

    if (!validarFormulario()) {
      return
    }

    setCarregando(true)

    try {
      const payload = {
        nome_completo: dadosFormulario.nome_completo,
        email: dadosFormulario.email,
        senha: dadosFormulario.senha,
        confirmar_senha: dadosFormulario.confirmar_senha,
        codigo_cadastro: dadosFormulario.codigo_cadastro,
        ...(tipoSelecionado === 'aluno' && { curso: dadosFormulario.curso }),
        ...(tipoSelecionado === 'professor' && {
          tratamento: dadosFormulario.tratamento,
          ...(dadosFormulario.tratamento === 'Outro' && { tratamento_customizado: dadosFormulario.tratamento_customizado }),
          departamento: dadosFormulario.departamento
        }),
        ...(tipoSelecionado === 'avaliador' && {
          tratamento: dadosFormulario.tratamento,
          ...(dadosFormulario.tratamento === 'Outro' && { tratamento_customizado: dadosFormulario.tratamento_customizado }),
          afiliacao: dadosFormulario.afiliacao,
          ...(dadosFormulario.afiliacao === 'Outro' && { afiliacao_customizada: dadosFormulario.afiliacao_customizada })
        })
      }

      const resposta = await fetch(`${API_BASE_URL}/auth/registro/${tipoSelecionado}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!resposta.ok) {
        const dadosErro = await resposta.json()

        // Tratar erros específicos do backend
        if (dadosErro.email) {
          setErro(Array.isArray(dadosErro.email) ? dadosErro.email[0] : dadosErro.email)
        } else if (dadosErro.codigo_cadastro) {
          setErro(Array.isArray(dadosErro.codigo_cadastro) ? dadosErro.codigo_cadastro[0] : dadosErro.codigo_cadastro)
        } else if (dadosErro.senha) {
          setErro(Array.isArray(dadosErro.senha) ? dadosErro.senha[0] : dadosErro.senha)
        } else if (dadosErro.detail) {
          setErro(dadosErro.detail)
        } else if (dadosErro.non_field_errors) {
          setErro(Array.isArray(dadosErro.non_field_errors) ? dadosErro.non_field_errors[0] : dadosErro.non_field_errors)
        } else {
          setErro('Erro ao criar conta. Verifique os dados informados.')
        }
        setCarregando(false)
        return
      }

      setSucesso('Conta criada com sucesso!')
      setCarregando(false)

      // Chamar callback de sucesso se fornecido
      onSuccess?.()

      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      setErro('Erro de conexao. Tente novamente.')
      setCarregando(false)
    }
  }

  const obterCamposFormulario = () => {
    const camposComuns = [
      { name: 'nome_completo', label: 'Nome completo', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true }
    ]

    const camposEspecificos = []

    if (tipoSelecionado === 'aluno') {
      camposEspecificos.push({
        name: 'curso',
        label: 'Curso',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecione...' },
          { value: 'ENGENHARIA_ELETRICA', label: 'Engenharia Elétrica' },
          { value: 'ENGENHARIA_CONTROLE_AUTOMACAO', label: 'Engenharia de Controle e Automação' }
        ]
      })
    }

    if (tipoSelecionado === 'professor') {
      camposEspecificos.push(
        {
          name: 'tratamento',
          label: 'Tratamento',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Selecione...' },
            { value: 'Prof. Dr.', label: 'Prof. Dr.' },
            { value: 'Prof. Ms.', label: 'Prof. Ms.' },
            { value: 'Prof.', label: 'Prof.' },
            { value: 'Dr.', label: 'Dr.' },
            { value: 'Outro', label: 'Outro' }
          ]
        }
      )

      // Campo condicional para tratamento customizado
      if (dadosFormulario.tratamento === 'Outro') {
        camposEspecificos.push({
          name: 'tratamento_customizado',
          label: 'Especifique o tratamento',
          type: 'text',
          required: true,
          placeholder: 'Digite o tratamento'
        })
      }

      camposEspecificos.push({
        name: 'departamento',
        label: 'Departamento',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecione...' },
          { value: 'Departamento de Engenharia Elétrica', label: 'Departamento de Engenharia Elétrica' },
          { value: 'Departamento de Controle e Automação', label: 'Departamento de Controle e Automação' }
        ]
      })
    }

    if (tipoSelecionado === 'avaliador') {
      camposEspecificos.push({
        name: 'tratamento',
        label: 'Tratamento',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecione...' },
          { value: 'Prof. Dr.', label: 'Prof. Dr.' },
          { value: 'Prof. Ms.', label: 'Prof. Ms.' },
          { value: 'Dr.', label: 'Dr.' },
          { value: 'Eng.', label: 'Eng.' },
          { value: 'Outro', label: 'Outro' }
        ]
      })

      // Campo condicional para tratamento customizado
      if (dadosFormulario.tratamento === 'Outro') {
        camposEspecificos.push({
          name: 'tratamento_customizado',
          label: 'Especifique o tratamento',
          type: 'text',
          required: true,
          placeholder: 'Digite o tratamento'
        })
      }

      camposEspecificos.push({
        name: 'afiliacao',
        label: 'Afiliação',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Selecione...' },
          { value: 'Universidade Federal de Pernambuco', label: 'Universidade Federal de Pernambuco' },
          { value: 'UFRPE', label: 'UFRPE' },
          { value: 'IFPE', label: 'IFPE' },
          { value: 'Outro', label: 'Outro' }
        ]
      })

      // Campo condicional para afiliacao customizada
      if (dadosFormulario.afiliacao === 'Outro') {
        camposEspecificos.push({
          name: 'afiliacao_customizada',
          label: 'Especifique a afiliação',
          type: 'text',
          required: true,
          placeholder: 'Digite a instituição'
        })
      }
    }

    const camposSenha = [
      { name: 'codigo_cadastro', label: 'Código de cadastro', type: 'text', required: true, placeholder: 'Fornecido pela coordenacao' },
      { name: 'senha', label: 'Senha', type: 'password', required: true },
      { name: 'confirmar_senha', label: 'Confirmar senha', type: 'password', required: true }
    ]

    return [...camposComuns, ...camposEspecificos, ...camposSenha]
  }

  const tipoAtual = tiposUsuario.find(t => t.value === tipoSelecionado)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-cor-superficie rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-cor-borda">
        {/* Cabeçalho fixo */}
        <div className="p-6 pb-0 bg-cor-superficie rounded-t-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-cor-texto">
              Cadastrar Nova Conta
            </h3>
            <button
              onClick={onClose}
              className="text-cor-texto opacity-60 hover:opacity-100 transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {erro && (
            <div className="mb-4">
              <Alerta tipo="erro">
                {erro}
              </Alerta>
            </div>
          )}

          {sucesso && (
            <div className="mb-4">
              <Alerta tipo="sucesso">
                {sucesso}
              </Alerta>
            </div>
          )}

          {tipoSelecionado && (
            <div className="flex items-center justify-between mb-6 p-3 bg-cor-destaque/10 rounded-lg border border-cor-borda">
              <span className="text-sm text-cor-texto opacity-75">
                Cadastro como: <strong className="text-cor-destaque">{tipoAtual?.label}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTipoSelecionado('')
                  setFormularioValidado(false)
                  setDadosFormulario({
                    nome_completo: '',
                    email: '',
                    senha: '',
                    confirmar_senha: '',
                    codigo_cadastro: ''
                  })
                  setErro('')
                  setSucesso('')
                }}
                className="text-xs text-cor-destaque hover:opacity-90 font-medium"
              >
                Alterar
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {!tipoSelecionado ? (
            <div>
              <p className="text-sm text-cor-texto opacity-60 mb-6">
                Selecione o tipo de conta que deseja criar:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {tiposUsuario.map((tipo, index) => (
                  <button
                    key={tipo.value}
                    onClick={() => setTipoSelecionado(tipo.value)}
                    className={`p-4 border-2 border-cor-borda rounded-xl hover:border-cor-destaque hover:bg-cor-destaque/10 text-center transition-all duration-200 group ${index === 2 ? 'col-span-2 mx-auto max-w-[50%]' : ''}`}
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      {tipo.icon}
                    </div>
                    <div className="text-sm font-semibold text-cor-texto">
                      {tipo.label}
                    </div>
                    <div className="text-xs text-cor-texto opacity-60 mt-1">
                      {tipo.descricao}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={`space-y-4 ${formularioValidado ? 'was-validated' : ''}`}
              noValidate
            >

              {obterCamposFormulario().map((campo: any) => (
                <div key={campo.name}>
                  <label className="block text-sm font-medium text-cor-texto mb-1">
                    {campo.label}
                    {campo.required && <span className="text-cor-erro ml-1">*</span>}
                  </label>

                  {campo.type === 'select' ? (
                    <select
                      required={campo.required}
                      value={(dadosFormulario as any)[campo.name] || ''}
                      onChange={(e) => setDadosFormulario({ ...dadosFormulario, [campo.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cor-destaque focus:border-cor-destaque"
                    >
                      {campo.options.map((option: any) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={campo.type}
                      required={campo.required}
                      placeholder={campo.placeholder}
                      value={(dadosFormulario as any)[campo.name] || ''}
                      onChange={(e) => setDadosFormulario({ ...dadosFormulario, [campo.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cor-destaque focus:border-cor-destaque"
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={carregando}
                  className="flex-1 py-2.5 px-4 border border-cor-borda rounded-lg text-cor-texto hover:bg-cor-superficie/80 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="flex-1 py-2.5 px-4 bg-cor-destaque text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
