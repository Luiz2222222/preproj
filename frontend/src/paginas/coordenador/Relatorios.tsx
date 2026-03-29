/**
 * Página de Relatórios do Coordenador
 * Exibe dados em formato de planilha com abas
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  ChevronDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTCCsCoordenador } from '../../hooks'
import { obterBancaFase1, obterAvaliacoesFase1 } from '../../servicos/fase1'
import { obterAvaliacoesFase2 } from '../../servicos/fase2'
import type { TCC, BancaFase1, AvaliacaoFase1, AvaliacaoFase2 } from '../../types'

type AbaAtiva = 'dados-gerais' | 'avaliacoes-fase1' | 'bancas-fase2' | 'apuracao-final' | 'relatorio-avaliacao'
type CampoFiltroDadosGerais = 'todos' | 'id' | 'aluno' | 'titulo' | 'orientador' | 'coorientador' | 'avaliador' | 'curso' | 'semestre'
type CampoFiltroApuracao = 'todos' | 'id' | 'aluno' | 'titulo' | 'orientador'
type CampoFiltro = CampoFiltroDadosGerais | CampoFiltroApuracao

export function Relatorios() {
  const { tccs, carregando, erro, recarregar } = useTCCsCoordenador()
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('dados-gerais')
  const [searchTerm, setSearchTerm] = useState('')
  const [campoFiltro, setCampoFiltro] = useState<CampoFiltro>('todos')
  const [bancasMap, setBancasMap] = useState<Map<number, BancaFase1>>(new Map())
  const [avaliacoesFase1Map, setAvaliacoesFase1Map] = useState<Map<number, AvaliacaoFase1[]>>(new Map())
  const [avaliacoesFase2Map, setAvaliacoesFase2Map] = useState<Map<number, AvaliacaoFase2[]>>(new Map())

  // Resetar filtro ao trocar de aba
  useEffect(() => {
    setCampoFiltro('todos')
  }, [abaAtiva])

  // Buscar bancas para todos os TCCs em paralelo
  useEffect(() => {
    if (tccs.length === 0) return

    const buscarBancas = async () => {
      try {
        // Buscar bancas em paralelo para todos os TCCs
        const promessas = tccs.map(async (tcc) => {
          try {
            const banca = await obterBancaFase1(tcc.id)
            return { tccId: tcc.id, banca }
          } catch (err) {
            // Se der erro (ex: banca não existe), retornar null
            return { tccId: tcc.id, banca: null }
          }
        })

        const resultados = await Promise.all(promessas)

        // Criar mapa de bancas
        const novoMap = new Map<number, BancaFase1>()
        resultados.forEach(({ tccId, banca }) => {
          if (banca) {
            novoMap.set(tccId, banca)
          }
        })

        setBancasMap(novoMap)
      } catch (err) {
        console.error('Erro ao buscar bancas:', err)
      }
    }

    buscarBancas()
  }, [tccs])

  // Buscar avaliações das Fases 1 e 2 para todos os TCCs
  useEffect(() => {
    if (tccs.length === 0) return

    const buscarAvaliacoes = async () => {
      try {
        // Buscar avaliações Fase 1 em paralelo
        const promessasFase1 = tccs.map(async (tcc) => {
          try {
            const avaliacoes = await obterAvaliacoesFase1(tcc.id)
            return { tccId: tcc.id, avaliacoes }
          } catch (err) {
            return { tccId: tcc.id, avaliacoes: [] }
          }
        })

        // Buscar avaliações Fase 2 em paralelo
        const promessasFase2 = tccs.map(async (tcc) => {
          try {
            const avaliacoes = await obterAvaliacoesFase2(tcc.id)
            return { tccId: tcc.id, avaliacoes }
          } catch (err) {
            return { tccId: tcc.id, avaliacoes: [] }
          }
        })

        const [resultadosFase1, resultadosFase2] = await Promise.all([
          Promise.all(promessasFase1),
          Promise.all(promessasFase2)
        ])

        // Criar mapas
        const mapFase1 = new Map<number, AvaliacaoFase1[]>()
        resultadosFase1.forEach(({ tccId, avaliacoes }) => {
          mapFase1.set(tccId, avaliacoes)
        })

        const mapFase2 = new Map<number, AvaliacaoFase2[]>()
        resultadosFase2.forEach(({ tccId, avaliacoes }) => {
          mapFase2.set(tccId, avaliacoes)
        })

        setAvaliacoesFase1Map(mapFase1)
        setAvaliacoesFase2Map(mapFase2)
      } catch (err) {
        console.error('Erro ao buscar avaliações:', err)
      }
    }

    buscarAvaliacoes()
  }, [tccs])

  // Filtrar TCCs para aba Dados Gerais
  const tccsFiltradosDadosGerais = useMemo(() => {
    if (!searchTerm.trim()) return tccs

    const termo = searchTerm.toLowerCase()

    return tccs.filter(tcc => {
      // Determinar dados do coorientador (interno ou externo)
      const coorientadorNome = tcc.coorientador_dados?.nome_completo || tcc.coorientador_nome || ''

      // Obter avaliadores da banca (Fase 1)
      const banca = bancasMap.get(tcc.id)
      const avaliadores = banca?.membros
        ? banca.membros
            .filter(membro => membro.tipo === 'AVALIADOR')
            .map(membro => membro.usuario_dados.nome_completo.toLowerCase())
        : []

      // Se "Todos os campos" está selecionado, buscar em todos
      if (campoFiltro === 'todos') {
        return (
          tcc.id.toString().includes(termo) ||
          tcc.aluno_dados?.nome_completo?.toLowerCase().includes(termo) ||
          tcc.titulo?.toLowerCase().includes(termo) ||
          tcc.orientador_dados?.nome_completo?.toLowerCase().includes(termo) ||
          tcc.aluno_dados?.curso?.toLowerCase().includes(termo) ||
          tcc.semestre?.toLowerCase().includes(termo) ||
          coorientadorNome.toLowerCase().includes(termo) ||
          avaliadores.some(nome => nome.includes(termo))
        )
      }

      // Caso contrário, buscar apenas no campo específico
      switch (campoFiltro) {
        case 'id':
          return tcc.id.toString().includes(termo)
        case 'aluno':
          return tcc.aluno_dados?.nome_completo?.toLowerCase().includes(termo) || false
        case 'titulo':
          return tcc.titulo?.toLowerCase().includes(termo) || false
        case 'orientador':
          return tcc.orientador_dados?.nome_completo?.toLowerCase().includes(termo) || false
        case 'curso':
          return tcc.aluno_dados?.curso?.toLowerCase().includes(termo) || false
        case 'semestre':
          return tcc.semestre?.toLowerCase().includes(termo) || false
        case 'coorientador':
          return coorientadorNome.toLowerCase().includes(termo)
        case 'avaliador':
          return avaliadores.some(nome => nome.includes(termo))
        default:
          return false
      }
    })
  }, [tccs, searchTerm, campoFiltro, bancasMap])

  // Filtrar TCCs para aba Apuração Final
  const tccsFiltradosApuracao = useMemo(() => {
    if (!searchTerm.trim()) return tccs

    const termo = searchTerm.toLowerCase()

    return tccs.filter(tcc => {
      // Se "Todos os campos" está selecionado, buscar em todos
      if (campoFiltro === 'todos') {
        return (
          tcc.id.toString().includes(termo) ||
          tcc.aluno_dados?.nome_completo?.toLowerCase().includes(termo) ||
          tcc.titulo?.toLowerCase().includes(termo) ||
          tcc.orientador_dados?.nome_completo?.toLowerCase().includes(termo)
        )
      }

      // Caso contrário, buscar apenas no campo específico
      switch (campoFiltro) {
        case 'id':
          return tcc.id.toString().includes(termo)
        case 'aluno':
          return tcc.aluno_dados?.nome_completo?.toLowerCase().includes(termo) || false
        case 'titulo':
          return tcc.titulo?.toLowerCase().includes(termo) || false
        case 'orientador':
          return tcc.orientador_dados?.nome_completo?.toLowerCase().includes(termo) || false
        default:
          return false
      }
    })
  }, [tccs, searchTerm, campoFiltro, avaliacoesFase1Map, avaliacoesFase2Map])

  // Filtrar TCCs para aba Avaliações Fase I
  const tccsFiltradosAvaliacoesFase1 = useMemo(() => {
    if (!searchTerm.trim()) return tccs

    const termo = searchTerm.toLowerCase()

    return tccs.filter(tcc => {
      // Se "Todos os campos" está selecionado, buscar em todos
      if (campoFiltro === 'todos') {
        return (
          tcc.id.toString().includes(termo) ||
          tcc.aluno_dados?.nome_completo?.toLowerCase().includes(termo) ||
          tcc.titulo?.toLowerCase().includes(termo) ||
          tcc.orientador_dados?.nome_completo?.toLowerCase().includes(termo)
        )
      }

      // Caso contrário, buscar apenas no campo específico
      switch (campoFiltro) {
        case 'id':
          return tcc.id.toString().includes(termo)
        case 'aluno':
          return tcc.aluno_dados?.nome_completo?.toLowerCase().includes(termo) || false
        case 'titulo':
          return tcc.titulo?.toLowerCase().includes(termo) || false
        case 'orientador':
          return tcc.orientador_dados?.nome_completo?.toLowerCase().includes(termo) || false
        default:
          return false
      }
    })
  }, [tccs, searchTerm, campoFiltro])

  // Selecionar TCCs filtrados baseado na aba ativa
  const tccsFiltrados = abaAtiva === 'dados-gerais'
    ? tccsFiltradosDadosGerais
    : abaAtiva === 'avaliacoes-fase1'
    ? tccsFiltradosAvaliacoesFase1
    : abaAtiva === 'relatorio-avaliacao'
    ? tccsFiltradosDadosGerais // Usa todos os TCCs sem filtros específicos
    : abaAtiva === 'bancas-fase2'
    ? tccsFiltradosApuracao
    : tccsFiltradosApuracao

  // Helper para formatar nota como número (para o Excel)
  const notaNum = (valor: number | string | null | undefined): number | null => {
    if (valor === null || valor === undefined) return null
    const numero = typeof valor === 'number' ? valor : parseFloat(String(valor))
    return Number.isNaN(numero) ? null : Math.round(numero * 100) / 100
  }

  const exportarParaExcel = useCallback(() => {
    const wb = XLSX.utils.book_new()

    // === ABA 1: Dados Gerais ===
    const dadosGeraisRows = tccs.map((tcc) => {
      const coorientadorNome = tcc.coorientador_dados?.nome_completo || tcc.coorientador_nome || ''
      const coorientadorTratamento = tcc.coorientador_dados?.tratamento || tcc.coorientador_titulacao || ''
      const coorientadorAfiliacao = tcc.coorientador_dados?.afiliacao || tcc.coorientador_afiliacao || ''
      const banca = bancasMap.get(tcc.id)
      const avaliadores = banca?.membros
        .filter(m => m.tipo === 'AVALIADOR')
        .sort((a, b) => a.ordem - b.ordem) || []

      return {
        'ID': tcc.id,
        'Curso': tcc.aluno_dados?.curso_display || tcc.aluno_dados?.curso || '',
        'Título': tcc.titulo,
        'Aluno': tcc.aluno_dados?.nome_completo || '',
        'Orientador': tcc.orientador_dados?.nome_completo || '',
        'Orientador - Tratamento': tcc.orientador_dados?.tratamento || '',
        'Orientador - Afiliação': tcc.orientador_dados?.afiliacao || '',
        'Coorientador': coorientadorNome,
        'Coorientador - Tratamento': coorientadorTratamento,
        'Coorientador - Afiliação': coorientadorAfiliacao,
        'Avaliador 1 (Fase I)': avaliadores[0]?.usuario_dados?.nome_completo || '',
        'Avaliador 2 (Fase I)': avaliadores[1]?.usuario_dados?.nome_completo || '',
        'Avaliador 1 (Fase II)': tcc.orientador_dados?.nome_completo || '',
        'Avaliador 2 (Fase II)': avaliadores[0]?.usuario_dados?.nome_completo || '',
        'Avaliador 3 (Fase II)': avaliadores[1]?.usuario_dados?.nome_completo || '',
        'Data Defesa': tcc.data_defesa ? new Date(tcc.data_defesa).toLocaleDateString('pt-BR') : '',
        'Semestre': tcc.semestre,
      }
    })
    const ws1 = XLSX.utils.json_to_sheet(dadosGeraisRows)
    XLSX.utils.book_append_sheet(wb, ws1, 'Dados Gerais')

    // === ABA 2: Avaliações Fase I ===
    const fase1Rows: Record<string, any>[] = []
    tccs.forEach((tcc) => {
      const banca = bancasMap.get(tcc.id)
      const avaliadores = banca?.membros
        .filter(m => m.tipo === 'AVALIADOR')
        .sort((a, b) => a.ordem - b.ordem) || []
      const avaliacoes = avaliacoesFase1Map.get(tcc.id) || []

      // Uma linha por avaliador
      const avalsOrdenadas = avaliadores.map(av => {
        const aval = avaliacoes.find(a => a.avaliador === av.usuario)
        return { nome: av.usuario_dados?.nome_completo || '', aval }
      })

      // Se não houver avaliadores, pelo menos uma linha com dados básicos
      if (avalsOrdenadas.length === 0) {
        fase1Rows.push({
          'ID': tcc.id,
          'Título': tcc.titulo,
          'Aluno': tcc.aluno_dados?.nome_completo || '',
          'Orientador': tcc.orientador_dados?.nome_completo || '',
          'Avaliador': '',
          'Q1 - Resumo': null,
          'Q2 - Introdução': null,
          'Q3 - Revisão': null,
          'Q4 - Desenvolvimento': null,
          'Q5 - Conclusões': null,
          'Nota Total': null,
        })
      } else {
        avalsOrdenadas.forEach(({ nome, aval }) => {
          fase1Rows.push({
            'ID': tcc.id,
            'Título': tcc.titulo,
            'Aluno': tcc.aluno_dados?.nome_completo || '',
            'Orientador': tcc.orientador_dados?.nome_completo || '',
            'Avaliador': nome,
            'Q1 - Resumo': notaNum(aval?.nota_resumo),
            'Q2 - Introdução': notaNum(aval?.nota_introducao),
            'Q3 - Revisão': notaNum(aval?.nota_revisao),
            'Q4 - Desenvolvimento': notaNum(aval?.nota_desenvolvimento),
            'Q5 - Conclusões': notaNum(aval?.nota_conclusoes),
            'Nota Total': notaNum(aval?.nota_final),
          })
        })
      }
    })
    const ws2 = XLSX.utils.json_to_sheet(fase1Rows)
    XLSX.utils.book_append_sheet(wb, ws2, 'Avaliações Fase I')

    // === ABA 3: Avaliações Fase II ===
    const fase2Rows: Record<string, any>[] = []
    tccs.forEach((tcc) => {
      const banca = bancasMap.get(tcc.id)
      const avaliadoresFase1 = banca?.membros
        .filter(m => m.tipo === 'AVALIADOR')
        .sort((a, b) => a.ordem - b.ordem) || []
      const avaliacoes = avaliacoesFase2Map.get(tcc.id) || []

      // Montar avaliadores esperados: orientador + 2 da fase I
      let aval1 = avaliacoes.find(av => av.avaliador === tcc.orientador)
      if (!aval1 && tcc.coorientador) {
        aval1 = avaliacoes.find(av => av.avaliador === tcc.coorientador)
      }
      const aval2 = avaliacoes.find(av => av.avaliador === avaliadoresFase1[0]?.usuario)
      const aval3 = avaliacoes.find(av => av.avaliador === avaliadoresFase1[1]?.usuario)

      const listaAvals = [
        { nome: aval1?.avaliador_dados?.nome_completo || tcc.orientador_dados?.nome_completo || '', aval: aval1 },
        { nome: aval2?.avaliador_dados?.nome_completo || avaliadoresFase1[0]?.usuario_dados?.nome_completo || '', aval: aval2 },
        { nome: aval3?.avaliador_dados?.nome_completo || avaliadoresFase1[1]?.usuario_dados?.nome_completo || '', aval: aval3 },
      ]

      listaAvals.forEach(({ nome, aval }) => {
        fase2Rows.push({
          'ID': tcc.id,
          'Título': tcc.titulo,
          'Aluno': tcc.aluno_dados?.nome_completo || '',
          'Orientador': tcc.orientador_dados?.nome_completo || '',
          'Avaliador': nome,
          'Q1 - Coerência': notaNum(aval?.nota_coerencia_conteudo),
          'Q2 - Qualidade': notaNum(aval?.nota_qualidade_apresentacao),
          'Q3 - Domínio': notaNum(aval?.nota_dominio_tema),
          'Q4 - Clareza': notaNum(aval?.nota_clareza_fluencia),
          'Q5 - Tempo': notaNum(aval?.nota_observancia_tempo),
          'Nota Total': notaNum(aval?.nota_final),
        })
      })
    })
    const ws3 = XLSX.utils.json_to_sheet(fase2Rows)
    XLSX.utils.book_append_sheet(wb, ws3, 'Avaliações Fase II')

    // === ABA 4: Apuração Final ===
    const apuracaoRows = tccs.map((tcc) => {
      const avalsFase1 = avaliacoesFase1Map.get(tcc.id) || []
      const n1f1 = notaNum(avalsFase1[0]?.nota_final)
      const n2f1 = notaNum(avalsFase1[1]?.nota_final)
      const mediaF1 = (n1f1 !== null && n2f1 !== null) ? Math.round(((n1f1 + n2f1) / 2) * 100) / 100 : null
      const pesoF1 = mediaF1 !== null ? Math.round((mediaF1 * 0.6) * 100) / 100 : null

      const avalsFase2 = avaliacoesFase2Map.get(tcc.id) || []
      const notaOrientF2 = notaNum(avalsFase2.find(a => a.avaliador === tcc.orientador)?.nota_final)
      const outrosFase2 = avalsFase2.filter(a => a.avaliador !== tcc.orientador).sort((a, b) => a.id - b.id)
      const n1f2 = notaNum(outrosFase2[0]?.nota_final)
      const n2f2 = notaNum(outrosFase2[1]?.nota_final)
      const mediaF2 = (notaOrientF2 !== null && n1f2 !== null && n2f2 !== null)
        ? Math.round(((notaOrientF2 + n1f2 + n2f2) / 3) * 100) / 100
        : null
      const pesoF2 = mediaF2 !== null ? Math.round((mediaF2 * 0.4) * 100) / 100 : null
      const notaFinal = (pesoF1 !== null && pesoF2 !== null)
        ? Math.round((pesoF1 + pesoF2) * 100) / 100
        : null

      return {
        'ID': tcc.id,
        'Título': tcc.titulo,
        'Aluno': tcc.aluno_dados?.nome_completo || '',
        'Orientador': tcc.orientador_dados?.nome_completo || '',
        'Fase I - Nota 1': n1f1,
        'Fase I - Nota 2': n2f1,
        'Fase I - Média': mediaF1,
        'Fase I - Nota com peso (60%)': pesoF1,
        'Fase II - Nota 1': notaOrientF2,
        'Fase II - Nota 2': n1f2,
        'Fase II - Nota 3': n2f2,
        'Fase II - Média': mediaF2,
        'Fase II - Nota com peso (40%)': pesoF2,
        'Nota Final': notaFinal,
      }
    })
    const ws4 = XLSX.utils.json_to_sheet(apuracaoRows)
    XLSX.utils.book_append_sheet(wb, ws4, 'Apuração Final')

    // === ABA 5: Relatório de Avaliação ===
    const relatorioRows: Record<string, any>[] = []
    tccs.forEach((tcc) => {
      const banca = bancasMap.get(tcc.id)
      const avaliadoresBanca = banca?.membros
        .filter(m => m.tipo === 'AVALIADOR')
        .sort((a, b) => a.ordem - b.ordem) || []
      const avaliacoesFase1 = avaliacoesFase1Map.get(tcc.id) || []
      const avaliacoesFase2List = avaliacoesFase2Map.get(tcc.id) || []

      const aval1F1 = avaliacoesFase1.find(av => av.avaliador === avaliadoresBanca[0]?.usuario)
      const aval2F1 = avaliacoesFase1.find(av => av.avaliador === avaliadoresBanca[1]?.usuario)

      let aval1F2 = avaliacoesFase2List.find(av => av.avaliador === tcc.orientador)
      if (!aval1F2 && tcc.coorientador) {
        aval1F2 = avaliacoesFase2List.find(av => av.avaliador === tcc.coorientador)
      }
      const aval2F2 = avaliacoesFase2List.find(av => av.avaliador === avaliadoresBanca[0]?.usuario)
      const aval3F2 = avaliacoesFase2List.find(av => av.avaliador === avaliadoresBanca[1]?.usuario)

      relatorioRows.push({
        'ID': tcc.id,
        'Título': tcc.titulo,
        'Aluno': tcc.aluno_dados?.nome_completo || '',
        'Data Defesa': tcc.data_defesa ? new Date(tcc.data_defesa).toLocaleDateString('pt-BR') : '',
        'Avaliador 1 (Fase I)': aval1F1?.avaliador_dados?.nome_completo || avaliadoresBanca[0]?.usuario_dados?.nome_completo || '',
        'Parecer Avaliador 1 (Fase I)': aval1F1?.parecer || '',
        'Avaliador 2 (Fase I)': aval2F1?.avaliador_dados?.nome_completo || avaliadoresBanca[1]?.usuario_dados?.nome_completo || '',
        'Parecer Avaliador 2 (Fase I)': aval2F1?.parecer || '',
        'Avaliador 1 (Fase II)': aval1F2?.avaliador_dados?.nome_completo || tcc.orientador_dados?.nome_completo || '',
        'Parecer Avaliador 1 (Fase II)': aval1F2?.parecer || '',
        'Avaliador 2 (Fase II)': aval2F2?.avaliador_dados?.nome_completo || avaliadoresBanca[0]?.usuario_dados?.nome_completo || '',
        'Parecer Avaliador 2 (Fase II)': aval2F2?.parecer || '',
        'Avaliador 3 (Fase II)': aval3F2?.avaliador_dados?.nome_completo || avaliadoresBanca[1]?.usuario_dados?.nome_completo || '',
        'Parecer Avaliador 3 (Fase II)': aval3F2?.parecer || '',
      })
    })
    const ws5 = XLSX.utils.json_to_sheet(relatorioRows)
    XLSX.utils.book_append_sheet(wb, ws5, 'Relatório de Avaliação')

    // Ajustar largura das colunas em todas as sheets
    wb.SheetNames.forEach(name => {
      const ws = wb.Sheets[name]
      const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
      if (data.length > 0) {
        ws['!cols'] = data[0].map((_: any, colIdx: number) => {
          let maxLen = 10
          data.forEach((row: any[]) => {
            const cell = row[colIdx]
            if (cell) {
              const len = String(cell).length
              if (len > maxLen) maxLen = Math.min(len, 60)
            }
          })
          return { wch: maxLen + 2 }
        })
      }
    })

    XLSX.writeFile(wb, `Relatorio_TCCs_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [tccs, bancasMap, avaliacoesFase1Map, avaliacoesFase2Map])

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cor-destaque mx-auto mb-4" />
          <p className="text-cor-texto/60">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="bg-cor-erro/10 border border-cor-erro/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-cor-erro" />
          <h3 className="text-lg font-semibold text-cor-erro">Erro ao carregar relatórios</h3>
        </div>
        <p className="text-cor-erro/80 mb-4">{erro}</p>
        <button
          onClick={recarregar}
          className="flex items-center gap-2 px-4 py-2 bg-cor-erro text-white rounded-lg hover:bg-cor-erro/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cor-texto flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-cor-destaque" />
            Relatórios
          </h1>
          <p className="text-cor-texto/60 mt-1">
            Visualização em formato de planilha dos dados de TCCs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={recarregar}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2 bg-cor-superficie border border-cor-borda rounded-lg hover:bg-cor-fundo transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportarParaExcel}
            className="flex items-center gap-2 px-4 py-2 bg-cor-destaque text-white rounded-lg hover:bg-cor-destaque/90 transition-colors"
            title="Exportar para Excel"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cor-texto/40" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto placeholder:text-cor-texto/40 focus:outline-none focus:ring-2 focus:ring-cor-destaque focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={campoFiltro}
              onChange={(e) => setCampoFiltro(e.target.value as CampoFiltro)}
              className="appearance-none pl-4 pr-10 py-2 bg-cor-fundo border border-cor-borda rounded-lg text-cor-texto focus:outline-none focus:ring-2 focus:ring-cor-destaque focus:border-transparent cursor-pointer hover:bg-cor-superficie transition-colors"
            >
              <option value="todos">Todos os campos</option>
              <option value="id">ID</option>
              <option value="aluno">Aluno</option>
              <option value="titulo">Título</option>
              <option value="orientador">Orientador</option>
              {abaAtiva === 'dados-gerais' && (
                <>
                  <option value="coorientador">Coorientador</option>
                  <option value="avaliador">Avaliador</option>
                  <option value="curso">Curso</option>
                  <option value="semestre">Semestre</option>
                </>
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cor-texto/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Navegação entre abas */}
      <div className="flex gap-2 border-b border-cor-borda">
        <button
          onClick={() => setAbaAtiva('dados-gerais')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            abaAtiva === 'dados-gerais'
              ? 'text-cor-destaque border-cor-destaque'
              : 'text-cor-texto/60 border-transparent hover:text-cor-texto hover:border-cor-borda'
          }`}
        >
          Dados gerais
        </button>
        <button
          onClick={() => setAbaAtiva('avaliacoes-fase1')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            abaAtiva === 'avaliacoes-fase1'
              ? 'text-cor-destaque border-cor-destaque'
              : 'text-cor-texto/60 border-transparent hover:text-cor-texto hover:border-cor-borda'
          }`}
        >
          Avaliações - Fase I
        </button>
        <button
          onClick={() => setAbaAtiva('bancas-fase2')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            abaAtiva === 'bancas-fase2'
              ? 'text-cor-destaque border-cor-destaque'
              : 'text-cor-texto/60 border-transparent hover:text-cor-texto hover:border-cor-borda'
          }`}
        >
          Avaliações - Fase II
        </button>
        <button
          onClick={() => setAbaAtiva('apuracao-final')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            abaAtiva === 'apuracao-final'
              ? 'text-cor-destaque border-cor-destaque'
              : 'text-cor-texto/60 border-transparent hover:text-cor-texto hover:border-cor-borda'
          }`}
        >
          Apuração final
        </button>
        <button
          onClick={() => setAbaAtiva('relatorio-avaliacao')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            abaAtiva === 'relatorio-avaliacao'
              ? 'text-cor-destaque border-cor-destaque'
              : 'text-cor-texto/60 border-transparent hover:text-cor-texto hover:border-cor-borda'
          }`}
        >
          Relatório de avaliação
        </button>
      </div>

      {/* Contadores */}
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-4">
        <p className="text-sm text-cor-texto/60">
          Exibindo <span className="font-semibold text-cor-texto">{tccsFiltrados.length}</span> de{' '}
          <span className="font-semibold text-cor-texto">{tccs.length}</span> TCCs
        </p>
      </div>

      {/* Conteúdo das abas */}
      {abaAtiva === 'dados-gerais' && (
        <DadosGeraisTabela tccs={tccsFiltrados} bancasMap={bancasMap} />
      )}

      {abaAtiva === 'avaliacoes-fase1' && (
        <AvaliacoesFase1Tabela
          tccs={tccsFiltrados}
          avaliacoesFase1Map={avaliacoesFase1Map}
          bancasMap={bancasMap}
        />
      )}

      {abaAtiva === 'bancas-fase2' && (
        <BancasFase2Tabela
          tccs={tccsFiltrados}
          bancasMap={bancasMap}
          avaliacoesFase2Map={avaliacoesFase2Map}
        />
      )}

      {abaAtiva === 'apuracao-final' && (
        <ApuracaoFinalTabela
          tccs={tccsFiltrados}
          avaliacoesFase1Map={avaliacoesFase1Map}
          avaliacoesFase2Map={avaliacoesFase2Map}
        />
      )}

      {abaAtiva === 'relatorio-avaliacao' && (
        <RelatorioAvaliacaoTabela
          tccs={tccsFiltrados}
          bancasMap={bancasMap}
          avaliacoesFase1Map={avaliacoesFase1Map}
          avaliacoesFase2Map={avaliacoesFase2Map}
        />
      )}
    </div>
  )
}

// Componente: Tabela Dados Gerais (estrutura igual à planilha Excel)
function DadosGeraisTabela({ tccs, bancasMap }: { tccs: TCC[]; bancasMap: Map<number, BancaFase1> }) {
  if (tccs.length === 0) {
    return (
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-12 text-center">
        <FileSpreadsheet className="w-12 h-12 text-cor-texto/20 mx-auto mb-3" />
        <p className="text-cor-texto/60">Nenhum TCC encontrado</p>
      </div>
    )
  }

  // Componente para renderizar célula com dados empilhados (nome + tratamento + afiliação)
  const renderPessoaCell = (nome: string, tratamento: string, afiliacao: string) => {
    if (!nome) {
      return <span className="text-cor-texto/40">-</span>
    }

    return (
      <div className="space-y-0.5">
        <p className="text-cor-texto font-medium">{nome}</p>
        {tratamento && <p className="text-xs text-cor-texto/60">{tratamento}</p>}
        {afiliacao && <p className="text-xs text-cor-texto/50">{afiliacao}</p>}
      </div>
    )
  }

  return (
    <div className="bg-cor-superficie rounded-lg border border-cor-borda overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cor-fundo border-b border-cor-borda">
            {/* Linha de grupos de fases */}
            <tr>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">ID</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Curso</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Título</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Aluno</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Orientador</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Coorientador</th>
              <th colSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho border-r border-cor-borda">Fase I</th>
              <th colSpan={3} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho border-r border-cor-borda">Fase II</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Data Defesa</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap">Semestre</th>
            </tr>
            {/* Linha de colunas individuais */}
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho">Avaliador 1</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho border-r border-cor-borda">Avaliador 2</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Avaliador 1</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Avaliador 2</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho border-r border-cor-borda">Avaliador 3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cor-borda">
            {tccs.map((tcc) => {
              // Determinar dados do coorientador (interno ou externo)
              const coorientadorNome = tcc.coorientador_dados?.nome_completo || tcc.coorientador_nome || '';
              const coorientadorTratamento = tcc.coorientador_dados?.tratamento || tcc.coorientador_titulacao || '';
              const coorientadorAfiliacao = tcc.coorientador_dados?.afiliacao || tcc.coorientador_afiliacao || '';

              // Obter banca e extrair avaliadores
              const banca = bancasMap.get(tcc.id)
              const avaliadores = banca?.membros
                .filter(membro => membro.tipo === 'AVALIADOR')
                .sort((a, b) => a.ordem - b.ordem) || []

              return (
                <tr key={tcc.id} className="hover:bg-cor-fundo transition-colors">
                  {/* ID */}
                  <td className="px-3 py-3 text-cor-texto font-mono whitespace-nowrap align-top">
                    {tcc.id}
                  </td>

                  {/* Curso */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.aluno_dados?.curso_display || tcc.aluno_dados?.curso || '-'}
                  </td>

                  {/* Título */}
                  <td className="px-3 py-3 text-cor-texto max-w-xs align-top">
                    <p className="line-clamp-3" title={tcc.titulo}>{tcc.titulo}</p>
                  </td>

                  {/* Aluno */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.aluno_dados?.nome_completo || '-'}
                  </td>

                  {/* Orientador (nome + tratamento + afiliação) */}
                  <td className="px-3 py-3 whitespace-nowrap align-top">
                    {renderPessoaCell(
                      tcc.orientador_dados?.nome_completo || '',
                      tcc.orientador_dados?.tratamento || '',
                      tcc.orientador_dados?.afiliacao || ''
                    )}
                  </td>

                  {/* Coorientador (nome + tratamento + afiliação) */}
                  <td className="px-3 py-3 whitespace-nowrap align-top">
                    {renderPessoaCell(
                      coorientadorNome,
                      coorientadorTratamento,
                      coorientadorAfiliacao
                    )}
                  </td>

                  {/* Avaliador #1 Fase I */}
                  <td className="px-3 py-3 whitespace-nowrap align-top bg-cor-fase1-linha">
                    {avaliadores[0] ? renderPessoaCell(
                      avaliadores[0].usuario_dados.nome_completo,
                      avaliadores[0].usuario_dados.tratamento || '',
                      avaliadores[0].usuario_dados.afiliacao || ''
                    ) : <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Avaliador #2 Fase I */}
                  <td className="px-3 py-3 whitespace-nowrap align-top bg-cor-fase1-linha">
                    {avaliadores[1] ? renderPessoaCell(
                      avaliadores[1].usuario_dados.nome_completo,
                      avaliadores[1].usuario_dados.tratamento || '',
                      avaliadores[1].usuario_dados.afiliacao || ''
                    ) : <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Avaliador #1 Fase II (Orientador) */}
                  <td className="px-3 py-3 whitespace-nowrap align-top bg-cor-fase2-linha">
                    {renderPessoaCell(
                      tcc.orientador_dados?.nome_completo || '',
                      tcc.orientador_dados?.tratamento || '',
                      tcc.orientador_dados?.afiliacao || ''
                    )}
                  </td>

                  {/* Avaliador #2 Fase II (Avaliador #1 da Fase I) */}
                  <td className="px-3 py-3 whitespace-nowrap align-top bg-cor-fase2-linha">
                    {avaliadores[0] ? renderPessoaCell(
                      avaliadores[0].usuario_dados.nome_completo,
                      avaliadores[0].usuario_dados.tratamento || '',
                      avaliadores[0].usuario_dados.afiliacao || ''
                    ) : <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Avaliador #3 Fase II (Avaliador #2 da Fase I) */}
                  <td className="px-3 py-3 whitespace-nowrap align-top bg-cor-fase2-linha">
                    {avaliadores[1] ? renderPessoaCell(
                      avaliadores[1].usuario_dados.nome_completo,
                      avaliadores[1].usuario_dados.tratamento || '',
                      avaliadores[1].usuario_dados.afiliacao || ''
                    ) : <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Data Defesa */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.data_defesa ? new Date(tcc.data_defesa).toLocaleDateString('pt-BR') : '-'}
                  </td>

                  {/* Semestre */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.semestre}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente: Tabela Avaliações Fase I
function AvaliacoesFase1Tabela({
  tccs,
  avaliacoesFase1Map,
  bancasMap
}: {
  tccs: TCC[]
  avaliacoesFase1Map: Map<number, AvaliacaoFase1[]>
  bancasMap: Map<number, BancaFase1>
}) {
  // Função helper para formatar nota
  const formatarNota = (valor: number | string | null | undefined) => {
    if (valor === null || valor === undefined) return null
    const numero = typeof valor === 'number' ? valor : parseFloat(String(valor))
    if (Number.isNaN(numero)) return null
    return numero.toFixed(2).replace('.', ',')
  }

  if (tccs.length === 0) {
    return (
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-12 text-center">
        <FileSpreadsheet className="w-12 h-12 text-cor-texto/20 mx-auto mb-3" />
        <p className="text-cor-texto/60">Nenhum TCC encontrado</p>
        <p className="text-xs text-cor-texto/40 mt-1">
          Os TCCs aprovados pelo coordenador aparecerão aqui para acompanhamento das avaliações da Fase I
        </p>
      </div>
    )
  }

  return (
    <div className="bg-cor-superficie rounded-lg border border-cor-borda overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cor-fundo border-b border-cor-borda">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">ID</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Título</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Aluno</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Orientador</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Avaliadores</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Q1</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Q2</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Q3</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Q4</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Q5</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Nota Total</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho">Nota proporcional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cor-borda">
            {tccs.map((tcc) => {
              // Obter banca e extrair avaliadores ordenados pela ordem da banca
              const banca = bancasMap.get(tcc.id)
              const avaliadores = banca?.membros
                .filter(membro => membro.tipo === 'AVALIADOR')
                .sort((a, b) => a.ordem - b.ordem) || []

              const avaliacoes = avaliacoesFase1Map.get(tcc.id) || []

              // Encontrar a avaliação de cada avaliador cruzando pelo ID do usuário
              const aval1 = avaliacoes.find(av => av.avaliador === avaliadores[0]?.usuario)
              const aval2 = avaliacoes.find(av => av.avaliador === avaliadores[1]?.usuario)

              // Calcular F1NP (média das notas finais dos avaliadores)
              const notasFinais = [aval1?.nota_final, aval2?.nota_final].filter(n => n !== null && n !== undefined) as number[]
              const f1np = notasFinais.length > 0
                ? notasFinais.reduce((acc, n) => acc + n, 0) / notasFinais.length
                : null

              return (
                <tr key={tcc.id} className="hover:bg-cor-fundo transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap text-cor-texto border-r border-cor-borda">{tcc.id}</td>
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda max-w-xs truncate" title={tcc.titulo || '-'}>
                    {tcc.titulo || '-'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-cor-texto border-r border-cor-borda">
                    {tcc.aluno_dados?.nome_completo || '-'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-cor-texto border-r border-cor-borda">
                    {tcc.orientador_dados?.nome_completo || '-'}
                  </td>

                  {/* Avaliadores (empilhados) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs">{avaliadores[0]?.usuario_dados?.nome_completo || '-'}</div>
                      <div className="text-xs border-t border-cor-borda pt-1">{avaliadores[1]?.usuario_dados?.nome_completo || '-'}</div>
                    </div>
                  </td>

                  {/* Q1 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{aval1?.nota_resumo !== null && aval1?.nota_resumo !== undefined ? formatarNota(aval1.nota_resumo) : '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{aval2?.nota_resumo !== null && aval2?.nota_resumo !== undefined ? formatarNota(aval2.nota_resumo) : '-'}</div>
                    </div>
                  </td>

                  {/* Q2 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{aval1?.nota_introducao !== null && aval1?.nota_introducao !== undefined ? formatarNota(aval1.nota_introducao) : '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{aval2?.nota_introducao !== null && aval2?.nota_introducao !== undefined ? formatarNota(aval2.nota_introducao) : '-'}</div>
                    </div>
                  </td>

                  {/* Q3 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{aval1?.nota_revisao !== null && aval1?.nota_revisao !== undefined ? formatarNota(aval1.nota_revisao) : '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{aval2?.nota_revisao !== null && aval2?.nota_revisao !== undefined ? formatarNota(aval2.nota_revisao) : '-'}</div>
                    </div>
                  </td>

                  {/* Q4 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{aval1?.nota_desenvolvimento !== null && aval1?.nota_desenvolvimento !== undefined ? formatarNota(aval1.nota_desenvolvimento) : '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{aval2?.nota_desenvolvimento !== null && aval2?.nota_desenvolvimento !== undefined ? formatarNota(aval2.nota_desenvolvimento) : '-'}</div>
                    </div>
                  </td>

                  {/* Q5 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{aval1?.nota_conclusoes !== null && aval1?.nota_conclusoes !== undefined ? formatarNota(aval1.nota_conclusoes) : '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{aval2?.nota_conclusoes !== null && aval2?.nota_conclusoes !== undefined ? formatarNota(aval2.nota_conclusoes) : '-'}</div>
                    </div>
                  </td>

                  {/* Nota Total (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{aval1?.nota_final !== null && aval1?.nota_final !== undefined ? formatarNota(aval1.nota_final) : '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{aval2?.nota_final !== null && aval2?.nota_final !== undefined ? formatarNota(aval2.nota_final) : '-'}</div>
                    </div>
                  </td>

                  {/* Nota proporcional */}
                  <td className="px-3 py-3 whitespace-nowrap text-center text-cor-texto bg-cor-fase1-linha font-semibold">
                    {f1np !== null ? formatarNota(f1np) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente: Tabela Bancas Fase II (Avaliações Fase II)
function BancasFase2Tabela({
  tccs,
  bancasMap,
  avaliacoesFase2Map
}: {
  tccs: TCC[]
  bancasMap: Map<number, BancaFase1>
  avaliacoesFase2Map: Map<number, AvaliacaoFase2[]>
}) {
  if (tccs.length === 0) {
    return (
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-12 text-center">
        <FileSpreadsheet className="w-12 h-12 text-cor-texto/20 mx-auto mb-3" />
        <p className="text-cor-texto/60">Nenhum TCC encontrado</p>
      </div>
    )
  }

  // Função helper para formatar nota com vírgula
  const formatarNota = (valor: number | string | null | undefined) => {
    if (valor === null || valor === undefined) return null
    const numero = typeof valor === 'number' ? valor : parseFloat(String(valor))
    if (Number.isNaN(numero)) return null
    return numero.toFixed(2).replace('.', ',')
  }

  return (
    <div className="bg-cor-superficie rounded-lg border border-cor-borda overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cor-fundo border-b border-cor-borda">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">ID</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Título</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Aluno</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Orientador</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Avaliadores</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Q1</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Q2</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Q3</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Q4</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Q5</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Nota total</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Nota proporcional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cor-borda">
            {tccs.map((tcc) => {
              // Obter banca e avaliacoes da Fase II
              const banca = bancasMap.get(tcc.id)
              const avaliacoes = avaliacoesFase2Map.get(tcc.id) || []

              // Montar lista de avaliadores esperados da Fase II:
              // 1. Orientador (ou coorientador se delegado)
              // 2. Avaliador #1 da Fase I
              // 3. Avaliador #2 da Fase I
              const avaliadoresFase1 = banca?.membros
                .filter(membro => membro.tipo === 'AVALIADOR')
                .sort((a, b) => a.ordem - b.ordem) || []

              // Para o primeiro avaliador (orientador/coorientador):
              // Tentar buscar primeiro com orientador, depois com coorientador (delegação)
              let aval1 = avaliacoes.find(av => av.avaliador === tcc.orientador)
              if (!aval1 && tcc.coorientador) {
                aval1 = avaliacoes.find(av => av.avaliador === tcc.coorientador)
              }

              // Buscar avaliações dos avaliadores da Fase I
              const aval2 = avaliacoes.find(av => av.avaliador === avaliadoresFase1[0]?.usuario)
              const aval3 = avaliacoes.find(av => av.avaliador === avaliadoresFase1[1]?.usuario)

              // Nomes esperados (fallback se não houver avaliação)
              const nomeOrientador = aval1?.avaliador_dados?.nome_completo ||
                                     tcc.orientador_dados?.nome_completo ||
                                     tcc.coorientador_dados?.nome_completo ||
                                     '(Aguardando formação de banca)'

              const nomesEsperados = [
                nomeOrientador,
                avaliadoresFase1[0]?.usuario_dados?.nome_completo || '(Aguardando formação de banca)',
                avaliadoresFase1[1]?.usuario_dados?.nome_completo || '(Aguardando formação de banca)'
              ]

              // Usar o nome real da avaliação se existir, senão usar o esperado
              const avaliadores = [
                aval1?.avaliador_dados?.nome_completo || nomesEsperados[0],
                aval2?.avaliador_dados?.nome_completo || nomesEsperados[1],
                aval3?.avaliador_dados?.nome_completo || nomesEsperados[2]
              ]

              // Calcular F2NP (média das notas totais)
              const notasTotais = [aval1?.nota_final, aval2?.nota_final, aval3?.nota_final].filter(n => n !== null && n !== undefined) as number[]
              const f2np = notasTotais.length > 0 ? notasTotais.reduce((a, b) => a + b, 0) / notasTotais.length : null

              return (
                <tr key={tcc.id} className="hover:bg-cor-fundo transition-colors">
                  {/* ID */}
                  <td className="px-3 py-3 text-cor-texto font-mono whitespace-nowrap align-top">
                    {tcc.id}
                  </td>

                  {/* Título */}
                  <td className="px-3 py-3 text-cor-texto max-w-xs align-top">
                    <p className="line-clamp-3" title={tcc.titulo}>{tcc.titulo}</p>
                  </td>

                  {/* Aluno */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.aluno_dados?.nome_completo || '-'}
                  </td>

                  {/* Orientador */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.orientador_dados?.nome_completo || '-'}
                  </td>

                  {/* Avaliadores (empilhados) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs">{avaliadores[0]}</div>
                      <div className="text-xs border-t border-cor-borda pt-1">{avaliadores[1]}</div>
                      <div className="text-xs border-t border-cor-borda pt-1">{avaliadores[2]}</div>
                    </div>
                  </td>

                  {/* Q1 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{formatarNota(aval1?.nota_coerencia_conteudo) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval2?.nota_coerencia_conteudo) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval3?.nota_coerencia_conteudo) || '-'}</div>
                    </div>
                  </td>

                  {/* Q2 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{formatarNota(aval1?.nota_qualidade_apresentacao) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval2?.nota_qualidade_apresentacao) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval3?.nota_qualidade_apresentacao) || '-'}</div>
                    </div>
                  </td>

                  {/* Q3 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{formatarNota(aval1?.nota_dominio_tema) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval2?.nota_dominio_tema) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval3?.nota_dominio_tema) || '-'}</div>
                    </div>
                  </td>

                  {/* Q4 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{formatarNota(aval1?.nota_clareza_fluencia) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval2?.nota_clareza_fluencia) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval3?.nota_clareza_fluencia) || '-'}</div>
                    </div>
                  </td>

                  {/* Q5 (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{formatarNota(aval1?.nota_observancia_tempo) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval2?.nota_observancia_tempo) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval3?.nota_observancia_tempo) || '-'}</div>
                    </div>
                  </td>

                  {/* Nota Total (empilhadas) */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase2-linha">
                    <div className="space-y-1">
                      <div className="text-xs text-center">{formatarNota(aval1?.nota_final) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval2?.nota_final) || '-'}</div>
                      <div className="text-xs text-center border-t border-cor-borda pt-1">{formatarNota(aval3?.nota_final) || '-'}</div>
                    </div>
                  </td>

                  {/* Nota proporcional (F2NP) */}
                  <td className="px-3 py-3 whitespace-nowrap text-center text-cor-texto bg-cor-fase2-linha font-semibold">
                    {f2np !== null ? formatarNota(f2np) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente: Tabela Apuração Final
function ApuracaoFinalTabela({
  tccs,
  avaliacoesFase1Map,
  avaliacoesFase2Map
}: {
  tccs: TCC[]
  avaliacoesFase1Map: Map<number, AvaliacaoFase1[]>
  avaliacoesFase2Map: Map<number, AvaliacaoFase2[]>
}) {
  // Função auxiliar para formatar notas (converte string para número)
  const formatarNota = (valor: number | string | null): string | null => {
    if (valor === null || valor === undefined) return null
    const numero = typeof valor === 'number' ? valor : parseFloat(String(valor))
    if (Number.isNaN(numero)) return null
    return numero.toFixed(2).replace('.', ',')
  }

  // TCCs já chegam filtrados (busca aplicada se houver)
  if (tccs.length === 0) {
    return (
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-12 text-center">
        <FileSpreadsheet className="w-12 h-12 text-cor-texto/20 mx-auto mb-3" />
        <p className="text-cor-texto/60">Nenhum TCC encontrado</p>
        <p className="text-xs text-cor-texto/40 mt-1">
          Os TCCs aprovados pelo coordenador aparecerão aqui para acompanhamento das avaliações
        </p>
      </div>
    )
  }

  return (
    <div className="bg-cor-superficie rounded-lg border border-cor-borda overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cor-fundo border-b border-cor-borda">
            {/* Linha de grupos de fases */}
            <tr>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">ID</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Título</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Aluno</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Orientador</th>
              <th colSpan={4} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho border-r border-cor-borda">Fase I</th>
              <th colSpan={5} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho border-r border-cor-borda">Fase II</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-[rgb(var(--cor-sucesso))]/5">Nota Final</th>
            </tr>
            {/* Linha de colunas individuais */}
            <tr>
              {/* Fase 1 */}
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho">Nota 1</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho">Nota 2</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho">Média</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase1-cabecalho border-r border-cor-borda">Nota com peso</th>
              {/* Fase 2 */}
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Nota 1</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Nota 2</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Nota 3</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho">Média</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase whitespace-nowrap bg-cor-fase2-cabecalho border-r border-cor-borda">Nota com peso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cor-borda">
            {tccs.map((tcc) => {
              // Obter avaliações Fase 1 (avaliadores 1 e 2)
              const avalsFase1 = avaliacoesFase1Map.get(tcc.id) || []
              const notaAvaliador1F1 = avalsFase1[0]?.nota_final || null
              const notaAvaliador2F1 = avalsFase1[1]?.nota_final || null

              // Calcular média Fase 1 (média de 2 avaliadores)
              let mediaFase1: number | null = null
              if (notaAvaliador1F1 !== null && notaAvaliador2F1 !== null) {
                const n1 = typeof notaAvaliador1F1 === 'number' ? notaAvaliador1F1 : parseFloat(String(notaAvaliador1F1))
                const n2 = typeof notaAvaliador2F1 === 'number' ? notaAvaliador2F1 : parseFloat(String(notaAvaliador2F1))
                if (!Number.isNaN(n1) && !Number.isNaN(n2)) {
                  mediaFase1 = (n1 + n2) / 2
                }
              }

              // Calcular nota com peso Fase 1 (60%)
              const notaComPesoF1 = mediaFase1 !== null ? mediaFase1 * 0.6 : null

              // Obter avaliações Fase 2 (orientador + 2 avaliadores da Fase 1)
              const avalsFase2 = avaliacoesFase2Map.get(tcc.id) || []
              // Identificar orientador comparando avaliador com orientador do TCC
              const notaOrientadorF2 = avalsFase2.find(a => a.avaliador === tcc.orientador)?.nota_final || null
              // Os outros dois são os avaliadores externos (ordem por ID)
              const avaliadoresFase2 = avalsFase2
                .filter(a => a.avaliador !== tcc.orientador)
                .sort((a, b) => a.id - b.id)
              const notaAvaliador1F2 = avaliadoresFase2[0]?.nota_final || null
              const notaAvaliador2F2 = avaliadoresFase2[1]?.nota_final || null

              // Calcular média Fase 2 (média de 3 avaliadores)
              let mediaFase2: number | null = null
              if (notaOrientadorF2 !== null && notaAvaliador1F2 !== null && notaAvaliador2F2 !== null) {
                const n1 = typeof notaOrientadorF2 === 'number' ? notaOrientadorF2 : parseFloat(String(notaOrientadorF2))
                const n2 = typeof notaAvaliador1F2 === 'number' ? notaAvaliador1F2 : parseFloat(String(notaAvaliador1F2))
                const n3 = typeof notaAvaliador2F2 === 'number' ? notaAvaliador2F2 : parseFloat(String(notaAvaliador2F2))
                if (!Number.isNaN(n1) && !Number.isNaN(n2) && !Number.isNaN(n3)) {
                  mediaFase2 = (n1 + n2 + n3) / 3
                }
              }

              // Calcular nota com peso Fase 2 (40%)
              const notaComPesoF2 = mediaFase2 !== null ? mediaFase2 * 0.4 : null

              // Calcular nota final (soma das notas com peso)
              let notaFinal: number | null = null
              if (notaComPesoF1 !== null && notaComPesoF2 !== null) {
                notaFinal = notaComPesoF1 + notaComPesoF2
              }

              return (
                <tr key={tcc.id} className="hover:bg-cor-fundo transition-colors">
                  {/* ID */}
                  <td className="px-3 py-3 text-cor-texto font-mono whitespace-nowrap align-top">
                    {tcc.id}
                  </td>

                  {/* Título */}
                  <td className="px-3 py-3 text-cor-texto min-w-[250px] align-top">
                    <p className="line-clamp-2" title={tcc.titulo}>{tcc.titulo}</p>
                  </td>

                  {/* Aluno */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.aluno_dados?.nome_completo || '-'}
                  </td>

                  {/* Orientador */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top">
                    {tcc.orientador_dados?.nome_completo || '-'}
                  </td>

                  {/* Fase 1 - Nota 1 */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase1-linha">
                    {formatarNota(notaAvaliador1F1) || <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Fase 1 - Nota 2 */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase1-linha">
                    {formatarNota(notaAvaliador2F1) || <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Fase 1 - Média */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase1-linha">
                    {mediaFase1 !== null ? (
                      <span className="text-cor-texto">{formatarNota(mediaFase1)}</span>
                    ) : (
                      <span className="text-cor-texto/40">-</span>
                    )}
                  </td>

                  {/* Fase 1 - Nota com peso (60%) */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase1-linha">
                    {notaComPesoF1 !== null ? (
                      <span className="font-semibold text-cor-texto">{formatarNota(notaComPesoF1)}</span>
                    ) : (
                      <span className="text-cor-texto/40">-</span>
                    )}
                  </td>

                  {/* Fase 2 - Nota 1 (Orientador) */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase2-linha">
                    {formatarNota(notaOrientadorF2) || <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Fase 2 - Nota 2 (Avaliador 1 da Fase 1) */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase2-linha">
                    {formatarNota(notaAvaliador1F2) || <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Fase 2 - Nota 3 (Avaliador 2 da Fase 1) */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase2-linha">
                    {formatarNota(notaAvaliador2F2) || <span className="text-cor-texto/40">-</span>}
                  </td>

                  {/* Fase 2 - Média */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase2-linha">
                    {mediaFase2 !== null ? (
                      <span className="text-cor-texto">{formatarNota(mediaFase2)}</span>
                    ) : (
                      <span className="text-cor-texto/40">-</span>
                    )}
                  </td>

                  {/* Fase 2 - Nota com peso (40%) */}
                  <td className="px-3 py-3 text-center align-top bg-cor-fase2-linha">
                    {notaComPesoF2 !== null ? (
                      <span className="font-semibold text-cor-texto">{formatarNota(notaComPesoF2)}</span>
                    ) : (
                      <span className="text-cor-texto/40">-</span>
                    )}
                  </td>

                  {/* Nota Final */}
                  <td className="px-3 py-3 text-center align-top bg-cor-sucesso/10">
                    {notaFinal !== null ? (
                      <span className={`font-bold text-base ${
                        notaFinal >= 7.0
                          ? 'text-cor-sucesso'
                          : notaFinal >= 5.0
                          ? 'text-cor-alerta'
                          : 'text-cor-erro'
                      }`}>
                        {formatarNota(notaFinal)}
                      </span>
                    ) : (
                      <span className="text-cor-texto/40">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}




// Componente: Tabela Relatório de Avaliação (Pareceres textuais)
function RelatorioAvaliacaoTabela({
  tccs,
  bancasMap,
  avaliacoesFase1Map,
  avaliacoesFase2Map
}: {
  tccs: TCC[]
  bancasMap: Map<number, BancaFase1>
  avaliacoesFase1Map: Map<number, AvaliacaoFase1[]>
  avaliacoesFase2Map: Map<number, AvaliacaoFase2[]>
}) {
  if (tccs.length === 0) {
    return (
      <div className="bg-cor-superficie rounded-lg border border-cor-borda p-12 text-center">
        <FileSpreadsheet className="w-12 h-12 text-cor-texto/20 mx-auto mb-3" />
        <p className="text-cor-texto/60">Nenhum TCC encontrado</p>
      </div>
    )
  }

  return (
    <div className="bg-cor-superficie rounded-lg border border-cor-borda overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cor-fundo border-b border-cor-borda">
            <tr>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">ID</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Título</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Aluno</th>
              <th rowSpan={2} className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda">Data defesa</th>
              <th colSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase border-r border-cor-borda bg-cor-fase1-cabecalho">Fase I</th>
              <th colSpan={2} className="px-3 py-3 text-center text-xs font-semibold text-cor-texto uppercase bg-cor-fase2-cabecalho">Fase II</th>
            </tr>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase1-cabecalho">Avaliadores</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase border-r border-cor-borda bg-cor-fase1-cabecalho">Pareceres</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase whitespace-nowrap border-r border-cor-borda bg-cor-fase2-cabecalho">Avaliadores</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-cor-texto uppercase bg-cor-fase2-cabecalho">Pareceres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cor-borda">
            {tccs.map((tcc) => {
              const banca = bancasMap.get(tcc.id)
              const avaliacoesFase1 = avaliacoesFase1Map.get(tcc.id) || []
              const avaliacoesFase2 = avaliacoesFase2Map.get(tcc.id) || []

              // Obter avaliadores esperados da banca Fase I (ordem correta)
              const avaliadoresFase1 = banca?.membros
                .filter(membro => membro.tipo === 'AVALIADOR')
                .sort((a, b) => a.ordem - b.ordem) || []

              // Verificar se há pelo menos 2 avaliadores na banca
              // IDs esperados para Fase I (2 avaliadores)
              const idsEsperadosF1 = [
                avaliadoresFase1[0]?.usuario,
                avaliadoresFase1[1]?.usuario
              ]

              // Nomes esperados para Fase I (fallback com indicação se falta)
              const nomesEsperadosF1 = [
                avaliadoresFase1[0]?.usuario_dados?.nome_completo || '(Aguardando formação de banca)',
                avaliadoresFase1[1]?.usuario_dados?.nome_completo || '(Aguardando formação de banca)'
              ]

              // Buscar avaliações Fase I correspondentes aos IDs esperados
              const aval1F1 = avaliacoesFase1.find(av => av.avaliador === idsEsperadosF1[0])
              const aval2F1 = avaliacoesFase1.find(av => av.avaliador === idsEsperadosF1[1])

              // Para Fase II: Orientador (ou coorientador se delegado) + 2 avaliadores
              // Tentar buscar primeiro com orientador, depois com coorientador (delegação)
              let aval1F2 = avaliacoesFase2.find(av => av.avaliador === tcc.orientador)
              if (!aval1F2 && tcc.coorientador) {
                aval1F2 = avaliacoesFase2.find(av => av.avaliador === tcc.coorientador)
              }

              const aval2F2 = avaliacoesFase2.find(av => av.avaliador === idsEsperadosF1[0])
              const aval3F2 = avaliacoesFase2.find(av => av.avaliador === idsEsperadosF1[1])

              // Nomes esperados para Fase II (fallback)
              const nomeOrientadorF2 = aval1F2?.avaliador_dados?.nome_completo ||
                                       tcc.orientador_dados?.nome_completo ||
                                       tcc.coorientador_dados?.nome_completo ||
                                       '(Aguardando formação de banca)'

              const nomesEsperadosF2 = [
                nomeOrientadorF2,
                avaliadoresFase1[0]?.usuario_dados?.nome_completo || '(Aguardando formação de banca)',
                avaliadoresFase1[1]?.usuario_dados?.nome_completo || '(Aguardando formação de banca)'
              ]

              // Nomes finais dos avaliadores (usar nome real da avaliação ou fallback)
              const avaliadoresF1 = [
                aval1F1?.avaliador_dados?.nome_completo || nomesEsperadosF1[0],
                aval2F1?.avaliador_dados?.nome_completo || nomesEsperadosF1[1]
              ]

              const avaliadoresF2 = [
                aval1F2?.avaliador_dados?.nome_completo || nomesEsperadosF2[0],
                aval2F2?.avaliador_dados?.nome_completo || nomesEsperadosF2[1],
                aval3F2?.avaliador_dados?.nome_completo || nomesEsperadosF2[2]
              ]

              return (
                <tr key={tcc.id} className="hover:bg-cor-fundo transition-colors">
                  <td className="px-3 py-3 text-cor-texto font-mono whitespace-nowrap align-top border-r border-cor-borda">{tcc.id}</td>
                  <td className="px-3 py-3 text-cor-texto min-w-[300px] align-top border-r border-cor-borda"><p className="line-clamp-3" title={tcc.titulo}>{tcc.titulo}</p></td>
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top border-r border-cor-borda">{tcc.aluno_dados?.nome_completo || '-'}</td>
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap align-top border-r border-cor-borda">{tcc.data_defesa ? new Date(tcc.data_defesa).toLocaleDateString('pt-BR') : '-'}</td>

                  {/* Avaliadores Fase I */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap border-r border-cor-borda bg-cor-fase1-linha align-top">
                    <div className="space-y-1">
                      <div className="text-xs">{avaliadoresF1[0]}</div>
                      <div className="text-xs border-t border-cor-borda pt-1">{avaliadoresF1[1]}</div>
                    </div>
                  </td>

                  {/* Pareceres Fase I */}
                  <td className="px-3 py-3 text-cor-texto border-r border-cor-borda bg-cor-fase1-linha align-top min-w-[400px]">
                    <div className="space-y-1">
                      <div className="text-xs whitespace-pre-wrap">{aval1F1?.parecer || '-'}</div>
                      <div className="text-xs whitespace-pre-wrap border-t border-cor-borda pt-1">{aval2F1?.parecer || '-'}</div>
                    </div>
                  </td>

                  {/* Avaliadores Fase II */}
                  <td className="px-3 py-3 text-cor-texto whitespace-nowrap border-r border-cor-borda bg-cor-fase2-linha align-top">
                    <div className="space-y-1">
                      <div className="text-xs">{avaliadoresF2[0]}</div>
                      <div className="text-xs border-t border-cor-borda pt-1">{avaliadoresF2[1]}</div>
                      <div className="text-xs border-t border-cor-borda pt-1">{avaliadoresF2[2]}</div>
                    </div>
                  </td>

                  {/* Pareceres Fase II */}
                  <td className="px-3 py-3 text-cor-texto bg-cor-fase2-linha align-top min-w-[400px]">
                    <div className="space-y-1">
                      <div className="text-xs whitespace-pre-wrap">{aval1F2?.parecer || '-'}</div>
                      <div className="text-xs whitespace-pre-wrap border-t border-cor-borda pt-1">{aval2F2?.parecer || '-'}</div>
                      <div className="text-xs whitespace-pre-wrap border-t border-cor-borda pt-1">{aval3F2?.parecer || '-'}</div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
