import { useState } from 'react'
import { Search, Moon, Sun, LogOut } from 'lucide-react'
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
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5">
      <div className="flex w-full max-w-sm items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-ink-400)]">
        <Search className="h-4 w-4" />
        <span>Buscar clientes, agendamentos…</span>
        <kbd className="ml-auto rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificacoesDropdown />
        <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={alternarTema}>
          {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {perfil?.nome_completo?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm font-medium text-[var(--color-ink-900)]">
            {perfil?.nome_completo ?? 'Usuário'}
          </span>
        </div>
        <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
