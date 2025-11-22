import { Outlet } from 'react-router-dom'
import { HeaderCoord } from './HeaderCoord'
import { SidebarCoord } from './SidebarCoord'
import type { ReactNode } from 'react'

interface EstruturaCoordProps {
  children?: ReactNode
}

export function EstruturaCoord({ children }: EstruturaCoordProps) {
  return (
    <div className="min-h-screen bg-cor-fundo text-cor-texto transition-colors">
      <HeaderCoord />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <SidebarCoord />

        <main className="flex-1 p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
