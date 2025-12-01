/**
 * Modal compartilhado para envio de documentos
 */

import { useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { TipoDocumento, TipoDocumentoLabels } from '../types'

interface ModalEnviarDocumentoProps {
  show: boolean
  onClose: () => void
  onEnviar: (tipo: TipoDocumento, arquivo: File) => Promise<void>
  enviando: boolean
  tipoFixo?: TipoDocumento // Se definido, força um tipo específico e oculta o select
  tituloModal?: string
}

export function ModalEnviarDocumento({
  show,
  onClose,
  onEnviar,
  enviando,
  tipoFixo,
  tituloModal = 'Enviar Documento'
}: ModalEnviarDocumentoProps) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento | ''>(tipoFixo || '')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validarArquivo(file)
    }
  }

  const validarArquivo = (file: File) => {
    setErroUpload(null)

    const tipoFinal = tipoFixo || tipoDocumento

    // Para Monografia: apenas Word (.doc, .docx)
    if (tipoFinal === TipoDocumento.MONOGRAFIA) {
      const extensao = file.name.split('.').pop()?.toLowerCase()
      const tiposMimeWord = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
      ]

      if (!tiposMimeWord.includes(file.type) && !['doc', 'docx'].includes(extensao || '')) {
        setErroUpload('Apenas arquivos Word (.doc ou .docx) são permitidos para monografia')
        return
      }
    } else {
      // Para outros tipos: apenas PDF
      if (file.type !== 'application/pdf') {
        setErroUpload('Apenas arquivos PDF são permitidos')
        return
      }
    }

    // Verificar tamanho (máximo 30MB)
    const tamanhoMaximo = 30 * 1024 * 1024 // 30MB em bytes
    if (file.size > tamanhoMaximo) {
      setErroUpload('O arquivo deve ter no máximo 30MB')
      return
    }

    setArquivo(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setArrastandoArquivo(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      validarArquivo(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setArrastandoArquivo(true)
  }

  const handleDragLeave = () => {
    setArrastandoArquivo(false)
  }

  const handleEnviar = async () => {
    const tipoFinal = tipoFixo || tipoDocumento

    if (!arquivo || !tipoFinal) {
      setErroUpload('Selecione o tipo de documento e o arquivo')
      return
    }

    try {
      setErroUpload(null)
      await onEnviar(tipoFinal as TipoDocumento, arquivo)
      // Resetar estado
      setTipoDocumento(tipoFixo || '')
      setArquivo(null)
    } catch (err) {
      // Erro será tratado pelo componente pai
    }
  }

  const handleClose = () => {
    if (!enviando) {
      setTipoDocumento(tipoFixo || '')
      setArquivo(null)
      setErroUpload(null)
      onClose()
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">{tituloModal}</h3>
          <button
            onClick={handleClose}
            disabled={enviando}
            className="text-[rgb(var(--cor-texto-secundario))] hover:text-[rgb(var(--cor-texto-primario))] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipo de Documento (apenas se não for fixo) */}
          {!tipoFixo && (
            <div>
              <label className="block text-pequeno font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                Tipo de Documento *
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                disabled={enviando}
                className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:outline-none focus:ring-2 focus:ring-cor-destaque disabled:opacity-50"
              >
                <option value="">Selecione o tipo</option>
                {Object.entries(TipoDocumentoLabels).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload de Arquivo */}
          <div>
            <label className="block text-pequeno font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
              {tipoFixo === TipoDocumento.MONOGRAFIA ? 'Arquivo Word (.doc ou .docx) *' : 'Arquivo PDF *'}
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                arrastandoArquivo
                  ? 'border-cor-destaque bg-[rgb(var(--cor-destaque))]/10'
                  : 'border-[rgb(var(--cor-borda))] hover:border-[rgb(var(--cor-borda-forte))]'
              }`}
            >
              {arquivo ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-[rgb(var(--cor-destaque))]" />
                  <div className="text-left">
                    <p className="font-medium text-[rgb(var(--cor-texto-primario))]">{arquivo.name}</p>
                    <p className="text-pequeno text-[rgb(var(--cor-texto-secundario))]">
                      {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setArquivo(null)}
                    disabled={enviando}
                    className="ml-auto p-1 hover:bg-[rgb(var(--cor-superficie-hover))] rounded disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-[rgb(var(--cor-texto-terciario))] mx-auto mb-3" />
                  <p className="text-medio text-[rgb(var(--cor-texto-primario))] mb-1">
                    {tipoFixo === TipoDocumento.MONOGRAFIA
                      ? 'Arraste um arquivo Word aqui ou clique para selecionar'
                      : 'Arraste um arquivo PDF aqui ou clique para selecionar'}
                  </p>
                  <p className="text-pequeno text-[rgb(var(--cor-texto-terciario))]">Tamanho máximo: 30MB</p>
                  <input
                    type="file"
                    accept={tipoFixo === TipoDocumento.MONOGRAFIA ? '.doc,.docx' : '.pdf'}
                    onChange={handleFileChange}
                    disabled={enviando}
                    className="hidden"
                    id="input-arquivo-modal"
                  />
                  <label
                    htmlFor="input-arquivo-modal"
                    className="mt-3 inline-block px-4 py-2 bg-[rgb(var(--cor-superficie-hover))] text-[rgb(var(--cor-texto-primario))] rounded-lg hover:bg-[rgb(var(--cor-borda))]/20 transition-colors cursor-pointer"
                  >
                    Selecionar Arquivo
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Erro */}
          {erroUpload && (
            <div className="bg-[rgb(var(--cor-erro))]/10 border border-[rgb(var(--cor-erro))]/30 rounded p-3">
              <p className="text-[rgb(var(--cor-erro))] text-pequeno">{erroUpload}</p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={enviando}
            className="px-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg hover:bg-[rgb(var(--cor-superficie-hover))] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !arquivo || (!tipoFixo && !tipoDocumento)}
            className="px-4 py-2 bg-cor-destaque text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-semibold"
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
