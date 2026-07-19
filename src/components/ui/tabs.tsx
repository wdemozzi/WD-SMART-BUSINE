import { cn } from '@/lib/utils'

export function Tabs<T extends string>({
  abas,
  ativa,
  onChange,
}: {
  abas: { valor: T; rotulo: string }[]
  ativa: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 border-b border-[var(--color-border)]">
      {abas.map((aba) => (
        <button
          key={aba.valor}
          onClick={() => onChange(aba.valor)}
          className={cn(
            'relative px-3 py-2 text-sm font-medium transition-colors',
            ativa === aba.valor
              ? 'text-brand-600'
              : 'text-[var(--color-ink-400)] hover:text-[var(--color-ink-900)]'
          )}
        >
          {aba.rotulo}
          {ativa === aba.valor && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />
          )}
        </button>
      ))}
    </div>
  )
}
