import { useState } from 'react';
import { GraduationCap, Search, Plus } from 'lucide-react';

export function AlunosPage() {
  const [busca, setBusca] = useState('');

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--cor-texto-primario))]">Alunos</h1>
        <p className="text-[rgb(var(--cor-texto-secundario))] mt-1">Visualize e gerencie alunos e seus trabalhos de conclusão de curso</p>
      </div>

      {/* Barra de ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--cor-icone))] w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar alunos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--cor-borda))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--cor-destaque))] focus:border-transparent bg-[rgb(var(--cor-superficie))] text-[rgb(var(--cor-texto-primario))]"
          />
        </div>

        <button className="ml-4 px-4 py-2 bg-[rgb(var(--cor-destaque))] text-white rounded-lg hover:bg-[rgb(var(--cor-destaque))]/90 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar aluno
        </button>
      </div>

      {/* Placeholder - implementar lista de alunos aqui */}
      <div className="bg-[rgb(var(--cor-superficie))] rounded-lg shadow overflow-hidden">
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-[rgb(var(--cor-icone))] mx-auto mb-3" />
          <p className="text-[rgb(var(--cor-texto-secundario))] font-medium mb-2">Página de Alunos</p>
          <p className="text-sm text-[rgb(var(--cor-texto-terciario))]">
            Estrutura pronta para implementação com dados reais da API
          </p>
        </div>
      </div>
    </div>
  );
}
