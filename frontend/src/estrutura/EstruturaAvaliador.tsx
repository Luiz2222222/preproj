import React from 'react';
import { HeaderAvaliador } from './HeaderAvaliador';
import { SidebarAvaliador } from './SidebarAvaliador';

interface EstruturaAvaliadorProps {
  children: React.ReactNode;
}

export function EstruturaAvaliador({ children }: EstruturaAvaliadorProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-cor-fundo text-cor-texto transition-colors">
      <HeaderAvaliador onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <SidebarAvaliador isOpen={sidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
