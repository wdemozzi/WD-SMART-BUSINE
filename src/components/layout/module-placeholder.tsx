import type { LucideIcon } from 'lucide-react'

export function ModulePlaceholder({
  icon: Icon,
  titulo,
  descricao,
}: {
  icon: LucideIcon
  titulo: string
  descricao: string
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">{titulo}</h1>
        <p className="text-sm text-[var(--color-ink-400)]">{descricao}</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-[var(--color-ink-900)]">Este módulo está em construção</p>
        <p className="max-w-xs text-xs text-[var(--color-ink-400)]">
          A estrutura de dados já existe no banco — a tela completa entra na próxima etapa de desenvolvimento.
        </p>
      </div>
    </div>
  )
}
