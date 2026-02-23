/**
 * Modal para edição completa de um TCC pelo coordenador
 * Exibe os dados em formato de ficha com seções organizadas:
 * - Dados do trabalho
 * - Orientação
 * - Documentos (checklist)
 * - Avaliações Fase I (por avaliador)
 * - Avaliações Fase II (por avaliador)
 * - Liberações de prazo
 */

import { useState, useEffect, useCallback } from 'react'
import { X, Save, Loader2, AlertCircle, ChevronDown, ChevronUp, CheckSquare, Square, FileText } from 'lucide-react'
import { EtapaTCCLabels, StatusDocumento, TipoDocumento } from '../types/enums'
import type { EtapaTCC } from '../types/enums'
import type { TCC, AvaliacaoFase1, AvaliacaoFase2, PesosConfigurados, PesosConfiguradosFase2 } from '../types'
import { atualizarTCC } from '../servicos/tccs'
import { listarProfessores, listarAvaliadores, type ProfessorListItem } from '../servicos/usuarios'
import { obterAvaliacoesFase1, editarAvaliacaoFase1Coordenador, obterBancaFase1 } from '../servicos/fase1'
import { obterAvaliacoesFase2, editarAvaliacaoFase2Coordenador } from '../servicos/fase2'

interface ModalEditarTCCProps {
  tcc: TCC
  onClose: () => void
  onSalvo: () => void
}

// Seções do parecer estruturado
const SECOES_FASE1 = ['Resumo', 'Introdução/Relevância do Trabalho', 'Revisão Bibliográfica', 'Desenvolvimento', 'Conclusões', 'Considerações Adicionais'] as const
const SECOES_FASE2 = ['Coerência', 'Qualidade', 'Domínio', 'Clareza', 'Tempo', 'Parecer Geral'] as const

function extrairSecao(parecer: string, secao: string): string {
  if (!parecer) return ''
  const regex = new RegExp(`===\\s*${secao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*===\\s*([\\s\\S]*?)(?=\\n===|$)`, 'i')
  const match = parecer.match(regex)
  return match ? match[1].trim() : ''
}

function combinarSecoes(secoes: readonly string[], valores: Record<string, string>): string {
  const partes: string[] = []
  for (const secao of secoes) {
    const val = (valores[secao] || '').trim()
    if (val) {
      partes.push(`===${secao}===\n${val}`)
    }
  }
  return partes.join('\n')
}

// Pesos padrão
const PESOS_F1_DEFAULT: PesosConfigurados = { peso_resumo: 1.0, peso_introducao: 2.0, peso_revisao: 2.0, peso_desenvolvimento: 3.5, peso_conclusoes: 1.5 }
const PESOS_F2_DEFAULT: PesosConfiguradosFase2 = { peso_coerencia_conteudo: 2.0, peso_qualidade_apresentacao: 2.0, peso_dominio_tema: 2.5, peso_clareza_fluencia: 2.5, peso_observancia_tempo: 1.0 }

// Formato brasileiro de notas (vírgula como separador decimal)
function parseBR(valor: string): number | null {
  if (valor === '') return null
  const num = parseFloat(valor.replace(',', '.'))
  return isNaN(num) ? null : num
}

function numParaBR(valor: number | string | null): string {
  if (valor === null || valor === '') return ''
  return String(valor).replace('.', ',')
}

function clampScore(raw: string, max: number, currentValue: string): string {
  if (raw === '') return ''
  let cleaned = raw.replace(/[^\d,.]/g, '')
  cleaned = cleaned.replace(/\./g, ',')
  if ((cleaned.match(/,/g) || []).length > 1) return currentValue
  if (!/^[0-9]{0,2}(,[0-9]{0,2})?$/.test(cleaned)) return currentValue
  const num = parseBR(cleaned)
  if (num !== null && !cleaned.endsWith(',')) {
    return Math.max(0, Math.min(num, max)).toString().replace('.', ',')
  }
  return cleaned
}

// Estado local de uma avaliação fase 1 editável
interface AvalFase1State {
  avaliadorId: number
  avaliadorNome: string
  nota_resumo: string
  nota_introducao: string
  nota_revisao: string
  nota_desenvolvimento: string
  nota_conclusoes: string
  parecer: string
  comentarios: Record<string, string>
  status: string
  nota_final: number | null
  modificado: boolean
}

