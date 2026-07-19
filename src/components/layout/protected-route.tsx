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

  // Usuário autenticado mas ainda sem empresa vinculada (confirmou e-mail
  // após o cadastro, mas a empresa ainda não foi criada)
  if (!perfil) return <Navigate to="/completar-cadastro" replace />

  // Bloqueia acesso se o trial expirou ou a assinatura não está em dia
  // (super_admin nunca tem empresa, então não é afetado por esta checagem)
  if (perfil.role !== 'super_admin' && empresa) {
    if (empresa.status === 'trial' && empresa.trial_expira_em && new Date(empresa.trial_expira_em) < new Date()) {
      return <AcessoBloqueadoPage motivo="trial_expirado" />
    }
    if (empresa.status === 'suspensa') return <AcessoBloqueadoPage motivo="suspensa" />
    if (empresa.status === 'cancelada') return <AcessoBloqueadoPage motivo="cancelada" />
    if (empresa.status === 'inadimplente') return <AcessoBloqueadoPage motivo="inadimplente" />
  }

  if (papeisPermitidos && perfil && !papeisPermitidos.includes(perfil.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
