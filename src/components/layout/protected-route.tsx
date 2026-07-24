import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AcessoBloqueadoPage } from '@/pages/publico/acesso-bloqueado'
import type { UserRole } from '@/types/database'

export function ProtectedRoute({
  children,
  papeisPermitidos,
}: {
  children: React.ReactNode
  papeisPermitidos?: UserRole[]
}) {
  const { session, perfil, empresa, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-[var(--color-ink-400)]">
        Carregando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // Usuário autenticado mas o perfil ainda está carregando.
  // Só redireciona se o carregamento do perfil terminou E não encontrou perfil.
  if (!perfil && !carregando) return <Navigate to="/completar-cadastro" replace />

  // Bloqueia acesso apenas em casos definitivos (trial expirado, suspensa,
  // cancelada). "Inadimplente" NÃO bloqueia — vira um aviso persistente na
  // tela (ver AppLayout), para a pessoa conseguir chegar até o menu Planos
  // e resolver a pendência sem ficar trancada para fora do próprio sistema.
  if (perfil.role !== 'super_admin' && empresa) {
    if (empresa.status === 'trial' && empresa.trial_expira_em && new Date(empresa.trial_expira_em) < new Date()) {
      return <AcessoBloqueadoPage motivo="trial_expirado" />
    }
    if (empresa.status === 'suspensa') return <AcessoBloqueadoPage motivo="suspensa" />
    if (empresa.status === 'cancelada') return <AcessoBloqueadoPage motivo="cancelada" />
  }

  if (papeisPermitidos && perfil && !papeisPermitidos.includes(perfil.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
