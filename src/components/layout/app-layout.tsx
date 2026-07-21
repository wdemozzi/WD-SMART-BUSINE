import { Outlet, Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useAuth } from '@/context/AuthContext'

export function AppLayout() {
  const { empresa, perfil } = useAuth()
  const mostrarAvisoInadimplencia = perfil?.role !== 'super_admin' && empresa?.status === 'inadimplente'

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-canvas)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        {mostrarAvisoInadimplencia && (
          <div className="flex items-center justify-center gap-2 bg-warning-500 px-4 py-2 text-center text-sm font-medium text-white">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Identificamos uma pendência no pagamento da sua assinatura.{' '}
            <Link to="/planos" className="underline">
              Resolver agora
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
