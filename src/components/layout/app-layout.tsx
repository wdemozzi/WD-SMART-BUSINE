import { Outlet, Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Topbar } from './topbar'
import { BottomNav } from './bottom-nav'
import { useAuth } from '@/context/AuthContext'

export function AppLayout() {
  const { empresa, perfil } = useAuth()
  const mostrarAvisoInadimplencia = perfil?.role !== 'super_admin' && empresa?.status === 'inadimplente'

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[var(--color-canvas)]">
      {/* Topbar compacta — só perfil, notificações, ações rápidas */}
      <Topbar />

      {/* Aviso de inadimplência */}
      {mostrarAvisoInadimplencia && (
        <div className="flex shrink-0 items-center justify-center gap-2 bg-warning-500 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Identificamos uma pendência no pagamento da sua assinatura.{' '}
          <Link to="/planos" className="underline">
            Resolver agora
          </Link>
        </div>
      )}

      {/* Conteúdo principal — cresce e dá scroll */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 sm:px-6 sm:pb-20">
        <Outlet />
      </main>

      {/* Barra de navegação inferior */}
      <BottomNav />
    </div>
  )
}
