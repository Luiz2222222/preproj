import { Outlet } from 'react-router-dom'
import { HeaderProfessor } from './HeaderProfessor'
import { SidebarProfessor } from './SidebarProfessor'
import type { ReactNode } from 'react'

interface EstruturaProfessorProps {
  children?: ReactNode
}

export function EstruturaProfessor({ children }: EstruturaProfessorProps) {
  return (
    <div className="min-h-screen bg-cor-fundo text-cor-texto transition-colors">
      <HeaderProfessor />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <SidebarProfessor />

        <main className="flex-1 p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
