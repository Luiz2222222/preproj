import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone,
  Plus,
  Pin,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { avisosService } from '../../servicos/avisos'
import { useToast } from '../../contextos/ToastProvider'
import type { Aviso } from '../../types/avisos'

interface Props {
  podeGerenciar: boolean
}

const PERFIS = [
  { value: 'ALUNO', label: 'Alunos' },
  { value: 'PROFESSOR', label: 'Professores' },
  { value: 'AVALIADOR', label: 'Externos' },
  { value: 'COORDENADOR', label: 'Coordenadores' },
]

const TODOS_PERFIS = PERFIS.map((p) => p.value)

function formatarData(iso: string) {
  const d = new Date(iso)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  const hora = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${ano} ${hora}:${min}`
}

export default function MuralAvisos({ podeGerenciar }: Props) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [avisoEditando, setAvisoEditando] = useState<Aviso | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)
  const { sucesso, erro } = useToast()

  // Form state
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [destinatarios, setDestinatarios] = useState<string[]>([])
  const [fixado, setFixado] = useState(false)

  const carregarAvisos = useCallback(async () => {
    try {
      setCarregando(true)
      const data = await avisosService.listar()
      setAvisos(data)
    } catch {
      erro('Erro ao carregar avisos.')
    } finally {
      setCarregando(false)
    }
  }, [erro])

  useEffect(() => {
    carregarAvisos()
  }, [carregarAvisos])

  const abrirModalNovo = () => {
    setAvisoEditando(null)
    setTitulo('')
    setMensagem('')
    setDestinatarios([...TODOS_PERFIS])
    setFixado(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (aviso: Aviso) => {
    setAvisoEditando(aviso)
    setTitulo(aviso.titulo)
    setMensagem(aviso.mensagem)
    setDestinatarios(aviso.destinatarios)
    setFixado(aviso.fixado)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setAvisoEditando(null)
  }

  const toggleDestinatario = (value: string) => {
    setDestinatarios((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    )
  }

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      erro('Informe o título do aviso.')
      return
    }
    if (!mensagem.trim()) {
      erro('Informe a mensagem do aviso.')
      return
    }
    if (destinatarios.length === 0) {
      erro('Selecione pelo menos um perfil destinatário.')
      return
    }

    try {
      setSalvando(true)
      const payload = { titulo: titulo.trim(), mensagem: mensagem.trim(), destinatarios, fixado }
      if (avisoEditando) {
        await avisosService.editar(avisoEditando.id, payload)
        sucesso('Aviso atualizado com sucesso!')
      } else {
        await avisosService.criar(payload)
        sucesso('Aviso criado com sucesso!')
      }
      fecharModal()
      carregarAvisos()
    } catch {
      erro('Erro ao salvar aviso.')
    } finally {
      setSalvando(false)
    }
  }

  const handleApagar = async (id: number) => {
    try {
      await avisosService.apagar(id)
      sucesso('Aviso removido com sucesso!')
      setConfirmandoExclusao(null)
      carregarAvisos()
    } catch {
      erro('Erro ao remover aviso.')
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cor-destaque" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cor-destaque/10">
            <Megaphone className="h-6 w-6 text-cor-destaque" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cor-texto">Mural de avisos</h1>
            <p className="text-sm text-cor-texto opacity-60">
              {podeGerenciar
                ? 'Gerencie e publique avisos para os usuários do sistema'
                : 'Avisos e comunicados da coordenação'}
            </p>
          </div>
        </div>
        {podeGerenciar && (
          <button
            onClick={abrirModalNovo}
            className="flex items-center gap-2 px-4 py-2 bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Aviso
          </button>
        )}
      </div>

      {/* Lista de avisos */}
      {avisos.length === 0 ? (
        <div className="bg-cor-superficie rounded-xl border border-cor-borda p-12 text-center">
          <Megaphone className="h-12 w-12 text-cor-texto opacity-20 mx-auto mb-4" />
          <p className="text-cor-texto opacity-60 text-lg">Nenhum aviso no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map((aviso) => (
            <div
              key={aviso.id}
              className={`bg-cor-superficie rounded-xl border p-5 transition-shadow hover:shadow-md ${
                aviso.fixado
                  ? 'border-cor-destaque/40 shadow-sm'
                  : 'border-cor-borda'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {aviso.fixado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cor-destaque/10 text-cor-destaque rounded-full text-xs font-medium">
                        <Pin className="h-3 w-3" />
                        Fixado
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-cor-texto">{aviso.titulo}</h3>
                  </div>
                  <p className="text-cor-texto opacity-80 whitespace-pre-wrap mb-3">
                    {aviso.mensagem}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-cor-texto opacity-50 flex-wrap">
                    <span>{formatarData(aviso.criado_em)}</span>
                    {podeGerenciar && (
                      <div className="flex items-center gap-1">
                        {aviso.destinatarios.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 bg-cor-fundo rounded text-[10px] font-medium uppercase"
                          >
                            {d === 'ALUNO'
                              ? 'Alunos'
                              : d === 'PROFESSOR'
                              ? 'Professores'
                              : d === 'AVALIADOR'
                              ? 'Externos'
                              : 'Coordenadores'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {podeGerenciar && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirModalEditar(aviso)}
                      className="p-2 rounded-lg hover:bg-cor-fundo transition-colors text-cor-texto opacity-60 hover:opacity-100"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {confirmandoExclusao === aviso.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApagar(aviso.id)}
                          className="px-2 py-1 text-xs bg-[rgb(var(--cor-erro))] text-white rounded hover:opacity-90"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmandoExclusao(null)}
                          className="px-2 py-1 text-xs bg-cor-fundo text-cor-texto rounded hover:opacity-90"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmandoExclusao(aviso.id)}
                        className="p-2 rounded-lg hover:bg-[rgb(var(--cor-erro))]/10 transition-colors text-[rgb(var(--cor-erro))] opacity-60 hover:opacity-100"
                        title="Apagar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-cor-superficie rounded-xl border border-cor-borda shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-cor-borda">
              <h2 className="text-lg font-bold text-cor-texto">
                {avisoEditando ? 'Editar Aviso' : 'Novo Aviso'}
              </h2>
              <button
                onClick={fecharModal}
                className="p-1 rounded-lg hover:bg-cor-fundo transition-colors"
              >
                <X className="h-5 w-5 text-cor-texto opacity-60" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-cor-texto mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título do aviso"
                  className="w-full px-3 py-2 rounded-lg border border-cor-borda bg-cor-fundo text-cor-texto text-sm focus:outline-none focus:ring-2 focus:ring-cor-destaque/50"
                />
              </div>

              {/* Mensagem */}
              <div>
                <label className="block text-sm font-medium text-cor-texto mb-1">
                  Mensagem
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Escreva a mensagem do aviso..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-cor-borda bg-cor-fundo text-cor-texto text-sm focus:outline-none focus:ring-2 focus:ring-cor-destaque/50 resize-none"
                />
              </div>

              {/* Destinatários */}
              <div>
                <label className="block text-sm font-medium text-cor-texto mb-2">
                  Destinatários
                </label>
                <div className="flex flex-col gap-2">
                  {PERFIS.map((perfil) => (
                    <label key={perfil.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={destinatarios.includes(perfil.value)}
                        onChange={() => toggleDestinatario(perfil.value)}
                        className="rounded border-cor-borda text-cor-destaque focus:ring-cor-destaque/50"
                      />
                      <span className="text-sm text-cor-texto">{perfil.label}</span>
                    </label>
                  ))}
                </div>
                {destinatarios.length === 0 && (
                  <p className="text-xs text-[rgb(var(--cor-erro))] mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Selecione pelo menos um perfil
                  </p>
                )}
              </div>

              {/* Fixar no topo */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixado}
                  onChange={(e) => setFixado(e.target.checked)}
                  className="rounded border-cor-borda text-cor-destaque focus:ring-cor-destaque/50"
                />
                <Pin className="h-4 w-4 text-cor-texto opacity-60" />
                <span className="text-sm text-cor-texto">Fixar no topo do mural</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-cor-borda">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-sm font-medium text-cor-texto bg-cor-fundo rounded-lg hover:opacity-80 transition-opacity border border-cor-borda"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cor-destaque text-[rgb(var(--cor-texto-sobre-destaque))] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
                {avisoEditando ? 'Salvar alterações' : 'Publicar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
