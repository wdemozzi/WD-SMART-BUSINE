import { NavLink } from 'react-router-dom'
import { navItems } from './nav-items'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { perfil, empresa } = useAuth()
  const role = perfil?.role ?? 'cliente_final'
  const itensVisiveis = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 font-display text-sm font-semibold text-white">
          W
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm font-semibold text-[var(--color-ink-900)]">
            WD Smart Business
          </span>
          {empresa && (
            <span className="text-xs text-[var(--color-ink-400)]">{empresa.nome}</span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {itensVisiveis.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'text-[var(--color-ink-600)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-900)]'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
