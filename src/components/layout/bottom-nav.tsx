import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { navItems } from './nav-items'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

// Itens que ficam sempre visíveis na barra
const principais = ['Visão geral', 'Agenda', 'PDV', 'Clientes']

export function BottomNav() {
  const { perfil } = useAuth()
  const role = perfil?.role ?? 'cliente_final'
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const itensVisiveis = navItems.filter((item) => item.roles.includes(role))
  const itensPrincipais = itensVisiveis.filter((i) => principais.includes(i.label))
  const itensSecundarios = itensVisiveis.filter((i) => !principais.includes(i.label))

  // Fecha o menu ao navegar
  useEffect(() => {
    setMenuAberto(false)
  }, [location.pathname])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!menuAberto) return
    function handleClickFora(e: globalThis.MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [menuAberto])

  // Trava scroll do body quando menu aberto
  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuAberto])

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <>
      {/* ─── Overlay ─── */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ─── Drawer do menu ─── */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed inset-x-0 bottom-16 z-50 mx-auto w-full max-w-[420px] rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-300 ease-out',
          menuAberto ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
      >
        {/* Puxador visual */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 pb-4">
          {itensSecundarios.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive: active }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-[var(--color-ink-600)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink-900)]'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ─── Barra inferior fixa ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom,0px)]">
        {itensPrincipais.map((item) => {
          const active = isActive(item.href)
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors',
                active
                  ? 'text-brand-600'
                  : 'text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">
                {item.label === 'Visão geral' ? 'Início' : item.label}
              </span>
            </NavLink>
          )
        })}

        {/* Botão hambúrguer */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors',
            menuAberto
              ? 'text-brand-600'
              : 'text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]'
          )}
        >
          {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </nav>
    </>
  )
}
