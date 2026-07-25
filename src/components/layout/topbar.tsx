import { useState } from 'react'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { NotificacoesDropdown } from '@/components/layout/notificacoes-dropdown'

export function Topbar() {
  const { perfil, signOut } = useAuth()
  const [escuro, setEscuro] = useState(false)

  function alternarTema() {
    document.documentElement.classList.toggle('dark')
    setEscuro((v) => !v)
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:px-5">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 font-display text-sm font-semibold text-white">
          W
        </div>
        <span className="font-display text-sm font-semibold text-[var(--color-ink-900)] hidden sm:inline">
          WD Smart Business
        </span>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        <NotificacoesDropdown />
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Alternar tema" onClick={alternarTema}>
          {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />

        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
            {perfil?.nome_completo?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-[13px] font-medium text-[var(--color-ink-900)] hidden sm:inline max-w-[100px] truncate">
            {perfil?.nome_completo ?? 'Usuário'}
          </span>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sair" onClick={() => signOut()}>
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  )
}
