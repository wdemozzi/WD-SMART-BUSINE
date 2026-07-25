import { useEffect, useRef, useState } from 'react'
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
  const { session, perfil, empresa, carregando, recarregarPerfil } = useAuth()
  const [tentandoPerfil, setTentandoPerfil] = useState(false)
  const tentativas = useRef(0)
  const maxTentativas = 3

  // Quando há sessão mas o perfil veio null, tenta recarregar algumas vezes.
  // Isso resolve race conditions em que o onAuthStateChange dispara antes do
  // trigger do banco criar o perfil (em fluxos como signInWithPassword).
  useEffect(() => {
    if (carregando) return
    if (!session) return
    if (perfil) return
    if (tentandoPerfil) return
    if (tentativas.current >= maxTentativas) return

    setTentandoPerfil(true)
    tentativas.current += 1

    // Delay curto pra dar tempo do trigger do banco finalizar
    const timer = setTimeout(async () => {
      try {
        await recarregarPerfil(session.user.id)
      } catch {
        // ignora — se falhar todas as tentativas, redireciona
      } finally {
        setTentandoPerfil(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [session, perfil, carregando, tentandoPerfil, recarregarPerfil])

  if (carregando || tentandoPerfil || (session && !perfil && tentativas.current < maxTentativas)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-[var(--color-ink-400)]">
        Carregando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // Só redireciona se o perfil REALMENTE não existe (esgotou as tentativas)
  if (!perfil) return <Navigate to="/completar-cadastro" replace />

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
