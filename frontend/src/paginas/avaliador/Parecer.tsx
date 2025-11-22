import React from 'react';
import { FileText, Upload, Save, Send, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export function FormularioParecer() {
  const [parecerSelecionado, setParecerSelecionado] = React.useState<number | null>(null);

  // Dados mockados (visual-only)
  const pareceresPendentes = [
    {
      id: 1,
      tipo: 'Fase I',
      aluno: 'Ricardo Alves',
      titulo: 'Inteligência Artificial Aplicada a Diagnósticos Médicos',
      orientador: 'Prof. Dr. Fernando Costa',
      dataDefesa: '12/05/2025',
      prazo: '15/05/2025',
      status: 'pendente',
      urgente: true,
    },
    {
      id: 2,
      tipo: 'Defesa Final',
      aluno: 'Beatriz Santos',
      titulo: 'Otimização Energética em Edifícios Inteligentes',
      orientador: 'Profa. Dra. Ana Maria Costa',
      dataDefesa: '18/05/2025',
      prazo: '20/05/2025',
      status: 'pendente',
      urgente: false,
    },
  ];

  const parecerAtual = pareceresPendentes.find((p) => p.id === parecerSelecionado);

  const criteriosAvaliacao = [
    { nome: 'Qualidade do Trabalho Escrito', peso: '30%' },
    { nome: 'Apresentação Oral', peso: '20%' },
    { nome: 'Domínio do Conteúdo', peso: '25%' },
    { nome: 'Metodologia Aplicada', peso: '15%' },
    { nome: 'Originalidade e Contribuição', peso: '10%' },
  ];

  const historicoParecer = [
    { data: '10/04/2025 14:30', acao: 'Parecer salvo como rascunho', usuario: 'Você' },
    { data: '10/04/2025 16:15', acao: 'Nota atualizada: 8.5', usuario: 'Você' },
  ];

  if (parecerSelecionado && parecerAtual) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setParecerSelecionado(null)}
            className="text-[rgb(var(--cor-sucesso))] hover:text-[rgb(var(--cor-sucesso))]/80 text-sm font-medium mb-4"
          >
            ← Voltar para lista de pareceres
          </button>
          <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Parecer de Avaliação</h1>
          <p className="text-[rgb(var(--cor-texto-secundario))]">{parecerAtual.tipo} - {parecerAtual.aluno}</p>
        </div>

        {/* Informações da Defesa */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Informações da Defesa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-[rgb(var(--cor-texto-primario))]">Aluno:</strong>
              <p className="text-[rgb(var(--cor-texto-primario))]">{parecerAtual.aluno}</p>
            </div>
            <div>
              <strong className="text-[rgb(var(--cor-texto-primario))]">Título:</strong>
              <p className="text-[rgb(var(--cor-texto-primario))]">{parecerAtual.titulo}</p>
            </div>
            <div>
              <strong className="text-[rgb(var(--cor-texto-primario))]">Orientador:</strong>
              <p className="text-[rgb(var(--cor-texto-primario))]">{parecerAtual.orientador}</p>
            </div>
            <div>
              <strong className="text-[rgb(var(--cor-texto-primario))]">Data da Defesa:</strong>
              <p className="text-[rgb(var(--cor-texto-primario))]">{parecerAtual.dataDefesa}</p>
            </div>
            <div>
              <strong className="text-[rgb(var(--cor-texto-primario))]">Prazo para Parecer:</strong>
              <p className={parecerAtual.urgente ? 'text-[rgb(var(--cor-erro))] font-medium' : 'text-[rgb(var(--cor-texto-primario))]'}>
                {parecerAtual.prazo}
                {parecerAtual.urgente && ' (Urgente)'}
              </p>
            </div>
          </div>
        </div>

        {/* Critérios de Avaliação */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Critérios de Avaliação</h2>
          <div className="space-y-3">
            {criteriosAvaliacao.map((criterio, index) => (
              <div key={index} className="border border-[rgb(var(--cor-borda))] rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">{criterio.nome}</p>
                  <span className="text-xs text-[rgb(var(--cor-texto-secundario))]">Peso: {criterio.peso}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    disabled
                    defaultValue="7"
                    className="flex-1 cursor-not-allowed"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    disabled
                    defaultValue="7.0"
                    className="w-20 px-2 py-1 border border-[rgb(var(--cor-borda))] rounded bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nota Final */}
        <div className="bg-[rgb(var(--cor-destaque))]/5 rounded-xl shadow-sm border border-[rgb(var(--cor-destaque))]/20 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Nota Final</h2>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[rgb(var(--cor-texto-primario))]">Nota (0 a 10):</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              disabled
              defaultValue="8.5"
              className="w-32 px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed font-bold text-lg"
            />
            <select
              disabled
              className="px-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
            >
              <option>Aprovado</option>
              <option>Aprovado com Ressalvas</option>
              <option>Reprovado</option>
            </select>
          </div>
        </div>

        {/* Parecer Descritivo */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4">Parecer Descritivo</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                Pontos Fortes
              </label>
              <textarea
                disabled
                rows={4}
                placeholder="Descreva os pontos fortes do trabalho..."
                className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
                defaultValue="Excelente fundamentação teórica e metodologia bem estruturada. A aplicação prática demonstra domínio do tema."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                Pontos a Melhorar
              </label>
              <textarea
                disabled
                rows={4}
                placeholder="Descreva os pontos que podem ser melhorados..."
                className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
                defaultValue="Sugere-se expandir a análise de resultados e incluir mais comparações com trabalhos similares."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--cor-texto-primario))] mb-2">
                Comentários Gerais
              </label>
              <textarea
                disabled
                rows={4}
                placeholder="Comentários adicionais sobre o trabalho..."
                className="w-full px-3 py-2 border border-[rgb(var(--cor-borda))] rounded-lg bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] cursor-not-allowed"
                defaultValue="Trabalho de alta qualidade que contribui significativamente para a área. O aluno demonstrou maturidade acadêmica."
              />
            </div>
          </div>
        </div>

        {/* Upload de Documentos */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
            Documentos Anexos
          </h2>
          <div className="border-2 border-dashed border-[rgb(var(--cor-borda))] rounded-lg p-8 text-center bg-[rgb(var(--cor-fundo))]/50">
            <Upload className="h-8 w-8 text-[rgb(var(--cor-icone))]/50 mx-auto mb-2" />
            <p className="text-sm text-[rgb(var(--cor-texto-secundario))] mb-2">
              Arraste arquivos ou clique para fazer upload
            </p>
            <button
              disabled
              className="px-4 py-2 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed text-sm"
            >
              Selecionar Arquivo
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-3 bg-[rgb(var(--cor-fundo))]/50 rounded border border-[rgb(var(--cor-borda))]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[rgb(var(--cor-icone))]" />
                <span className="text-sm text-[rgb(var(--cor-texto-primario))]">parecer_completo.pdf</span>
              </div>
              <button
                disabled
                className="text-[rgb(var(--cor-erro))] hover:text-[rgb(var(--cor-erro))]/80 text-sm cursor-not-allowed opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        </div>

        {/* Histórico de Alterações */}
        <div className="bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border border-[rgb(var(--cor-borda))] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))] mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[rgb(var(--cor-icone))]" />
            Histórico de Alterações
          </h2>
          <div className="space-y-2">
            {historicoParecer.map((item, index) => (
              <div key={index} className="border-l-4 border-[rgb(var(--cor-destaque))] pl-4 py-2">
                <p className="text-xs text-[rgb(var(--cor-texto-secundario))]">{item.data}</p>
                <p className="text-sm text-[rgb(var(--cor-texto-primario))]">{item.acao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            disabled
            className="flex items-center gap-2 px-6 py-3 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-6 py-3 bg-[rgb(var(--cor-fundo))] text-[rgb(var(--cor-texto-secundario))] rounded-lg cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            Enviar Parecer
          </button>
        </div>
      </div>
    );
  }

  // Lista de pareceres pendentes
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))] flex items-center gap-2">
          <FileText className="h-7 w-7 text-[rgb(var(--cor-sucesso))]" />
          Formulário de Parecer
        </h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Selecione um parecer pendente para preencher</p>
      </div>

      {pareceresPendentes.length === 0 ? (
        <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow-sm border border-[rgb(var(--cor-borda))] p-12 text-center">
          <CheckCircle className="h-12 w-12 text-[rgb(var(--cor-icone))]/50 mx-auto mb-4" />
          <p className="text-[rgb(var(--cor-texto-secundario))]">Nenhum parecer pendente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pareceresPendentes.map((parecer) => (
            <div
              key={parecer.id}
              className={`bg-[rgb(var(--cor-superficie))] rounded-xl shadow-sm border p-6 ${
                parecer.urgente ? 'border-[rgb(var(--cor-erro))]/30 bg-[rgb(var(--cor-erro))]/5' : 'border-[rgb(var(--cor-borda))]'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        parecer.tipo === 'Fase I'
                          ? 'bg-[rgb(var(--cor-info))]/10 text-[rgb(var(--cor-info))]'
                          : 'bg-[rgb(var(--cor-destaque))]/10 text-[rgb(var(--cor-destaque))]'
                      }`}
                    >
                      {parecer.tipo}
                    </span>
                    {parecer.urgente && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-[rgb(var(--cor-erro))]/10 text-[rgb(var(--cor-erro))] rounded text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Urgente
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[rgb(var(--cor-texto-primario))]">{parecer.aluno}</h3>
                  <p className="text-sm text-[rgb(var(--cor-texto-secundario))]">{parecer.titulo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <strong className="text-[rgb(var(--cor-texto-primario))]">Orientador:</strong>
                  <p className="text-[rgb(var(--cor-texto-primario))]">{parecer.orientador}</p>
                </div>
                <div>
                  <strong className="text-[rgb(var(--cor-texto-primario))]">Data da Defesa:</strong>
                  <p className="text-[rgb(var(--cor-texto-primario))]">{parecer.dataDefesa}</p>
                </div>
                <div>
                  <strong className="text-[rgb(var(--cor-texto-primario))]">Prazo:</strong>
                  <p className={parecer.urgente ? 'text-[rgb(var(--cor-erro))] font-medium' : 'text-[rgb(var(--cor-texto-primario))]'}>
                    {parecer.prazo}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setParecerSelecionado(parecer.id)}
                className="w-full px-4 py-2 bg-[rgb(var(--cor-sucesso))] text-white rounded-lg hover:bg-[rgb(var(--cor-sucesso))]/90 transition"
              >
                Preencher Parecer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
