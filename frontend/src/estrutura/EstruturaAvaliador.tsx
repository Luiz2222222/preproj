import { Outlet } from 'react-router-dom'
import { HeaderAvaliador } from './HeaderAvaliador'
import { SidebarAvaliador } from './SidebarAvaliador'
import type { ReactNode } from 'react'

interface EstruturaAvaliadorProps {
  children?: ReactNode
}

export function EstruturaAvaliador({ children }: EstruturaAvaliadorProps) {
  return (
    <div className="min-h-screen bg-cor-fundo text-cor-texto transition-colors">
      <HeaderAvaliador />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <SidebarAvaliador />

        <main className="flex-1 p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