// Estado local de uma avaliação fase 2 editável
interface AvalFase2State {
  avaliadorId: number
  avaliadorNome: string
  nota_coerencia_conteudo: string
  nota_qualidade_apresentacao: string
  nota_dominio_tema: string
  nota_clareza_fluencia: string
  nota_observancia_tempo: string
  parecer: string
  comentarios: Record<string, string>
  status: string
  nota_final: number | null
  modificado: boolean
}

export function ModalEditarTCC({ tcc, onClose, onSalvo }: ModalEditarTCCProps) {
  // Estado do formulário - Dados do trabalho
  const [titulo, setTitulo] = useState(tcc.titulo || '')
  const [semestre, setSemestre] = useState(tcc.semestre || '')
  const [etapaAtual, setEtapaAtual] = useState<EtapaTCC>(tcc.etapa_atual)
  const [orientador, setOrientador] = useState<number | null>(tcc.orientador)
  const [coorientador, setCoorientador] = useState<number | null>(tcc.coorientador)
  const [coorientadorNome, setCoorientadorNome] = useState(tcc.coorientador_nome || '')
  const [coorientadorTitulacao, setCoorientadorTitulacao] = useState(tcc.coorientador_titulacao || '')
  const [coorientadorAfiliacao, setCoorientadorAfiliacao] = useState(tcc.coorientador_afiliacao || '')
  const [coorientadorLattes, setCoorientadorLattes] = useState(tcc.coorientador_lattes || '')

  // Flags de controle
  const [liberarEnvioDocumentos, setLiberarEnvioDocumentos] = useState(tcc.liberar_envio_documentos ?? false)
  const [liberarDesenvolvimento, setLiberarDesenvolvimento] = useState(tcc.liberar_desenvolvimento ?? false)
  const [liberarContinuidade, setLiberarContinuidade] = useState(tcc.liberar_continuidade ?? false)
  const [liberarFase1, setLiberarFase1] = useState(tcc.liberar_fase1 ?? false)
  const [liberarDefesas, setLiberarDefesas] = useState(tcc.liberar_defesas ?? false)
  const [liberarFase2, setLiberarFase2] = useState(tcc.liberar_fase2 ?? false)
  const [liberarAjustesFinais, setLiberarAjustesFinais] = useState(tcc.liberar_ajustes_finais ?? false)

  // Avaliações
  const [avaliacoesFase1, setAvaliacoesFase1] = useState<AvalFase1State[]>([])
  const [avaliacoesFase2, setAvaliacoesFase2] = useState<AvalFase2State[]>([])
  const [pesosF1, setPesosF1] = useState<PesosConfigurados>(PESOS_F1_DEFAULT)
  const [pesosF2, setPesosF2] = useState<PesosConfiguradosFase2>(PESOS_F2_DEFAULT)
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true)

  // UI state
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [professores, setProfessores] = useState<ProfessorListItem[]>([])
  const [avaliadores, setAvaliadores] = useState<ProfessorListItem[]>([])
  const [secaoFlags, setSecaoFlags] = useState(false)
  const [secaoFase1, setSecaoFase1] = useState(true)
  const [secaoFase2, setSecaoFase2] = useState(true)

  // Carregar listas de professores e avaliadores
  useEffect(() => {
    listarProfessores().then(setProfessores).catch(() => {})
    listarAvaliadores().then(setAvaliadores).catch(() => {})
  }, [])

  // Carregar avaliações e banca
  const carregarAvaliacoes = useCallback(async () => {
    setCarregandoAvaliacoes(true)
    try {
      const [f1Result, f2Result, bancaResult] = await Promise.allSettled([
        obterAvaliacoesFase1(tcc.id),
        obterAvaliacoesFase2(tcc.id),
        obterBancaFase1(tcc.id)
      ])

      const f1 = f1Result.status === 'fulfilled' ? f1Result.value : []
      const f2 = f2Result.status === 'fulfilled' ? f2Result.value : []
      const banca = bancaResult.status === 'fulfilled' ? bancaResult.value : null

      // Fase 1: usar avaliações existentes, ou criar cards vazios a partir dos membros da banca
      if (f1.length > 0) {
        const p1 = f1.find((a: AvaliacaoFase1) => a.pesos_configurados)?.pesos_configurados
        if (p1) setPesosF1(p1)
        setAvaliacoesFase1(f1.map((a: AvaliacaoFase1) => {
          const p = a.parecer || ''
          const comentarios: Record<string, string> = {}
          for (const s of SECOES_FASE1) comentarios[s] = extrairSecao(p, s)
          // Se nenhum formato estruturado, colocar tudo em Considerações Adicionais
          if (!Object.values(comentarios).some(v => v) && p.trim()) {
            comentarios['Considerações Adicionais'] = p.trim()
          }
          return {
            avaliadorId: a.avaliador,
            avaliadorNome: a.avaliador_dados?.nome_completo || `Avaliador #${a.avaliador}`,
            nota_resumo: numParaBR(a.nota_resumo),
            nota_introducao: numParaBR(a.nota_introducao),
            nota_revisao: numParaBR(a.nota_revisao),
            nota_desenvolvimento: numParaBR(a.nota_desenvolvimento),
            nota_conclusoes: numParaBR(a.nota_conclusoes),
            parecer: p,
            comentarios,
            status: a.status,
            nota_final: a.nota_final,
            modificado: false
          }
        }))
      } else if (banca?.membros && banca.membros.length > 0) {
        // Criar cards vazios para cada membro da banca
        setAvaliacoesFase1(banca.membros
          .filter(m => m.tipo === 'AVALIADOR')
          .map(m => ({
            avaliadorId: m.usuario,
            avaliadorNome: m.usuario_dados?.nome_completo || `Avaliador #${m.usuario}`,
            nota_resumo: '', nota_introducao: '', nota_revisao: '',
            nota_desenvolvimento: '', nota_conclusoes: '',
            parecer: '', comentarios: {},
            status: 'PENDENTE', nota_final: null, modificado: false
          })))
      }

      // Fase 2: usar avaliações existentes ou criar cards vazios
      if (f2.length > 0) {
        const p2 = f2.find((a: AvaliacaoFase2) => a.pesos_configurados)?.pesos_configurados
        if (p2) setPesosF2(p2)
        setAvaliacoesFase2(f2.map((a: AvaliacaoFase2) => {
          const p = a.parecer || ''
          const comentarios: Record<string, string> = {}
          for (const s of SECOES_FASE2) comentarios[s] = extrairSecao(p, s)
          if (!Object.values(comentarios).some(v => v) && p.trim()) {
            comentarios['Parecer Geral'] = p.trim()
          }
          return {
            avaliadorId: a.avaliador,
            avaliadorNome: a.avaliador_dados?.nome_completo || `Avaliador #${a.avaliador}`,
            nota_coerencia_conteudo: numParaBR(a.nota_coerencia_conteudo),
            nota_qualidade_apresentacao: numParaBR(a.nota_qualidade_apresentacao),
            nota_dominio_tema: numParaBR(a.nota_dominio_tema),
            nota_clareza_fluencia: numParaBR(a.nota_clareza_fluencia),
            nota_observancia_tempo: numParaBR(a.nota_observancia_tempo),
            parecer: p,
            comentarios,
            status: a.status,
            nota_final: a.nota_final,
            modificado: false
          }
        }))
      } else if (banca?.membros && banca.membros.length > 0) {
        // Fase 2: todos os membros da banca (incluindo orientador)
        setAvaliacoesFase2(banca.membros.map(m => ({
          avaliadorId: m.usuario,
          avaliadorNome: m.usuario_dados?.nome_completo || `Membro #${m.usuario}`,
          nota_coerencia_conteudo: '', nota_qualidade_apresentacao: '',
          nota_dominio_tema: '', nota_clareza_fluencia: '', nota_observancia_tempo: '',
          parecer: '', comentarios: {},
          status: 'PENDENTE', nota_final: null, modificado: false
        })))
      }
    } catch {
      // Silently handle - evaluations may not exist yet
    } finally {
      setCarregandoAvaliacoes(false)
    }
  }, [tcc.id])

  useEffect(() => {
    carregarAvaliacoes()
  }, [carregarAvaliacoes])

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Helpers para atualizar avaliações
  const atualizarFase1 = (idx: number, campo: string, valor: string) => {
    setAvaliacoesFase1(prev => prev.map((a, i) => i === idx ? { ...a, [campo]: valor, modificado: true } : a))
  }

  const atualizarComentarioFase1 = (idx: number, secao: string, valor: string) => {
    setAvaliacoesFase1(prev => prev.map((a, i) => i === idx ? {
      ...a,
      comentarios: { ...a.comentarios, [secao]: valor },
      modificado: true
    } : a))
  }

  const atualizarFase2 = (idx: number, campo: string, valor: string) => {
    setAvaliacoesFase2(prev => prev.map((a, i) => i === idx ? { ...a, [campo]: valor, modificado: true } : a))
  }

  const atualizarComentarioFase2 = (idx: number, secao: string, valor: string) => {
    setAvaliacoesFase2(prev => prev.map((a, i) => i === idx ? {
      ...a,
      comentarios: { ...a.comentarios, [secao]: valor },
      modificado: true
    } : a))
  }

  // Documentos relevantes para o checklist (os 3 do dashboard do aluno + termo de solicitação)
  const documentosChecklist = [
    { tipo: TipoDocumento.PLANO_DESENVOLVIMENTO, label: 'Plano de Desenvolvimento' },
    { tipo: TipoDocumento.TERMO_ACEITE, label: 'Termo de Aceite' },
    { tipo: TipoDocumento.MONOGRAFIA, label: 'Monografia' },
    { tipo: TipoDocumento.TERMO_SOLICITACAO_AVALIACAO, label: 'Termo de Solicitação de Avaliação' },
  ]

  // Verificar quais documentos o TCC possui
  // Monografia requer aprovação explícita; demais são considerados "OK" ao existirem
  const tiposComAprovacao = new Set([TipoDocumento.MONOGRAFIA])
  const documentosPostados = new Set<string>()
  const documentosExistentes = new Set<string>()
  if (tcc.documentos) {
    for (const doc of tcc.documentos) {
      documentosExistentes.add(doc.tipo_documento)
      if (doc.status === StatusDocumento.APROVADO || !tiposComAprovacao.has(doc.tipo_documento as any)) {
        documentosPostados.add(doc.tipo_documento)
      }
    }
  }

  const handleSalvar = async () => {
    setErro(null)
    setSucesso(null)
    setSalvando(true)

    try {
      // 1. Salvar dados do TCC (PATCH)
      const dados: Record<string, any> = {}

      if (titulo !== (tcc.titulo || '')) dados.titulo = titulo
      if (semestre !== (tcc.semestre || '')) dados.semestre = semestre
      if (etapaAtual !== (tcc.etapa_atual || '')) dados.etapa_atual = etapaAtual
      if (orientador !== tcc.orientador) dados.orientador = orientador
      if (coorientador !== tcc.coorientador) dados.coorientador = coorientador
      if (coorientadorNome !== (tcc.coorientador_nome || '')) dados.coorientador_nome = coorientadorNome
      if (coorientadorTitulacao !== (tcc.coorientador_titulacao || '')) dados.coorientador_titulacao = coorientadorTitulacao
      if (coorientadorAfiliacao !== (tcc.coorientador_afiliacao || '')) dados.coorientador_afiliacao = coorientadorAfiliacao
      if (coorientadorLattes !== (tcc.coorientador_lattes || '')) dados.coorientador_lattes = coorientadorLattes

      if (liberarEnvioDocumentos !== (tcc.liberar_envio_documentos ?? false)) dados.liberar_envio_documentos = liberarEnvioDocumentos
      if (liberarDesenvolvimento !== (tcc.liberar_desenvolvimento ?? false)) dados.liberar_desenvolvimento = liberarDesenvolvimento
      if (liberarContinuidade !== (tcc.liberar_continuidade ?? false)) dados.liberar_continuidade = liberarContinuidade
      if (liberarFase1 !== (tcc.liberar_fase1 ?? false)) dados.liberar_fase1 = liberarFase1
      if (liberarDefesas !== (tcc.liberar_defesas ?? false)) dados.liberar_defesas = liberarDefesas
      if (liberarFase2 !== (tcc.liberar_fase2 ?? false)) dados.liberar_fase2 = liberarFase2
      if (liberarAjustesFinais !== (tcc.liberar_ajustes_finais ?? false)) dados.liberar_ajustes_finais = liberarAjustesFinais

      if (Object.keys(dados).length > 0) {
        await atualizarTCC(tcc.id, dados)
      }

      // 2. Salvar avaliações Fase 1 modificadas
      const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max))
      const f1Modificadas = avaliacoesFase1.filter(a => a.modificado)
      for (const a of f1Modificadas) {
        const payload: Record<string, any> = {}
        const r = parseBR(a.nota_resumo); if (r !== null) payload.nota_resumo = clamp(r, pesosF1.peso_resumo)
        const i = parseBR(a.nota_introducao); if (i !== null) payload.nota_introducao = clamp(i, pesosF1.peso_introducao)
        const rv = parseBR(a.nota_revisao); if (rv !== null) payload.nota_revisao = clamp(rv, pesosF1.peso_revisao)
        const d = parseBR(a.nota_desenvolvimento); if (d !== null) payload.nota_desenvolvimento = clamp(d, pesosF1.peso_desenvolvimento)
        const c = parseBR(a.nota_conclusoes); if (c !== null) payload.nota_conclusoes = clamp(c, pesosF1.peso_conclusoes)
        const parecerCombinado = combinarSecoes(SECOES_FASE1, a.comentarios)
        payload.parecer = parecerCombinado
        if (a.status) payload.status = a.status
        await editarAvaliacaoFase1Coordenador(tcc.id, a.avaliadorId, payload)
      }

      // 3. Salvar avaliações Fase 2 modificadas
      const f2Modificadas = avaliacoesFase2.filter(a => a.modificado)
      for (const a of f2Modificadas) {
        const payload: Record<string, any> = {}
        const co = parseBR(a.nota_coerencia_conteudo); if (co !== null) payload.nota_coerencia_conteudo = clamp(co, pesosF2.peso_coerencia_conteudo)
        const qa = parseBR(a.nota_qualidade_apresentacao); if (qa !== null) payload.nota_qualidade_apresentacao = clamp(qa, pesosF2.peso_qualidade_apresentacao)
        const dt = parseBR(a.nota_dominio_tema); if (dt !== null) payload.nota_dominio_tema = clamp(dt, pesosF2.peso_dominio_tema)
        const cf = parseBR(a.nota_clareza_fluencia); if (cf !== null) payload.nota_clareza_fluencia = clamp(cf, pesosF2.peso_clareza_fluencia)
        const ot = parseBR(a.nota_observancia_tempo); if (ot !== null) payload.nota_observancia_tempo = clamp(ot, pesosF2.peso_observancia_tempo)
        const parecerCombinado = combinarSecoes(SECOES_FASE2, a.comentarios)
        payload.parecer = parecerCombinado
        if (a.status) payload.status = a.status
        await editarAvaliacaoFase2Coordenador(tcc.id, a.avaliadorId, payload)
      }

      onSalvo()
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar alterações')
    } finally {
      setSalvando(false)
    }
  }

  const fmtPeso = (v: number) => v.toFixed(1).replace('.', ',')

  const inputClass = "w-full px-3 py-2 bg-[rgb(var(--cor-fundo))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] text-sm"
  const labelClass = "block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-1"
  const notaInputClass = "w-full px-2 py-1.5 bg-[rgb(var(--cor-fundo))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] text-sm text-center"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 pb-10" onClick={onClose}>
      <div
        className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-2xl border border-[rgb(var(--cor-borda))] w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--cor-borda))]">
          <div>
            <h2 className="text-xl font-bold text-[rgb(var(--cor-texto-primario))]">Editar TCC</h2>
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">#{tcc.id} — {tcc.aluno_dados?.nome_completo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[rgb(var(--cor-texto-secundario))]" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 p-3 bg-[rgb(var(--cor-erro))]/10 border border-[rgb(var(--cor-erro))]/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-[rgb(var(--cor-erro))] shrink-0" />
              <p className="text-sm text-[rgb(var(--cor-erro))]">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="flex items-center gap-2 p-3 bg-[rgb(var(--cor-sucesso))]/10 border border-[rgb(var(--cor-sucesso))]/30 rounded-lg">
              <CheckSquare className="w-4 h-4 text-[rgb(var(--cor-sucesso))] shrink-0" />
              <p className="text-sm text-[rgb(var(--cor-sucesso))]">{sucesso}</p>
            </div>
          )}

          {/* Seção: Dados do Trabalho */}
          <fieldset>
            <legend className="text-sm font-semibold text-[rgb(var(--cor-destaque))] uppercase tracking-wide mb-3">Dados do Trabalho</legend>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Aluno</label>
                <input
                  type="text"
                  value={tcc.aluno_dados?.nome_completo || ''}
                  disabled
                  className="w-full px-3 py-2 bg-[rgb(var(--cor-fundo))]/50 border border-[rgb(var(--cor-borda))] rounded-lg text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
                />
              </div>
              <div>
                <label className={labelClass}>Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Semestre</label>
                  <input
                    type="text"
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                    placeholder="Ex: 2025.1"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Etapa atual</label>
                  <select
                    value={etapaAtual}
                    onChange={(e) => setEtapaAtual(e.target.value as EtapaTCC)}
                    className={inputClass}
                  >
                    {Object.entries(EtapaTCCLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Seção: Orientação */}
          <fieldset>
            <legend className="text-sm font-semibold text-[rgb(var(--cor-destaque))] uppercase tracking-wide mb-3">Orientação</legend>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Orientador</label>
                <select
                  value={orientador ?? ''}
                  onChange={(e) => setOrientador(e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">Sem orientador</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome_completo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Coorientador (interno)</label>
                <select
                  value={coorientador ?? ''}
                  onChange={(e) => setCoorientador(e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">Sem coorientador interno</option>
                  {avaliadores.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome_completo}</option>
                  ))}
                </select>
              </div>

              {!coorientador && (
                <div className="p-4 bg-[rgb(var(--cor-fundo))] rounded-lg border border-[rgb(var(--cor-borda))] space-y-3">
                  <p className="text-xs font-medium text-[rgb(var(--cor-texto-secundario))] uppercase tracking-wide">Coorientador externo</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Nome</label>
                      <input type="text" value={coorientadorNome} onChange={(e) => setCoorientadorNome(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Titulação</label>
                      <input type="text" value={coorientadorTitulacao} onChange={(e) => setCoorientadorTitulacao(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Afiliação</label>
                      <input type="text" value={coorientadorAfiliacao} onChange={(e) => setCoorientadorAfiliacao(e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Lattes</label>
                      <input type="url" value={coorientadorLattes} onChange={(e) => setCoorientadorLattes(e.target.value)}
                        placeholder="https://lattes.cnpq.br/..."
                        className="w-full px-3 py-2 bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* Seção: Documentos (checklist) */}
          <fieldset>
            <legend className="text-sm font-semibold text-[rgb(var(--cor-destaque))] uppercase tracking-wide mb-3">Documentos</legend>
            <div className="grid grid-cols-2 gap-2">
              {documentosChecklist.map(({ tipo, label }) => {
                const aprovado = documentosPostados.has(tipo)
                const existe = documentosExistentes.has(tipo)
                return (
                  <div
                    key={tipo}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      aprovado
                        ? 'bg-[rgb(var(--cor-sucesso))]/10 border-[rgb(var(--cor-sucesso))]/30'
                        : existe
                          ? 'bg-[rgb(var(--cor-alerta))]/10 border-[rgb(var(--cor-alerta))]/30'
                          : 'bg-[rgb(var(--cor-fundo))] border-[rgb(var(--cor-borda))]'
                    }`}
                  >
                    {aprovado ? (
                      <CheckSquare className="w-4 h-4 text-[rgb(var(--cor-sucesso))] shrink-0" />
                    ) : existe ? (
                      <FileText className="w-4 h-4 text-[rgb(var(--cor-alerta))] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[rgb(var(--cor-texto-secundario))]/40 shrink-0" />
                    )}
                    <span className={`text-sm ${
                      aprovado
                        ? 'text-[rgb(var(--cor-sucesso))]'
                        : existe
                          ? 'text-[rgb(var(--cor-alerta))]'
                          : 'text-[rgb(var(--cor-texto-secundario))]'
                    }`}>
                      {label}
                    </span>
                    {existe && !aprovado && (
                      <span className="text-xs text-[rgb(var(--cor-alerta))] ml-auto">Pendente</span>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>

          {/* Seção: Avaliações Fase I */}
          <fieldset>
            <button
              type="button"
              onClick={() => setSecaoFase1(!secaoFase1)}
              className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--cor-destaque))] uppercase tracking-wide mb-3 hover:opacity-80 transition-opacity"
            >
              Avaliações — Fase I
              {avaliacoesFase1.length > 0 && <span className="text-xs font-normal normal-case text-[rgb(var(--cor-texto-secundario))]">({avaliacoesFase1.length} avaliador{avaliacoesFase1.length !== 1 ? 'es' : ''})</span>}
              {secaoFase1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {secaoFase1 && (
              <div className="space-y-4">
                {carregandoAvaliacoes ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-[rgb(var(--cor-texto-secundario))]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Carregando avaliações...</span>
                  </div>
                ) : avaliacoesFase1.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))] italic py-2">Nenhuma avaliação da Fase I encontrada.</p>
                ) : (
                  avaliacoesFase1.map((aval, idx) => (
                    <div key={aval.avaliadorId} className="p-4 bg-[rgb(var(--cor-fundo))] rounded-lg border border-[rgb(var(--cor-borda))] space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{aval.avaliadorNome}</p>
                        <div className="flex items-center gap-2">
                          {aval.nota_final !== null && (
                            <span className="text-xs font-medium text-[rgb(var(--cor-destaque))]">Nota: {aval.nota_final}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            aval.status === 'CONCLUIDO' ? 'bg-[rgb(var(--cor-sucesso))]/20 text-[rgb(var(--cor-sucesso))]' :
                            aval.status === 'ENVIADO' ? 'bg-[rgb(var(--cor-destaque))]/20 text-[rgb(var(--cor-destaque))]' :
                            aval.status === 'BLOQUEADO' ? 'bg-[rgb(var(--cor-erro))]/20 text-[rgb(var(--cor-erro))]' :
                            'bg-[rgb(var(--cor-alerta))]/20 text-[rgb(var(--cor-alerta))]'
                          }`}>{aval.status === 'CONCLUIDO' ? 'CONCLUÍDO' : aval.status}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Resumo <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF1.peso_resumo)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_resumo}
                            onChange={(e) => atualizarFase1(idx, 'nota_resumo', clampScore(e.target.value, pesosF1.peso_resumo, aval.nota_resumo))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Introdução <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF1.peso_introducao)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_introducao}
                            onChange={(e) => atualizarFase1(idx, 'nota_introducao', clampScore(e.target.value, pesosF1.peso_introducao, aval.nota_introducao))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Revisão <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF1.peso_revisao)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_revisao}
                            onChange={(e) => atualizarFase1(idx, 'nota_revisao', clampScore(e.target.value, pesosF1.peso_revisao, aval.nota_revisao))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Desenv. <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF1.peso_desenvolvimento)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_desenvolvimento}
                            onChange={(e) => atualizarFase1(idx, 'nota_desenvolvimento', clampScore(e.target.value, pesosF1.peso_desenvolvimento, aval.nota_desenvolvimento))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Conclusões <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF1.peso_conclusoes)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_conclusoes}
                            onChange={(e) => atualizarFase1(idx, 'nota_conclusoes', clampScore(e.target.value, pesosF1.peso_conclusoes, aval.nota_conclusoes))}
                            className={notaInputClass} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-[rgb(var(--cor-texto-secundario))]">Comentários por critério</p>
                        {SECOES_FASE1.map(secao => (
                          <div key={secao}>
                            <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-0.5">{secao}</label>
                            <textarea
                              value={aval.comentarios[secao] || ''}
                              onChange={(e) => atualizarComentarioFase1(idx, secao, e.target.value)}
                              rows={1}
                              className="w-full px-3 py-1.5 bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] resize-y"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </fieldset>

          {/* Seção: Avaliações Fase II */}
          <fieldset>
            <button
              type="button"
              onClick={() => setSecaoFase2(!secaoFase2)}
              className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--cor-destaque))] uppercase tracking-wide mb-3 hover:opacity-80 transition-opacity"
            >
              Avaliações — Fase II
              {avaliacoesFase2.length > 0 && <span className="text-xs font-normal normal-case text-[rgb(var(--cor-texto-secundario))]">({avaliacoesFase2.length} avaliador{avaliacoesFase2.length !== 1 ? 'es' : ''})</span>}
              {secaoFase2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {secaoFase2 && (
              <div className="space-y-4">
                {carregandoAvaliacoes ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-[rgb(var(--cor-texto-secundario))]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Carregando avaliações...</span>
                  </div>
                ) : avaliacoesFase2.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))] italic py-2">Nenhuma avaliação da Fase II encontrada.</p>
                ) : (
                  avaliacoesFase2.map((aval, idx) => (
                    <div key={aval.avaliadorId} className="p-4 bg-[rgb(var(--cor-fundo))] rounded-lg border border-[rgb(var(--cor-borda))] space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{aval.avaliadorNome}</p>
                        <div className="flex items-center gap-2">
                          {aval.nota_final !== null && (
                            <span className="text-xs font-medium text-[rgb(var(--cor-destaque))]">Nota: {aval.nota_final}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            aval.status === 'CONCLUIDO' ? 'bg-[rgb(var(--cor-sucesso))]/20 text-[rgb(var(--cor-sucesso))]' :
                            aval.status === 'ENVIADO' ? 'bg-[rgb(var(--cor-destaque))]/20 text-[rgb(var(--cor-destaque))]' :
                            aval.status === 'BLOQUEADO' ? 'bg-[rgb(var(--cor-erro))]/20 text-[rgb(var(--cor-erro))]' :
                            'bg-[rgb(var(--cor-alerta))]/20 text-[rgb(var(--cor-alerta))]'
                          }`}>{aval.status === 'CONCLUIDO' ? 'CONCLUÍDO' : aval.status}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Coerência <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF2.peso_coerencia_conteudo)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_coerencia_conteudo}
                            onChange={(e) => atualizarFase2(idx, 'nota_coerencia_conteudo', clampScore(e.target.value, pesosF2.peso_coerencia_conteudo, aval.nota_coerencia_conteudo))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Apresentação <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF2.peso_qualidade_apresentacao)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_qualidade_apresentacao}
                            onChange={(e) => atualizarFase2(idx, 'nota_qualidade_apresentacao', clampScore(e.target.value, pesosF2.peso_qualidade_apresentacao, aval.nota_qualidade_apresentacao))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Domínio <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF2.peso_dominio_tema)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_dominio_tema}
                            onChange={(e) => atualizarFase2(idx, 'nota_dominio_tema', clampScore(e.target.value, pesosF2.peso_dominio_tema, aval.nota_dominio_tema))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Clareza <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF2.peso_clareza_fluencia)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_clareza_fluencia}
                            onChange={(e) => atualizarFase2(idx, 'nota_clareza_fluencia', clampScore(e.target.value, pesosF2.peso_clareza_fluencia, aval.nota_clareza_fluencia))}
                            className={notaInputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-1">Tempo <span className="text-[rgb(var(--cor-texto-terciario))]">/ {fmtPeso(pesosF2.peso_observancia_tempo)}</span></label>
                          <input type="text" inputMode="decimal" placeholder="–" value={aval.nota_observancia_tempo}
                            onChange={(e) => atualizarFase2(idx, 'nota_observancia_tempo', clampScore(e.target.value, pesosF2.peso_observancia_tempo, aval.nota_observancia_tempo))}
                            className={notaInputClass} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-[rgb(var(--cor-texto-secundario))]">Comentários por critério</p>
                        {SECOES_FASE2.map(secao => (
                          <div key={secao}>
                            <label className="block text-xs text-[rgb(var(--cor-texto-secundario))] mb-0.5">{secao}</label>
                            <textarea
                              value={aval.comentarios[secao] || ''}
                              onChange={(e) => atualizarComentarioFase2(idx, secao, e.target.value)}
                              rows={1}
                              className="w-full px-3 py-1.5 bg-[rgb(var(--cor-superficie))] border border-[rgb(var(--cor-borda-forte))] rounded-lg text-[rgb(var(--cor-texto-primario))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] resize-y"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </fieldset>

          {/* Seção: Flags de Controle (colapsável) */}
          <fieldset>
            <button
              type="button"
              onClick={() => setSecaoFlags(!secaoFlags)}
              className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--cor-destaque))] uppercase tracking-wide mb-3 hover:opacity-80 transition-opacity"
            >
              Liberações de prazo
              {secaoFlags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {secaoFlags && (
              <div className="space-y-3 p-4 bg-[rgb(var(--cor-fundo))] rounded-lg border border-[rgb(var(--cor-borda))]">
                {[
                  { label: 'Envio de documentos iniciais', value: liberarEnvioDocumentos, setter: setLiberarEnvioDocumentos },
                  { label: 'Fase de desenvolvimento', value: liberarDesenvolvimento, setter: setLiberarDesenvolvimento },
                  { label: 'Confirmação de continuidade', value: liberarContinuidade, setter: setLiberarContinuidade },
                  { label: 'Avaliação Fase I', value: liberarFase1, setter: setLiberarFase1 },
                  { label: 'Período de defesas', value: liberarDefesas, setter: setLiberarDefesas },
                  { label: 'Avaliação Fase II', value: liberarFase2, setter: setLiberarFase2 },
                  { label: 'Ajustes finais', value: liberarAjustesFinais, setter: setLiberarAjustesFinais },
                ].map(({ label, value, setter }) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-[rgb(var(--cor-texto-primario))] group-hover:text-[rgb(var(--cor-destaque))] transition-colors">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={value}
                      onClick={() => setter(!value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:ring-offset-2 ${
                        value ? 'bg-[rgb(var(--cor-destaque))]' : 'bg-[rgb(var(--cor-borda-forte))]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--cor-borda))]">
          <button
            onClick={onClose}
            disabled={salvando}
            className="px-4 py-2 text-sm text-[rgb(var(--cor-texto-secundario))] hover:bg-[rgb(var(--cor-fundo))] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 transition-colors disabled:opacity-50"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
