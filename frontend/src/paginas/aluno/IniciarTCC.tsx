/**
 * Página "Iniciar TCC" do aluno
 * Formulário para criar TCC e enviar solicitação de orientação
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, AlertCircle, MessageSquare, Save } from 'lucide-react'
import api, { extrairMensagemErro } from '../../servicos/api'
import type { Professor, CriarTCCComSolicitacaoDTO, UsuarioLogado } from '../../types'
import { SkeletonList } from '../../componentes/Skeleton'
import { useToast } from '../../contextos/ToastProvider'
import { useCalendarioSemestre } from '../../hooks'
import { prazoExpirado } from '../../utils/permissoes'
import { AlertaPrazo } from '../../componentes/AlertaPrazo'
import { formatarCurso } from '../../utils/formatadores'

interface FormData {
  titulo: string
  professor: number | null
  mensagem: string
  possuiCoorientador: boolean
  coorientadorCadastrado: boolean  // true = professor cadastrado, false = externo
  coorientador: number | null      // ID do co-orientador cadastrado
  coorientador_nome: string
  coorientador_titulacao: string
  coorientador_afiliacao: string
  coorientador_lattes: string
}

export function IniciarTCC() {
  const navigate = useNavigate()
  const { sucesso, erro } = useToast()
  const { calendario } = useCalendarioSemestre()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [coorientadores, setCoorientadores] = useState<Professor[]>([])
  const [carregandoProfessores, setCarregandoProfessores] = useState(true)
  const [carregandoCoorientadores, setCarregandoCoorientadores] = useState(true)
  const [perfilAluno, setPerfilAluno] = useState<UsuarioLogado | null>(null)
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    professor: null,
    mensagem: '',
    possuiCoorientador: false,
    coorientadorCadastrado: true,  // Por padrão, assume que é cadastrado
    coorientador: null,
    coorientador_nome: '',
    coorientador_titulacao: '',
    coorientador_afiliacao: '',
    coorientador_lattes: '',
  })
  const [planoDesenvolvimento, setPlanoDesenvolvimento] = useState<File | null>(null)
  const [termoAceite, setTermoAceite] = useState<File | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [showConfirmacao, setShowConfirmacao] = useState(false)

  // Verificar prazo de cadastro
  const prazoCadastroExpirado = prazoExpirado(calendario?.envio_documentos_fim)

  // Buscar dados básicos do usuário do localStorage como fallback
  const userBasic = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    buscarProfessores()
    buscarCoorientadores()
    buscarPerfilAluno()
  }, [])

  const buscarProfessores = async () => {
    try {
      const resposta = await api.get('/professores/')
      setProfessores(resposta.data)
    } catch (erro) {
      console.error('Erro ao buscar professores:', erro)
    } finally {
      setCarregandoProfessores(false)
    }
  }

  const buscarCoorientadores = async () => {
    try {
      const resposta = await api.get('/coorientadores/')
      setCoorientadores(resposta.data)
    } catch (erro) {
      console.error('Erro ao buscar coorientadores:', erro)
    } finally {
      setCarregandoCoorientadores(false)
    }
  }

  const buscarPerfilAluno = async () => {
    try {
      const resposta = await api.get<UsuarioLogado>('/auth/profile/')
      setPerfilAluno(resposta.data)
    } catch (erro) {
      console.error('Erro ao carregar perfil do aluno:', erro)
      // Se falhar, usa os dados básicos do localStorage
      setPerfilAluno(userBasic)
    } finally {
      setCarregandoPerfil(false)
    }
  }

  const handleLattesChange = (value: string) => {
    // Remove https:// se o usuário digitar ou colar
    let cleanValue = value.replace(/^https?:\/\//gi, '')
    setFormData({ ...formData, coorientador_lattes: cleanValue })
  }

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}

    if (!formData.titulo || formData.titulo.trim().length < 3) {
      novosErros.titulo = 'Título deve ter no mínimo 3 caracteres'
    }

    if (!formData.professor) {
      novosErros.professor = 'Selecione um orientador'
    }

    if (!planoDesenvolvimento) {
      novosErros.planoDesenvolvimento = 'Plano de desenvolvimento é obrigatório'
    } else if (planoDesenvolvimento.size > 10 * 1024 * 1024) {
      novosErros.planoDesenvolvimento = 'Arquivo não pode exceder 10MB'
    }

    if (!termoAceite) {
      novosErros.termoAceite = 'Termo de aceite é obrigatório'
    } else if (termoAceite.size > 10 * 1024 * 1024) {
      novosErros.termoAceite = 'Arquivo não pode exceder 10MB'
    }

    if (formData.possuiCoorientador) {
      if (formData.coorientadorCadastrado) {
        // Co-orientador é professor cadastrado
        if (!formData.coorientador) {
          novosErros.coorientador = 'Selecione um co-orientador'
        }
      } else {
        // Co-orientador é externo
        if (!formData.coorientador_nome.trim()) {
          novosErros.coorientador_nome = 'Nome do coorientador é obrigatório'
        }
        if (!formData.coorientador_titulacao) {
          novosErros.coorientador_titulacao = 'Selecione a titulação do coorientador'
        }
        if (!formData.coorientador_afiliacao.trim()) {
          novosErros.coorientador_afiliacao = 'Afiliação do coorientador é obrigatória'
        }
        if (!formData.coorientador_lattes.trim()) {
          novosErros.coorientador_lattes = 'Link do Currículo Lattes é obrigatório'
        }
      }
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    // Verificar prazo de envio de documentos
    if (prazoExpirado(calendario?.envio_documentos_fim)) {
      erro('Período de envio de documentos encerrado. Entre em contato com o coordenador.')
      return
    }

    setShowConfirmacao(true)
  }

  const confirmarEnvio = async () => {
    try {
      setEnviando(true)
      setErros({})

      // Obter semestre atual (formato: YYYY.S)
      const agora = new Date()
      const ano = agora.getFullYear()
      const mes = agora.getMonth() + 1
      const semestre = mes <= 6 ? 1 : 2
      const semestreAtual = `${ano}.${semestre}`

      const payload: CriarTCCComSolicitacaoDTO = {
        titulo: formData.titulo.trim(),
        semestre: semestreAtual,
        professor: formData.professor!,
        mensagem: formData.mensagem.trim(),
      }

      if (formData.possuiCoorientador) {
        if (formData.coorientadorCadastrado && formData.coorientador) {
          // Co-orientador é professor cadastrado
          (payload as any).coorientador = formData.coorientador
        } else {
          // Co-orientador é externo
          payload.coorientador_nome = formData.coorientador_nome.trim()
          payload.coorientador_titulacao = formData.coorientador_titulacao.trim()
          payload.coorientador_afiliacao = formData.coorientador_afiliacao.trim()
          // Adicionar https:// ao lattes antes de enviar
          payload.coorientador_lattes = formData.coorientador_lattes.trim()
            ? `https://${formData.coorientador_lattes.trim()}`
            : ''
        }
      }

      const resposta = await api.post('/tccs/criar_com_solicitacao/', payload)
      const tccCriado = resposta.data.tcc

      // Upload dos documentos obrigatórios
      const uploadsPromises = []

      if (planoDesenvolvimento) {
        const formDataPlano = new FormData()
        formDataPlano.append('tipo_documento', 'PLANO_DESENVOLVIMENTO')
        formDataPlano.append('arquivo', planoDesenvolvimento)
        uploadsPromises.push(
          api.post(`/tccs/${tccCriado.id}/documentos/`, formDataPlano, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        )
      }

      if (termoAceite) {
        const formDataTermo = new FormData()
        formDataTermo.append('tipo_documento', 'TERMO_ACEITE')
        formDataTermo.append('arquivo', termoAceite)
        uploadsPromises.push(
          api.post(`/tccs/${tccCriado.id}/documentos/`, formDataTermo, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        )
      }

      // Aguardar todos os uploads
      await Promise.all(uploadsPromises)

      // Verificar se ainda há pendências após uploads
      const pendencias = resposta.data.pendencias || []
      const pendenciasRestantes = pendencias.filter(
        (p: any) =>
          (p.tipo === 'PLANO_DESENVOLVIMENTO' && !planoDesenvolvimento) ||
          (p.tipo === 'TERMO_ACEITE' && !termoAceite)
      )

      // Mensagem de sucesso com informação sobre documentos
      if (pendenciasRestantes.length === 0) {
        sucesso('TCC criado e todos os documentos obrigatórios enviados com sucesso!')
      } else {
        sucesso('TCC criado com sucesso! Lembre-se de enviar os documentos obrigatórios.')
      }

      navigate('/aluno')
    } catch (err) {
      const mensagem = extrairMensagemErro(err)
      setErros({ geral: mensagem })
      erro(mensagem)
    } finally {
      setEnviando(false)
      setShowConfirmacao(false)
    }
  }

  const professorSelecionado = professores.find((p) => p.id === formData.professor)
  const coorientadorSelecionado = coorientadores.find((p) => p.id === formData.coorientador)

  // Listas filtradas: orientador e co-orientador não podem ser a mesma pessoa
  const professoresParaOrientador = useMemo(() => {
    return professores.filter(p => p.id !== formData.coorientador)
  }, [professores, formData.coorientador])

  const professoresParaCoorientador = useMemo(() => {
    return coorientadores.filter(p => p.id !== formData.professor)
  }, [coorientadores, formData.professor])

  const cursoDisplay = perfilAluno?.curso_display || formatarCurso(perfilAluno?.curso)

  const carregandoDados = carregandoProfessores || carregandoCoorientadores || carregandoPerfil

  const formatarTamanhoArquivo = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-cor-fundo p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-cor-superficie rounded-lg shadow-md p-8">
          {/* Cabeçalho com ícone */}
          <div className="flex items-center mb-6">
            <FileText className="text-cor-destaque mr-3" style={{ fontSize: '1.875rem' }} />
            <h1 className="text-2xl font-bold text-cor-texto">Iniciar TCC e solicitar orientação</h1>
          </div>

          <p className="text-cor-texto/70 mb-6">
            Preencha as informações do seu trabalho e selecione um professor orientador.
          </p>

          {/* Alerta de prazo expirado */}
          {prazoCadastroExpirado && (
            <div className="mb-6">
              <AlertaPrazo
                mensagem="Período de envio de documentos encerrado. Solicite ao coordenador a liberação manual para iniciar seu TCC."
                variant="warning"
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Erro Geral */}
            {erros.geral && (
              <div className="bg-[rgb(var(--cor-erro))]/10 border-l-4 border-[rgb(var(--cor-erro))] p-4 rounded mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[rgb(var(--cor-erro))] flex-shrink-0 mt-0.5" />
                  <p className="text-[rgb(var(--cor-erro))] text-sm">{erros.geral}</p>
                </div>
              </div>
            )}

            {/* Campos Preenchidos Automaticamente */}
            <div className="mb-6">
              <label className="block text-cor-texto font-semibold mb-2">
                Nome completo
              </label>
              <input
                type="text"
                className="w-full px-4 py-1.5 border border-cor-borda rounded-lg bg-cor-superficie opacity-60 cursor-default"
                value={perfilAluno?.nome_completo || ''}
                readOnly
              />
            </div>

            <div className="mb-6">
              <label className="block text-cor-texto font-semibold mb-2">
                E-mail
              </label>
              <input
                type="email"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                className="w-full px-4 py-1.5 border border-cor-borda rounded-lg bg-cor-superficie opacity-60 cursor-default"
                value={perfilAluno?.email || ''}
                readOnly
              />
            </div>

            <div className="mb-6">
              <label className="block text-cor-texto font-semibold mb-2">
                Curso
              </label>
              <input
                type="text"
                className="w-full px-4 py-1.5 border border-cor-borda rounded-lg bg-cor-superficie opacity-60 cursor-default"
                value={cursoDisplay}
                readOnly
              />
            </div>

            {/* Seleção de Professor */}
            <div className="mb-6">
              <label className="block text-cor-texto font-semibold mb-2">
                Professor orientador <span className="text-[rgb(var(--cor-erro))]">*</span>
              </label>
              {carregandoDados ? (
                <div className="p-4 border border-cor-borda rounded-lg">
                  <SkeletonList count={3} />
                </div>
              ) : (
                <select
                  value={formData.professor || ''}
                  onChange={(e) => setFormData({ ...formData, professor: Number(e.target.value) || null })}
                  className="w-full px-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
                  required
                >
                  <option value="">Selecione um professor...</option>
                  {professoresParaOrientador.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.nome_completo}
                    </option>
                  ))}
                </select>
              )}
              {erros.professor && <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.professor}</p>}
            </div>

            {/* Campo de Co-orientador */}
            <div className="mb-6">
              <label className="block text-cor-texto font-semibold mb-2">
                Possui co-orientador?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="coorientador"
                    value="nao"
                    checked={!formData.possuiCoorientador}
                    onChange={() => setFormData({ ...formData, possuiCoorientador: false })}
                    className="mr-2"
                  />
                  Não
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="coorientador"
                    value="sim"
                    checked={formData.possuiCoorientador}
                    onChange={() => setFormData({ ...formData, possuiCoorientador: true })}
                    className="mr-2"
                  />
                  Sim
                </label>
              </div>
            </div>

            {/* Campos do Co-orientador (condicional) */}
            {formData.possuiCoorientador && (
              <>
                {/* Pergunta: O co-orientador é cadastrado? */}
                <div className="mb-6">
                  <label className="block text-cor-texto font-semibold mb-2">
                    O co-orientador é cadastrado no sistema?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="coorientadorCadastrado"
                        value="sim"
                        checked={formData.coorientadorCadastrado}
                        onChange={() => setFormData({
                          ...formData,
                          coorientadorCadastrado: true,
                          coorientador_nome: '',
                          coorientador_titulacao: '',
                          coorientador_afiliacao: '',
                          coorientador_lattes: ''
                        })}
                        className="mr-2"
                      />
                      Sim
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="coorientadorCadastrado"
                        value="nao"
                        checked={!formData.coorientadorCadastrado}
                        onChange={() => setFormData({
                          ...formData,
                          coorientadorCadastrado: false,
                          coorientador: null
                        })}
                        className="mr-2"
                      />
                      Não
                    </label>
                  </div>
                </div>

                {/* Se co-orientador é cadastrado: mostrar select de co-orientadores */}
                {formData.coorientadorCadastrado ? (
                  <div className="mb-6">
                    <label className="block text-cor-texto font-semibold mb-2">
                      Co-orientador <span className="text-[rgb(var(--cor-erro))]">*</span>
                    </label>
                    {carregandoCoorientadores ? (
                      <div className="p-4 border border-cor-borda rounded-lg">
                        <SkeletonList count={3} />
                      </div>
                    ) : (
                      <select
                        value={formData.coorientador || ''}
                        onChange={(e) => setFormData({ ...formData, coorientador: Number(e.target.value) || null })}
                        className="w-full px-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
                        required={formData.possuiCoorientador && formData.coorientadorCadastrado}
                      >
                        <option value="">Selecione um co-orientador...</option>
                        {professoresParaCoorientador.map((professor) => (
                          <option key={professor.id} value={professor.id}>
                            {professor.nome_completo}
                          </option>
                        ))}
                      </select>
                    )}
                    {erros.coorientador && (
                      <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.coorientador}</p>
                    )}
                  </div>
                ) : (
                  /* Se co-orientador é externo: mostrar campos de texto */
                  <>
                    <div className="mb-6">
                      <label className="block text-cor-texto font-semibold mb-2">
                        Co-orientador (nome completo) <span className="text-[rgb(var(--cor-erro))]">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
                        value={formData.coorientador_nome}
                        onChange={(e) => setFormData({ ...formData, coorientador_nome: e.target.value })}
                        placeholder="Digite o nome completo do co-orientador"
                        required={formData.possuiCoorientador && !formData.coorientadorCadastrado}
                      />
                      {erros.coorientador_nome && (
                        <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.coorientador_nome}</p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-cor-texto font-semibold mb-2">
                        Link do currículo Lattes do co-orientador <span className="text-[rgb(var(--cor-erro))]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-cor-texto/50 pointer-events-none select-none">
                          https://
                        </span>
                        <input
                          type="text"
                          className="w-full pl-20 pr-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
                          value={formData.coorientador_lattes}
                          onChange={(e) => handleLattesChange(e.target.value)}
                          placeholder="lattes.cnpq.br/1234567890123456"
                          required={formData.possuiCoorientador && !formData.coorientadorCadastrado}
                        />
                      </div>
                      {erros.coorientador_lattes && (
                        <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.coorientador_lattes}</p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-cor-texto font-semibold mb-2">
                        Titulação do co-orientador <span className="text-[rgb(var(--cor-erro))]">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="titulacao"
                            value="mestre"
                            checked={formData.coorientador_titulacao === 'mestre'}
                            onChange={(e) => setFormData({ ...formData, coorientador_titulacao: e.target.value })}
                            className="mr-2"
                            required={formData.possuiCoorientador && !formData.coorientadorCadastrado}
                          />
                          Mestre
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="titulacao"
                            value="doutor"
                            checked={formData.coorientador_titulacao === 'doutor'}
                            onChange={(e) => setFormData({ ...formData, coorientador_titulacao: e.target.value })}
                            className="mr-2"
                            required={formData.possuiCoorientador && !formData.coorientadorCadastrado}
                          />
                          Doutor
                        </label>
                      </div>
                      {erros.coorientador_titulacao && (
                        <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.coorientador_titulacao}</p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-cor-texto font-semibold mb-2">
                        Afiliação do co-orientador <span className="text-[rgb(var(--cor-erro))]">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
                        value={formData.coorientador_afiliacao}
                        onChange={(e) => setFormData({ ...formData, coorientador_afiliacao: e.target.value })}
                        placeholder="Ex: UFPE, ONS, etc."
                        required={formData.possuiCoorientador && !formData.coorientadorCadastrado}
                      />
                      {erros.coorientador_afiliacao && (
                        <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.coorientador_afiliacao}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Título do TCC */}
            <div className="mb-6">
              <label className="block text-cor-texto font-semibold mb-2">
                Título do TCC <span className="text-[rgb(var(--cor-erro))]">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do seu trabalho"
                required
                minLength={3}
              />
              {erros.titulo && <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.titulo}</p>}
            </div>


            {/* Mensagem */}
            <div className="mb-6">
              <label className="flex items-center text-cor-texto font-semibold mb-2">
                <MessageSquare className="mr-2 w-4 h-4" />
                Mensagem ao coordenador (opcional)
              </label>
              <textarea
                value={formData.mensagem}
                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                placeholder=""
                rows={3}
                className="w-full px-4 py-1.5 border border-cor-borda rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque"
              />
            </div>

            {/* Upload de Documentos */}
            <div className="mb-6">
              <h3 className="text-cor-texto font-semibold mb-4">Documentos <span className="text-[rgb(var(--cor-erro))]">*</span></h3>
              <p className="text-sm text-cor-texto/70 mb-4">Ambos os documentos são obrigatórios</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Plano de Desenvolvimento */}
                <div>
                  <label className="text-sm text-cor-texto/70 block mb-2">
                    Plano de desenvolvimento <span className="text-[rgb(var(--cor-erro))]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="plano-desenvolvimento"
                      onChange={(e) => setPlanoDesenvolvimento(e.target.files?.[0] || null)}
                      accept=".pdf"
                      className="hidden"
                    />
                    {planoDesenvolvimento ? (
                      <div className="flex items-center justify-between w-full h-24 border-2 border-cor-borda border-dashed rounded-lg bg-cor-superficie px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cor-destaque font-medium truncate">
                            {planoDesenvolvimento.name}
                          </p>
                          <p className="text-xs text-cor-texto/60">
                            {formatarTamanhoArquivo(planoDesenvolvimento.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanoDesenvolvimento(null)
                            const input = document.getElementById('plano-desenvolvimento') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                          className="ml-4 px-3 py-1 bg-cor-erro text-white text-xs rounded hover:bg-cor-erro/80 transition-colors flex-shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="plano-desenvolvimento"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-cor-borda/60 border-dashed rounded-lg cursor-pointer hover:border-cor-destaque transition-colors bg-cor-superficie py-3 gap-1"
                      >
                        <Upload className="w-6 h-6 text-cor-texto/50" />
                        <p className="text-xs text-cor-texto/60">
                          Clique para selecionar o arquivo
                        </p>
                      </label>
                    )}
                  </div>
                  {erros.planoDesenvolvimento && (
                    <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.planoDesenvolvimento}</p>
                  )}
                </div>

                {/* Termo de Aceite */}
                <div>
                  <label className="text-sm text-cor-texto/70 block mb-2">
                    Termo de aceite de orientação <span className="text-[rgb(var(--cor-erro))]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="termo-aceite"
                      onChange={(e) => setTermoAceite(e.target.files?.[0] || null)}
                      accept=".pdf"
                      className="hidden"
                    />
                    {termoAceite ? (
                      <div className="flex items-center justify-between w-full h-24 border-2 border-cor-borda border-dashed rounded-lg bg-cor-superficie px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cor-destaque font-medium truncate">
                            {termoAceite.name}
                          </p>
                          <p className="text-xs text-cor-texto/60">
                            {formatarTamanhoArquivo(termoAceite.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTermoAceite(null)
                            const input = document.getElementById('termo-aceite') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                          className="ml-4 px-3 py-1 bg-cor-erro text-white text-xs rounded hover:bg-cor-erro/80 transition-colors flex-shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="termo-aceite"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-cor-borda/60 border-dashed rounded-lg cursor-pointer hover:border-cor-destaque transition-colors bg-cor-superficie py-3 gap-1"
                      >
                        <Upload className="w-6 h-6 text-cor-texto/50" />
                        <p className="text-xs text-cor-texto/60">
                          Clique para selecionar o arquivo
                        </p>
                      </label>
                    )}
                  </div>
                  {erros.termoAceite && (
                    <p className="text-[rgb(var(--cor-erro))] text-sm mt-1">{erros.termoAceite}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate('/aluno')}
                className="px-6 py-3 bg-cor-borda text-cor-texto font-semibold rounded-lg hover:bg-cor-borda/80 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || prazoCadastroExpirado}
                className="flex items-center px-6 py-3 bg-cor-destaque text-white font-semibold rounded-lg hover:bg-cor-destaque/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="mr-2 w-4 h-4" />
                {enviando ? 'Enviando...' : prazoCadastroExpirado ? 'Prazo expirado' : 'Enviar solicitação'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-cor-superficie rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-cor-texto mb-4">Confirmar envio</h3>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-cor-texto/70 text-sm">Título</p>
                <p className="font-medium text-cor-texto">{formData.titulo}</p>
              </div>

              {professorSelecionado && (
                <div>
                  <p className="text-cor-texto/70 text-sm">Orientador</p>
                  <p className="font-medium text-cor-texto">{professorSelecionado.nome_completo}</p>
                </div>
              )}

              {formData.possuiCoorientador && (
                formData.coorientadorCadastrado ? (
                  coorientadorSelecionado && (
                    <div>
                      <p className="text-cor-texto/70 text-sm">Co-orientador (cadastrado)</p>
                      <p className="font-medium text-cor-texto">{coorientadorSelecionado.nome_completo}</p>
                    </div>
                  )
                ) : (
                  formData.coorientador_nome && (
                    <div>
                      <p className="text-cor-texto/70 text-sm">Co-orientador (externo)</p>
                      <p className="font-medium text-cor-texto">{formData.coorientador_nome}</p>
                    </div>
                  )
                )
              )}

              {planoDesenvolvimento && (
                <div>
                  <p className="text-cor-texto/70 text-sm">Plano de desenvolvimento</p>
                  <p className="font-medium text-cor-texto">{planoDesenvolvimento.name}</p>
                </div>
              )}

              {termoAceite && (
                <div>
                  <p className="text-cor-texto/70 text-sm">Termo de aceite de orientação</p>
                  <p className="font-medium text-cor-texto">{termoAceite.name}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmacao(false)}
                disabled={enviando}
                className="px-4 py-2 border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={confirmarEnvio}
                disabled={enviando}
                className="px-4 py-2 bg-cor-destaque text-white rounded-lg hover:bg-cor-destaque/90 transition disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
