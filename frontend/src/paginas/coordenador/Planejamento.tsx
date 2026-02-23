import { useState, useEffect } from 'react'
import { Calendar, Save, Loader2, FileText, Upload, Download, Mail, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react'
import { useToast } from '../../contextos/ToastProvider'
import { useCalendarioSemestre } from '../../hooks'
import {
  salvarCalendario,
  criarCalendario,
  listarCodigosCadastro,
  atualizarCodigoCadastro
} from '../../servicos/calendario'
import {
  listarDocumentosReferencia,
  uploadDocumentoReferencia,
  atualizarDocumentoReferencia,
  removerDocumentoReferencia,
  type DocumentoReferencia
} from '../../servicos/documentos'
import { exportarDados, baixarArquivoZip, verificarEmailReset, resetarPeriodo } from '../../servicos/tccs'
import {
  obterConfiguracaoEmail,
  atualizarConfiguracaoEmail,
  obterSenhaReal,
  type ConfiguracaoEmail
} from '../../servicos/configuracaoEmail'
import type { CodigoCadastro, CalendarioSemestre } from '../../types'

export function Planejamento() {
  const { sucesso, erro: mostrarErro } = useToast()
  const { calendario, recarregar } = useCalendarioSemestre()

  // Função para parsear número brasileiro (com vírgula)
  const parseBR = (valor: string): number | null => {
    if (valor === '') return null;
    const valorNormalizado = valor.replace(',', '.');
    const num = parseFloat(valorNormalizado);
    return isNaN(num) ? null : num;
  };

  // Função clampScore - aceita estados intermediários e formata
  const clampScore = (raw: string, max: number, currentValue: string): string => {
    if (raw === '') return '';

    let cleaned = raw.replace(/[^\d,.]/g, '');
    cleaned = cleaned.replace(/\./g, ',');

    const virgulaCount = (cleaned.match(/,/g) || []).length;
    if (virgulaCount > 1) {
      return currentValue;
    }

    const regex = /^[0-9]{0,2}(,[0-9]{0,2})?$/;
    if (!regex.test(cleaned)) {
      return currentValue;
    }

    const num = parseBR(cleaned);
    if (num !== null && !cleaned.endsWith(',')) {
      const clamped = Math.max(0, Math.min(num, max));
      return clamped.toString().replace('.', ',');
    }

    return cleaned;
  };

  // Estados para o calendário
  const [semestre, setSemestre] = useState('')
  const [envioDatas, setEnvioDatas] = useState({
    reuniao_alunos: '',
    envio_documentos_fim: '',
    submissao_monografia_fim: '',
    avaliacao_continuidade_fim: '',
    preparacao_bancas_fase1_inicio: '',
    preparacao_bancas_fase1_fim: '',
    avaliacao_fase1_fim: '',
    preparacao_bancas_fase2: '',
    defesas_fim: '',
    ajustes_finais_fim: ''
  })

  // Estados para os pesos de avaliação da Fase I
  const [pesos, setPesos] = useState({
    peso_resumo: '1.0',
    peso_introducao: '2.0',
    peso_revisao: '2.0',
    peso_desenvolvimento: '3.5',
    peso_conclusoes: '1.5'
  })

  // Estados para os pesos de avaliação da Fase II
  const [pesosFase2, setPesosFase2] = useState({
    peso_coerencia_conteudo: '2.0',
    peso_qualidade_apresentacao: '2.0',
    peso_dominio_tema: '2.5',
    peso_clareza_fluencia: '2.5',
    peso_observancia_tempo: '1.0'
  })

  // Estados para os códigos
  const [codigos, setCodigos] = useState<CodigoCadastro[]>([])
  const [codigoAluno, setCodigoAluno] = useState('')
  const [codigoProfessor, setCodigoProfessor] = useState('')
  const [codigoAvaliador, setCodigoAvaliador] = useState('')

  // Estados para documentos de referência
  const [documentos, setDocumentos] = useState<DocumentoReferencia[]>([])
  const [arquivosSelecionados, setArquivosSelecionados] = useState<Record<string, File | null>>({})
  const [arquivosRemovidos, setArquivosRemovidos] = useState<Record<string, boolean>>({})

  // Estados para configuração de e-mail
  const [configEmail, setConfigEmail] = useState<ConfiguracaoEmail | null>(null)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailHost, setEmailHost] = useState('smtp.gmail.com')
  const [emailPort, setEmailPort] = useState(587)
  const [emailUseTls, setEmailUseTls] = useState(true)
  const [emailHostUser, setEmailHostUser] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  // Estados de carregamento
  const [carregandoCodigos, setCarregandoCodigos] = useState(true)
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(true)
  const [carregandoEmail, setCarregandoEmail] = useState(true)
  const [salvandoEmail, setSalvandoEmail] = useState(false)
  const [salvandoTudo, setSalvandoTudo] = useState(false)
  const [exportandoDados, setExportandoDados] = useState(false)
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false)
  const [baixarDados, setBaixarDados] = useState(true)
  const [baixarMonografia, setBaixarMonografia] = useState(true)
  const [baixarDocumentos, setBaixarDocumentos] = useState(true)

  // Estados para resetar período
  const [modalConfirmacao, setModalConfirmacao] = useState(false)
  const [textoConfirmacao, setTextoConfirmacao] = useState('')
  const [modalSenha, setModalSenha] = useState(false)
  const [senhaReset, setSenhaReset] = useState('')
  const [modalEmail, setModalEmail] = useState(false)
  const [emailReset, setEmailReset] = useState('')
  const [resetando, setResetando] = useState(false)

  // Carregar códigos e documentos ao montar
  useEffect(() => {
    carregarCodigos()
    carregarDocumentos()
    carregarConfigEmail()
  }, [])

  // Preencher campos quando calendário carregar
  useEffect(() => {
    if (calendario) {
      setSemestre(calendario.semestre || '')
      setEnvioDatas({
        reuniao_alunos: calendario.reuniao_alunos || '',
        envio_documentos_fim: calendario.envio_documentos_fim || '',
        submissao_monografia_fim: calendario.submissao_monografia_fim || '',
        avaliacao_continuidade_fim: calendario.avaliacao_continuidade_fim || '',
        preparacao_bancas_fase1_inicio: calendario.preparacao_bancas_fase1_inicio || '',
        preparacao_bancas_fase1_fim: calendario.preparacao_bancas_fase1_fim || '',
        avaliacao_fase1_fim: calendario.avaliacao_fase1_fim || '',
        preparacao_bancas_fase2: calendario.preparacao_bancas_fase2 || '',
        defesas_fim: calendario.defesas_fim || '',
        ajustes_finais_fim: calendario.ajustes_finais_fim || ''
      })
      setPesos({
        peso_resumo: calendario.peso_resumo?.toString().replace('.', ',') || '1,0',
        peso_introducao: calendario.peso_introducao?.toString().replace('.', ',') || '2,0',
        peso_revisao: calendario.peso_revisao?.toString().replace('.', ',') || '2,0',
        peso_desenvolvimento: calendario.peso_desenvolvimento?.toString().replace('.', ',') || '3,5',
        peso_conclusoes: calendario.peso_conclusoes?.toString().replace('.', ',') || '1,5'
      })
      setPesosFase2({
        peso_coerencia_conteudo: calendario.peso_coerencia_conteudo?.toString().replace('.', ',') || '2,0',
        peso_qualidade_apresentacao: calendario.peso_qualidade_apresentacao?.toString().replace('.', ',') || '2,0',
        peso_dominio_tema: calendario.peso_dominio_tema?.toString().replace('.', ',') || '2,5',
        peso_clareza_fluencia: calendario.peso_clareza_fluencia?.toString().replace('.', ',') || '2,5',
        peso_observancia_tempo: calendario.peso_observancia_tempo?.toString().replace('.', ',') || '1,0'
      })
    }
  }, [calendario])

  // Carregar códigos
  const carregarCodigos = async () => {
    try {
      setCarregandoCodigos(true)
      const data = await listarCodigosCadastro()
      setCodigos(data)

      // Separar por tipo
      const codigoAl = data.find(c => c.tipo === 'ALUNO')
      const codigoProf = data.find(c => c.tipo === 'PROFESSOR')
      const codigoAval = data.find(c => c.tipo === 'AVALIADOR')

      setCodigoAluno(codigoAl?.codigo || '')
      setCodigoProfessor(codigoProf?.codigo || '')
      setCodigoAvaliador(codigoAval?.codigo || '')
    } catch (err: any) {
      mostrarErro(err.response?.data?.detail || 'Erro ao carregar códigos')
    } finally {
      setCarregandoCodigos(false)
    }
  }

  // Carregar documentos de referência
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

  // Carregar configuração de e-mail
  const carregarConfigEmail = async () => {
    try {
      setCarregandoEmail(true)
      const config = await obterConfiguracaoEmail()
      setConfigEmail(config)
      setEmailEnabled(config.email_enabled)
      setEmailHost(config.email_host)
      setEmailPort(config.email_port)
      setEmailUseTls(config.email_use_tls)
      setEmailHostUser(config.email_host_user)
      // Não preencher senha (mostra mascarada)
      setEmailPassword(config.password_masked)
    } catch (err: any) {
      mostrarErro(err.response?.data?.detail || 'Erro ao carregar configurações de e-mail')
    } finally {
      setCarregandoEmail(false)
    }
  }

  // Função para alternar visibilidade da senha
  const handleToggleMostrarSenha = async () => {
    // Se está mostrando, simplesmente oculta
    if (mostrarSenha) {
      setMostrarSenha(false)
      return
    }

    // Se a senha está mascarada, busca a senha real do backend
    if (emailPassword === '**********') {
      try {
        const senhaReal = await obterSenhaReal()
        setEmailPassword(senhaReal)
        setMostrarSenha(true)
      } catch (err: any) {
        mostrarErro(err.response?.data?.detail || 'Erro ao buscar senha')
      }
    } else {
      // Se já tem a senha real, apenas mostra
      setMostrarSenha(true)
    }
  }

  // Salvar configuração de e-mail
  const salvarConfigEmail = async () => {
    try {
      setSalvandoEmail(true)

      const dados: any = {
        email_enabled: emailEnabled,
        email_host: emailHost,
        email_port: emailPort,
        email_use_tls: emailUseTls,
        email_host_user: emailHostUser,
      }

      // Só enviar senha se foi alterada (diferente da máscara)
      if (emailPassword && emailPassword !== '**********') {
        dados.password = emailPassword
      }

      await atualizarConfiguracaoEmail(dados)
      sucesso('Configurações de e-mail salvas com sucesso!')

      // Recarregar para pegar senha mascarada
      await carregarConfigEmail()
      setMostrarSenha(false)
    } catch (err: any) {
      mostrarErro(err.response?.data?.detail || 'Erro ao salvar configurações de e-mail')
    } finally {
      setSalvandoEmail(false)
    }
  }

  // Mapa dos tipos de documentos - dividido em duas colunas
  const tiposDocumentosEsquerda = [
    { key: 'ORIENTACOES_GERAIS', label: 'Orientações gerais sobre o TCC' },
    { key: 'TERMO_ACEITE', label: 'Termo de Aceite de Orientação' },
    { key: 'PLANO_DESENVOLVIMENTO', label: 'Plano de Desenvolvimento' },
  ]

  const tiposDocumentosDireita = [
    { key: 'TEMPLATE_WORD', label: 'Template Word - TCC' },
    { key: 'ABNT_BIBLIOGRAFIA', label: 'ABNT - Estilo de bibliografia do Word' },
    { key: 'ABNT_BIBLIOGRAFIA_2018', label: 'ABNT - Estilo de bibliografia do Word 2018' },
  ]

  // Buscar documento existente por tipo
  const getDocumentoPorTipo = (tipo: string): DocumentoReferencia | undefined => {
    return documentos.find(doc => doc.tipo === tipo)
  }

  // Validar tipo de arquivo
  const validarArquivo = (arquivo: File): boolean => {
    const extensoesPermitidas = ['.pdf', '.doc', '.docx']
    const nomeArquivo = arquivo.name.toLowerCase()
    return extensoesPermitidas.some(ext => nomeArquivo.endsWith(ext))
  }

  // Formatar tamanho do arquivo
  const formatarTamanhoArquivo = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Handle mudança de arquivo
  const handleArquivoSelecionado = (tipo: string, arquivo: File | null) => {
    if (arquivo && !validarArquivo(arquivo)) {
      mostrarErro('Apenas arquivos PDF (.pdf) ou Word (.doc, .docx) são permitidos.')
      return
    }

    setArquivosSelecionados(prev => ({
      ...prev,
      [tipo]: arquivo
    }))

    // Se selecionou novo arquivo, remove da lista de removidos
    setArquivosRemovidos(prev => ({
      ...prev,
      [tipo]: false
    }))
  }

  // Remover arquivo (tanto selecionado quanto existente)
  const handleRemoverArquivo = (tipo: string) => {
    setArquivosSelecionados(prev => ({ ...prev, [tipo]: null }))
    setArquivosRemovidos(prev => ({ ...prev, [tipo]: true }))
    const input = document.getElementById(`file-${tipo}`) as HTMLInputElement
    if (input) input.value = ''
  }

  // Salvar tudo junto (calendário + códigos)
  const normalizarDatas = (): Partial<CalendarioSemestre> => {
    const entradas = Object.entries(envioDatas).map(([chave, valor]) => [
      chave,
      valor && valor.trim() !== '' ? valor : null,
    ])

    return Object.fromEntries(entradas) as Partial<CalendarioSemestre>
  }

  const handleSalvarTudo = async () => {
    // Validar semestre quando for criação
    if (!semestre.trim()) {
      mostrarErro('O campo semestre é obrigatório')
      return
    }

    // Validar códigos
    if (!codigoAluno.trim() || !codigoProfessor.trim() || !codigoAvaliador.trim()) {
      mostrarErro('Todos os códigos de cadastro são obrigatórios')
      return
    }

    // Validar pesos Fase I (soma deve ser 10.0)
    const somaPesosFase1 = Object.values(pesos).reduce((acc, peso) => acc + (parseBR(peso) || 0), 0)
    if (Math.abs(somaPesosFase1 - 10.0) > 0.01) {
      mostrarErro(`A soma dos pesos de avaliação da Fase I deve ser exatamente 10,0 (atual: ${somaPesosFase1.toFixed(1).replace('.', ',')})`)
      return
    }

    // Validar pesos Fase II (soma deve ser 10.0)
    const somaPesosFase2 = Object.values(pesosFase2).reduce((acc, peso) => acc + (parseBR(peso) || 0), 0)
    if (Math.abs(somaPesosFase2 - 10.0) > 0.01) {
      mostrarErro(`A soma dos pesos de avaliação da Fase II deve ser exatamente 10,0 (atual: ${somaPesosFase2.toFixed(1).replace('.', ',')})`)
      return
    }

    try {
      setSalvandoTudo(true)

      // 1. Salvar calendário
      const payloadDatas = normalizarDatas()
      const semestreNormalizado = semestre.trim()

      const payloadCompleto = {
        semestre: semestreNormalizado,
        ...payloadDatas,
        peso_resumo: parseBR(pesos.peso_resumo) || 1.0,
        peso_introducao: parseBR(pesos.peso_introducao) || 2.0,
        peso_revisao: parseBR(pesos.peso_revisao) || 2.0,
        peso_desenvolvimento: parseBR(pesos.peso_desenvolvimento) || 3.5,
        peso_conclusoes: parseBR(pesos.peso_conclusoes) || 1.5,
        peso_coerencia_conteudo: parseBR(pesosFase2.peso_coerencia_conteudo) || 2.0,
        peso_qualidade_apresentacao: parseBR(pesosFase2.peso_qualidade_apresentacao) || 2.0,
        peso_dominio_tema: parseBR(pesosFase2.peso_dominio_tema) || 2.5,
        peso_clareza_fluencia: parseBR(pesosFase2.peso_clareza_fluencia) || 2.5,
        peso_observancia_tempo: parseBR(pesosFase2.peso_observancia_tempo) || 1.0
      }

      if (calendario) {
        await salvarCalendario(calendario.id, payloadCompleto)
      } else {
        await criarCalendario({
          ...payloadCompleto,
          ativo: true
        })
      }

      // 2. Salvar códigos
      const codigoAlObj = codigos.find(c => c.tipo === 'ALUNO')
      const codigoProfObj = codigos.find(c => c.tipo === 'PROFESSOR')
      const codigoAvalObj = codigos.find(c => c.tipo === 'AVALIADOR')

      const promessas = []
      if (codigoAlObj) promessas.push(atualizarCodigoCadastro(codigoAlObj.id, codigoAluno.trim()))
      if (codigoProfObj) promessas.push(atualizarCodigoCadastro(codigoProfObj.id, codigoProfessor.trim()))
      if (codigoAvalObj) promessas.push(atualizarCodigoCadastro(codigoAvalObj.id, codigoAvaliador.trim()))

      await Promise.all(promessas)

      // 3. Remover documentos marcados para remoção
      const arquivosParaRemover = Object.entries(arquivosRemovidos).filter(([_, removido]) => removido === true)

      if (arquivosParaRemover.length > 0) {
        const promessasRemocao = arquivosParaRemover.map(async ([tipo, _]) => {
          const docExistente = getDocumentoPorTipo(tipo)
          if (docExistente) {
            await removerDocumentoReferencia(docExistente.id)
          }
        })

        await Promise.all(promessasRemocao)
      }

      // 4. Fazer upload dos documentos selecionados
      const arquivosPendentes = Object.entries(arquivosSelecionados).filter(([_, arquivo]) => arquivo !== null)

      if (arquivosPendentes.length > 0) {
        const promessasDocumentos = arquivosPendentes.map(async ([tipo, arquivo]) => {
          if (!arquivo) return

          const docExistente = getDocumentoPorTipo(tipo)

          if (docExistente) {
            // Atualizar documento existente
            await atualizarDocumentoReferencia(docExistente.id, arquivo)
          } else {
            // Criar novo documento
            await uploadDocumentoReferencia(tipo, arquivo)
          }
        })

        await Promise.all(promessasDocumentos)
      }

      // 5. Limpar estados e recarregar
      setArquivosSelecionados({})
      setArquivosRemovidos({})
      await carregarDocumentos()

      // 6. Recarregar dados
      await recarregar()
      await carregarCodigos()

      sucesso('Configurações salvas com sucesso!')
    } catch (err: any) {
      mostrarErro(err.response?.data?.detail || 'Erro ao salvar configurações')
    } finally {
      setSalvandoTudo(false)
    }
  }

  const handleAbrirModalBaixar = () => {
    setBaixarDados(true)
    setBaixarMonografia(true)
    setBaixarDocumentos(true)
    setModalBaixarAberto(true)
  }

  const handleExportarDados = async () => {
    try {
      setExportandoDados(true)

      const blob = await exportarDados({
        dados: baixarDados,
        monografia: baixarMonografia,
        documentos: baixarDocumentos,
      })
      const nomeArquivo = semestre ? `TCCs_${semestre}.zip` : 'TCCs.zip'
      baixarArquivoZip(blob, nomeArquivo)

      setModalBaixarAberto(false)
      sucesso('Dados baixados com sucesso!')
    } catch (err: any) {
      mostrarErro(err.response?.data?.detail || 'Erro ao exportar dados')
    } finally {
      setExportandoDados(false)
    }
  }

  // ===== Reset de Período =====
  const handleAbrirResetPeriodo = () => {
    setTextoConfirmacao('')
    setModalConfirmacao(true)
  }

  const handleConfirmarApagar = () => {
    if (textoConfirmacao !== 'APAGAR') return
    setModalConfirmacao(false)
    setTextoConfirmacao('')
    setSenhaReset('')
    setModalSenha(true)
  }

  const handleConfirmarSenha = async () => {
    if (!senhaReset) return
    setModalSenha(false)

    try {
      // Verificar se tem email configurado
      const { email_configurado } = await verificarEmailReset()
      if (!email_configurado) {
        setEmailReset('')
        setModalEmail(true)
        return
      }
      // Se tem email, executar reset direto
      await executarReset()
    } catch (err: any) {
      mostrarErro('Erro ao verificar configuração de email')
      setSenhaReset('')
    }
  }

  const handleConfirmarEmail = async () => {
    if (!emailReset) return
    setModalEmail(false)
    await executarReset(emailReset)
  }

  const executarReset = async (emailDestino?: string) => {
    try {
      setResetando(true)
      const { blob, emailEnviado } = await resetarPeriodo(senhaReset, emailDestino)
      const nomeArquivo = semestre ? `Backup_${semestre}.zip` : 'Backup_periodo.zip'
      baixarArquivoZip(blob, nomeArquivo)

      if (emailEnviado) {
        sucesso('Período resetado! Backup baixado e enviado por email.')
      } else {
        sucesso('Período resetado! Backup baixado. (Falha ao enviar email)')
      }

      // Recarregar a página para refletir os dados limpos
      setTimeout(() => window.location.reload(), 2000)
    } catch (err: any) {
      // Para respostas blob com erro, precisamos ler o blob como texto
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          mostrarErro(json.detail || 'Erro ao resetar período')
        } catch {
          mostrarErro('Erro ao resetar período')
        }
      } else {
        mostrarErro(err.response?.data?.detail || 'Erro ao resetar período')
      }
    } finally {
      setResetando(false)
      setSenhaReset('')
      setEmailReset('')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] mb-2">Planejamento acadêmico</h1>
      </div>

      {/* Grid de 2 colunas: Datas + Pesos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Coluna Esquerda: Calendário Acadêmico */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[rgb(var(--cor-destaque))]" />
            Datas do período
          </h2>

          <div className="space-y-6">
          {/* Campo Semestre */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Semestre <span className="text-xs font-normal text-[rgb(var(--cor-texto-terciario))]">(Formato: YYYY.s – exemplo: 2027.2 para o segundo semestre de 2027)</span>
            </label>
            <input
              type="text"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              placeholder="Ex: 2025.1"
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Reunião com alunos */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Reunião com alunos
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Orientações gerais sobre o TCC e Regulamento)</span>
            </label>
            <input
              type="date"
              value={envioDatas.reuniao_alunos}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, reuniao_alunos: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Envio de documentos */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Envio de documentos
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Prazo para envio do plano e termo)</span>
            </label>
            <input
              type="date"
              value={envioDatas.envio_documentos_fim}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, envio_documentos_fim: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Avaliação de continuidade */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Avaliação de continuidade
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Prazo para orientador avaliar progresso)</span>
            </label>
            <input
              type="date"
              value={envioDatas.avaliacao_continuidade_fim}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, avaliacao_continuidade_fim: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Submissão da monografia + Termo */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Submissão da monografia + Termo
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Entrega da versão final + Termo)</span>
            </label>
            <input
              type="date"
              value={envioDatas.submissao_monografia_fim}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, submissao_monografia_fim: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Preparação das bancas (Fase I) */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Preparação das bancas (Fase I)
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Período de formação das bancas avaliadoras)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[rgb(var(--cor-texto-terciario))] mb-1">Início</label>
                <input
                  type="date"
                  value={envioDatas.preparacao_bancas_fase1_inicio}
                  onChange={(e) => setEnvioDatas(prev => ({ ...prev, preparacao_bancas_fase1_inicio: e.target.value }))}
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>
              <div>
                <label className="block text-xs text-[rgb(var(--cor-texto-terciario))] mb-1">Fim</label>
                <input
                  type="date"
                  value={envioDatas.preparacao_bancas_fase1_fim}
                  onChange={(e) => setEnvioDatas(prev => ({ ...prev, preparacao_bancas_fase1_fim: e.target.value }))}
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>
            </div>
          </div>

          {/* Avaliação - Fase I */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Avaliação - Fase I
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Prazo final para avaliação pela banca)</span>
            </label>
            <input
              type="date"
              value={envioDatas.avaliacao_fase1_fim}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, avaliacao_fase1_fim: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Preparação das bancas (Fase II) */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Preparação das bancas (Fase II)
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Formação das bancas para apresentação)</span>
            </label>
            <input
              type="date"
              value={envioDatas.preparacao_bancas_fase2}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, preparacao_bancas_fase2: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Apresentação dos trabalhos (Fase II) */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Apresentação dos trabalhos (Fase II)
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Prazo final para apresentações orais)</span>
            </label>
            <input
              type="date"
              value={envioDatas.defesas_fim}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, defesas_fim: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>

          {/* Ajustes Finais */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Ajustes finais
              <span className="text-xs text-[rgb(var(--cor-texto-terciario))] ml-2">(Prazo para correções pós-defesa)</span>
            </label>
            <input
              type="date"
              value={envioDatas.ajustes_finais_fim}
              onChange={(e) => setEnvioDatas(prev => ({ ...prev, ajustes_finais_fim: e.target.value }))}
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
          </div>
        </div>
      </div>

        {/* Coluna Direita: Pesos de Avaliação */}
        <div className="space-y-10">
          {/* Pontuações da Avaliação - Fase I */}
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                Pontuações da Avaliação - Fase I
              </h2>

              {/* Indicador de soma total */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[rgb(var(--cor-texto-secundario))]">Soma total:</span>
                <span className={`text-lg font-bold ${
                  Math.abs(Object.values(pesos).map((p) => parseBR(p) ?? 0).reduce((acc, curr) => acc + curr, 0) - 10.0) < 0.01
                    ? 'text-[rgb(var(--cor-sucesso))]'
                    : 'text-[rgb(var(--cor-erro))]'
                }`}>
                  {Object.values(pesos).map((p) => parseBR(p) ?? 0).reduce((acc, curr) => acc + curr, 0).toFixed(1).replace('.', ',')}
                </span>
                <span className="text-sm text-[rgb(var(--cor-texto-terciario))]">/ 10,0</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Resumo */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Resumo
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesos.peso_resumo}
                  onChange={(e) => setPesos(prev => ({ ...prev, peso_resumo: clampScore(e.target.value, 10, prev.peso_resumo) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Introdução/Relevância */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Introdução/Relevância
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesos.peso_introducao}
                  onChange={(e) => setPesos(prev => ({ ...prev, peso_introducao: clampScore(e.target.value, 10, prev.peso_introducao) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Revisão Bibliográfica */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Revisão Bibliográfica
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesos.peso_revisao}
                  onChange={(e) => setPesos(prev => ({ ...prev, peso_revisao: clampScore(e.target.value, 10, prev.peso_revisao) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Desenvolvimento */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Desenvolvimento
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesos.peso_desenvolvimento}
                  onChange={(e) => setPesos(prev => ({ ...prev, peso_desenvolvimento: clampScore(e.target.value, 10, prev.peso_desenvolvimento) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Conclusões */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Conclusões
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesos.peso_conclusoes}
                  onChange={(e) => setPesos(prev => ({ ...prev, peso_conclusoes: clampScore(e.target.value, 10, prev.peso_conclusoes) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>
            </div>
          </div>

          {/* Pontuações da Avaliação - Fase II */}
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                Pontuações da Avaliação - Fase II
              </h2>

              {/* Indicador de soma total */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[rgb(var(--cor-texto-secundario))]">Soma total:</span>
                <span className={`text-lg font-bold ${
                  Math.abs(Object.values(pesosFase2).map((p) => parseBR(p) ?? 0).reduce((acc, curr) => acc + curr, 0) - 10.0) < 0.01
                    ? 'text-[rgb(var(--cor-sucesso))]'
                    : 'text-[rgb(var(--cor-erro))]'
                }`}>
                  {Object.values(pesosFase2).map((p) => parseBR(p) ?? 0).reduce((acc, curr) => acc + curr, 0).toFixed(1).replace('.', ',')}
                </span>
                <span className="text-sm text-[rgb(var(--cor-texto-terciario))]">/ 10,0</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Coerência do Conteúdo */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Coerência do Conteúdo
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesosFase2.peso_coerencia_conteudo}
                  onChange={(e) => setPesosFase2(prev => ({ ...prev, peso_coerencia_conteudo: clampScore(e.target.value, 10, prev.peso_coerencia_conteudo) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Qualidade e Estrutura da Apresentação */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Qualidade e Estrutura
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesosFase2.peso_qualidade_apresentacao}
                  onChange={(e) => setPesosFase2(prev => ({ ...prev, peso_qualidade_apresentacao: clampScore(e.target.value, 10, prev.peso_qualidade_apresentacao) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Domínio e Conhecimento do Tema */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Domínio do Tema
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesosFase2.peso_dominio_tema}
                  onChange={(e) => setPesosFase2(prev => ({ ...prev, peso_dominio_tema: clampScore(e.target.value, 10, prev.peso_dominio_tema) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Clareza e Fluência Verbal */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Clareza e Fluência
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesosFase2.peso_clareza_fluencia}
                  onChange={(e) => setPesosFase2(prev => ({ ...prev, peso_clareza_fluencia: clampScore(e.target.value, 10, prev.peso_clareza_fluencia) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>

              {/* Observância do Tempo */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Observância do Tempo
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pesosFase2.peso_observancia_tempo}
                  onChange={(e) => setPesosFase2(prev => ({ ...prev, peso_observancia_tempo: clampScore(e.target.value, 10, prev.peso_observancia_tempo) }))}
                  placeholder="0,0"
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Senhas de Cadastro */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">
          Senhas de Cadastro
        </h2>
        <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-6">
          Defina as senhas que serão usadas para cadastro de novos usuários no sistema.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Código Aluno */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Senha para alunos
            </label>
            <input
              type="text"
              value={codigoAluno}
              onChange={(e) => setCodigoAluno(e.target.value)}
              placeholder="Digite a senha para alunos"
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
            <p className="mt-1 text-xs text-[rgb(var(--cor-texto-terciario))]">
              Senha que os alunos usarão para se cadastrar
            </p>
          </div>

          {/* Código Professor */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Senha para professores
            </label>
            <input
              type="text"
              value={codigoProfessor}
              onChange={(e) => setCodigoProfessor(e.target.value)}
              placeholder="Digite a senha para professores"
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
            <p className="mt-1 text-xs text-[rgb(var(--cor-texto-terciario))]">
              Senha que os professores usarão para se cadastrar
            </p>
          </div>

          {/* Código Avaliador */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
              Senha para avaliadores
            </label>
            <input
              type="text"
              value={codigoAvaliador}
              onChange={(e) => setCodigoAvaliador(e.target.value)}
              placeholder="Digite a senha para avaliadores"
              className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
            />
            <p className="mt-1 text-xs text-[rgb(var(--cor-texto-terciario))]">
              Senha que os avaliadores usarão para se cadastrar
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Documentos de Referência */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[rgb(var(--cor-destaque))]" />
          Documentos de Referência
        </h2>
        <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-6">
          Faça upload dos documentos modelo que alunos, professores e avaliadores poderão visualizar e baixar.
          <br />
          <span className="text-xs text-[rgb(var(--cor-texto-terciario))]">Formatos aceitos: PDF (.pdf) ou Word (.doc, .docx)</span>
        </p>

        {carregandoDocumentos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--cor-destaque))]" />
            <span className="ml-2 text-[rgb(var(--cor-texto-secundario))]">Carregando documentos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {tiposDocumentosEsquerda.map((tipoDoc) => {
                const docExistente = getDocumentoPorTipo(tipoDoc.key)
                const arquivoSelecionado = arquivosSelecionados[tipoDoc.key]
                const foiRemovido = arquivosRemovidos[tipoDoc.key]
                const temArquivo = arquivoSelecionado || (docExistente && !foiRemovido)

                return (
                  <div key={tipoDoc.key}>
                    <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                      {tipoDoc.label}
                    </label>

                    {/* Input de arquivo com estilo do aluno */}
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-${tipoDoc.key}`}
                        onChange={(e) => handleArquivoSelecionado(tipoDoc.key, e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                      {temArquivo ? (
                        <div className="flex items-center justify-between w-full h-16 border-2 border-[rgb(var(--cor-borda-forte))] border-dashed rounded-lg bg-[rgb(var(--cor-superficie-hover))] px-4 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--cor-destaque))] font-medium truncate">
                              {arquivoSelecionado ? arquivoSelecionado.name : docExistente?.arquivo_nome}
                            </p>
                            <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">
                              {arquivoSelecionado ? formatarTamanhoArquivo(arquivoSelecionado.size) : 'Arquivo atual'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverArquivo(tipoDoc.key)}
                            className="ml-4 px-3 py-1.5 bg-[rgb(var(--cor-erro))] text-white text-xs rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors flex-shrink-0"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor={`file-${tipoDoc.key}`}
                          className="flex flex-col items-center justify-center w-full h-16 border-2 border-[rgb(var(--cor-borda-forte))] border-dashed rounded-lg cursor-pointer hover:border-[rgb(var(--cor-destaque))] transition-colors bg-[rgb(var(--cor-superficie-hover))] gap-0.5"
                        >
                          <Upload className="w-5 h-5 text-[rgb(var(--cor-icone))]" />
                          <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">
                            Clique para selecionar o arquivo
                          </p>
                          <p className="text-xs text-[rgb(var(--cor-icone))]">
                            PDF ou Word
                          </p>
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              {tiposDocumentosDireita.map((tipoDoc) => {
                const docExistente = getDocumentoPorTipo(tipoDoc.key)
                const arquivoSelecionado = arquivosSelecionados[tipoDoc.key]
                const foiRemovido = arquivosRemovidos[tipoDoc.key]
                const temArquivo = arquivoSelecionado || (docExistente && !foiRemovido)

                return (
                  <div key={tipoDoc.key}>
                    <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                      {tipoDoc.label}
                    </label>

                    {/* Input de arquivo com estilo do aluno */}
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-${tipoDoc.key}`}
                        onChange={(e) => handleArquivoSelecionado(tipoDoc.key, e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                      {temArquivo ? (
                        <div className="flex items-center justify-between w-full h-16 border-2 border-[rgb(var(--cor-borda-forte))] border-dashed rounded-lg bg-[rgb(var(--cor-superficie-hover))] px-4 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--cor-destaque))] font-medium truncate">
                              {arquivoSelecionado ? arquivoSelecionado.name : docExistente?.arquivo_nome}
                            </p>
                            <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">
                              {arquivoSelecionado ? formatarTamanhoArquivo(arquivoSelecionado.size) : 'Arquivo atual'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverArquivo(tipoDoc.key)}
                            className="ml-4 px-3 py-1.5 bg-[rgb(var(--cor-erro))] text-white text-xs rounded-lg hover:bg-[rgb(var(--cor-erro))]/90 transition-colors flex-shrink-0"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor={`file-${tipoDoc.key}`}
                          className="flex flex-col items-center justify-center w-full h-16 border-2 border-[rgb(var(--cor-borda-forte))] border-dashed rounded-lg cursor-pointer hover:border-[rgb(var(--cor-destaque))] transition-colors bg-[rgb(var(--cor-superficie-hover))] gap-0.5"
                        >
                          <Upload className="w-5 h-5 text-[rgb(var(--cor-icone))]" />
                          <p className="text-xs text-[rgb(var(--cor-texto-terciario))]">
                            Clique para selecionar o arquivo
                          </p>
                          <p className="text-xs text-[rgb(var(--cor-icone))]">
                            PDF ou Word
                          </p>
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Botão Salvar Configurações */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleSalvarTudo}
          disabled={salvandoTudo || carregandoCodigos}
          className="px-8 py-3 bg-[rgb(var(--cor-destaque))] text-white rounded-lg font-medium hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {salvandoTudo ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar configurações
            </>
          )}
        </button>
      </div>

      {/* Configurações do Sistema de E-mail */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-[rgb(var(--cor-destaque))]" />
          Configurações do Sistema de E-mail
        </h2>
        <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-6">
          Configure as credenciais SMTP para envio de notificações por e-mail no sistema.
        </p>

        {carregandoEmail ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--cor-destaque))]" />
            <span className="ml-2 text-[rgb(var(--cor-texto-secundario))]">Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Habilitar E-mail */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailEnabled"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-4 h-4 text-[rgb(var(--cor-destaque))] border-[rgb(var(--cor-borda-forte))] rounded focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]"
              />
              <label htmlFor="emailEnabled" className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">
                Habilitar envio de e-mails
              </label>
            </div>

            {/* Grid de Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* E-mail do Remetente */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  E-mail do remetente
                </label>
                <input
                  type="email"
                  value={emailHostUser}
                  onChange={(e) => setEmailHostUser(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  disabled={!emailEnabled}
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Senha de App */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Senha de app
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Digite a senha de app"
                    disabled={!emailEnabled}
                    className="w-full px-4 py-2 pr-10 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleToggleMostrarSenha}
                    disabled={!emailEnabled}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--cor-icone))] hover:text-[rgb(var(--cor-texto-primario))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[rgb(var(--cor-texto-terciario))]">
                  Use uma senha de app, não sua senha principal
                </p>
              </div>

              {/* Servidor SMTP */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={emailHost}
                  onChange={(e) => setEmailHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  disabled={!emailEnabled}
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Porta SMTP */}
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--cor-texto-medio))] mb-2">
                  Porta SMTP
                </label>
                <input
                  type="number"
                  value={emailPort}
                  onChange={(e) => setEmailPort(Number(e.target.value))}
                  placeholder="587"
                  disabled={!emailEnabled}
                  className="w-full px-4 py-2 border border-[rgb(var(--cor-borda-forte))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Usar TLS */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailUseTls"
                  checked={emailUseTls}
                  onChange={(e) => setEmailUseTls(e.target.checked)}
                  disabled={!emailEnabled}
                  className="w-4 h-4 text-[rgb(var(--cor-destaque))] border-[rgb(var(--cor-borda-forte))] rounded focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="emailUseTls" className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">
                  Usar TLS/STARTTLS
                </label>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4">
              <button
                onClick={salvarConfigEmail}
                disabled={salvandoEmail}
                className="px-6 py-2.5 bg-[rgb(var(--cor-destaque))] text-white rounded-lg font-medium hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvandoEmail ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Salvar configurações de e-mail
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Dados */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-md border border-[rgb(var(--cor-borda))] p-6">
        <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--cor-texto-primario))]">
          Dados
        </h2>

        <div className="flex items-center justify-between">
          <button
            onClick={handleAbrirModalBaixar}
            disabled={exportandoDados}
            className="px-6 py-3 bg-[rgb(var(--cor-sucesso))] text-white rounded-lg font-medium hover:bg-[rgb(var(--cor-sucesso))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exportandoDados ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Baixar dados
              </>
            )}
          </button>

          <button
            onClick={handleAbrirResetPeriodo}
            disabled={resetando}
            className="px-6 py-3 bg-[rgb(var(--cor-erro))] text-white rounded-lg font-medium hover:bg-[rgb(var(--cor-erro))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {resetando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Resetando...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                Resetar período
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Baixar Dados */}
      {modalBaixarAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[rgb(var(--cor-sucesso))]/10">
                  <Download className="h-5 w-5 text-[rgb(var(--cor-sucesso))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                  Baixar dados
                </h3>
              </div>

              <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-4">
                Selecione o que deseja incluir no download:
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-[rgb(var(--cor-borda))] cursor-pointer hover:bg-[rgb(var(--cor-fundo))] transition-colors">
                  <input
                    type="checkbox"
                    checked={baixarDados}
                    onChange={(e) => setBaixarDados(e.target.checked)}
                    className="w-4 h-4 rounded accent-[rgb(var(--cor-destaque))]"
                  />
                  <div>
                    <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Dados</span>
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">Arquivo txt com dados das fases</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-[rgb(var(--cor-borda))] cursor-pointer hover:bg-[rgb(var(--cor-fundo))] transition-colors">
                  <input
                    type="checkbox"
                    checked={baixarMonografia}
                    onChange={(e) => setBaixarMonografia(e.target.checked)}
                    className="w-4 h-4 rounded accent-[rgb(var(--cor-destaque))]"
                  />
                  <div>
                    <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Monografias</span>
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">Monografia aprovada pelo orientador</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-[rgb(var(--cor-borda))] cursor-pointer hover:bg-[rgb(var(--cor-fundo))] transition-colors">
                  <input
                    type="checkbox"
                    checked={baixarDocumentos}
                    onChange={(e) => setBaixarDocumentos(e.target.checked)}
                    className="w-4 h-4 rounded accent-[rgb(var(--cor-destaque))]"
                  />
                  <div>
                    <span className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Documentos gerais</span>
                    <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">Documentos gerais das fases</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => setModalBaixarAberto(false)}
                disabled={exportandoDados}
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportarDados}
                disabled={exportandoDados || (!baixarDados && !baixarMonografia && !baixarDocumentos)}
                className="px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--cor-sucesso))] rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exportandoDados ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Baixar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação - Digitar APAGAR */}
      {modalConfirmacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[rgb(var(--cor-erro))]/10">
                  <AlertTriangle className="h-6 w-6 text-[rgb(var(--cor-erro))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                  Resetar período
                </h3>
              </div>

              <p className="text-[rgb(var(--cor-texto))] mb-2">
                Esta ação irá <strong>apagar permanentemente</strong> todos os dados do período atual:
              </p>
              <ul className="text-sm text-[rgb(var(--cor-texto))]/80 mb-4 list-disc pl-5 space-y-1">
                <li>Todos os TCCs e avaliações</li>
                <li>Todos os alunos cadastrados</li>
                <li>Todos os membros externos</li>
                <li>Todos os avisos do mural</li>
                <li>Todas as notificações</li>
                <li>Arquivos de monografia</li>
              </ul>
              <p className="text-sm text-[rgb(var(--cor-texto))]/80 mb-4">
                Professores e coordenador serão mantidos. Um backup será baixado e enviado por email antes da exclusão.
              </p>

              <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                Digite <strong>APAGAR</strong> para confirmar:
              </p>
              <input
                type="text"
                value={textoConfirmacao}
                onChange={(e) => setTextoConfirmacao(e.target.value)}
                placeholder="APAGAR"
                className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--cor-borda))] bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-erro))]/50"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => setModalConfirmacao(false)}
                className="px-4 py-2 rounded-lg border border-[rgb(var(--cor-borda))] text-[rgb(var(--cor-texto))] hover:bg-[rgb(var(--cor-fundo))] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarApagar}
                disabled={textoConfirmacao !== 'APAGAR'}
                className="px-4 py-2 rounded-lg bg-[rgb(var(--cor-erro))] text-white font-medium hover:bg-[rgb(var(--cor-erro))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Senha */}
      {modalSenha && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-[rgb(var(--cor-erro))]/10">
                  <AlertTriangle className="h-6 w-6 text-[rgb(var(--cor-erro))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                  Confirmar com senha
                </h3>
              </div>

              <p className="text-[rgb(var(--cor-texto))] mb-4">
                Digite sua senha para confirmar o reset do período.
              </p>

              <input
                type="password"
                value={senhaReset}
                onChange={(e) => setSenhaReset(e.target.value)}
                placeholder="Sua senha"
                className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--cor-borda))] bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-erro))]/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmarSenha() }}
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => { setModalSenha(false); setSenhaReset('') }}
                className="px-4 py-2 rounded-lg border border-[rgb(var(--cor-borda))] text-[rgb(var(--cor-texto))] hover:bg-[rgb(var(--cor-fundo))] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarSenha}
                disabled={!senhaReset}
                className="px-4 py-2 rounded-lg bg-[rgb(var(--cor-erro))] text-white font-medium hover:bg-[rgb(var(--cor-erro))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Email (quando não há email configurado) */}
      {modalEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-[rgb(var(--cor-destaque))]" />
                <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">
                  Email para backup
                </h3>
              </div>

              <p className="text-[rgb(var(--cor-texto))] mb-4">
                Nenhum email está configurado no sistema. Informe um email para receber o backup dos dados antes da exclusão.
              </p>

              <input
                type="email"
                value={emailReset}
                onChange={(e) => setEmailReset(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--cor-borda))] bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-primario))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmarEmail() }}
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--cor-borda))]">
              <button
                onClick={() => { setModalEmail(false); setEmailReset(''); setSenhaReset('') }}
                className="px-4 py-2 rounded-lg border border-[rgb(var(--cor-borda))] text-[rgb(var(--cor-texto))] hover:bg-[rgb(var(--cor-fundo))] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEmail}
                disabled={!emailReset || !emailReset.includes('@')}
                className="px-4 py-2 rounded-lg bg-[rgb(var(--cor-erro))] text-white font-medium hover:bg-[rgb(var(--cor-erro))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de carregamento durante reset */}
      {resetando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl p-8 text-center max-w-sm">
            <Loader2 className="h-10 w-10 animate-spin text-[rgb(var(--cor-erro))] mx-auto mb-4" />
            <p className="text-[rgb(var(--cor-texto-primario))] font-semibold mb-2">Resetando período...</p>
            <p className="text-sm text-[rgb(var(--cor-texto))]/70">
              Gerando backup, enviando email e apagando dados. Isso pode levar alguns instantes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Planejamento
