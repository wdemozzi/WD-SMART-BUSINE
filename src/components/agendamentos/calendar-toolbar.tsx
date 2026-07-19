import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tituloIntervalo, type VisaoCalendario } from '@/lib/date-helpers'

export function CalendarToolbar({
  data,
  visao,
  onVisaoChange,
  onNavegar,
  onHoje,
  onNovoAgendamento,
}: {
  data: Date
  visao: VisaoCalendario
  onVisaoChange: (v: VisaoCalendario) => void
  onNavegar: (direcao: 1 | -1) => void
  onHoje: () => void
  onNovoAgendamento: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onHoje}>
          Hoje
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => onNavegar(-1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onNavegar(1)} aria-label="Próximo">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="font-display text-lg font-semibold capitalize text-[var(--color-ink-900)]">
          {tituloIntervalo(data, visao)}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-[var(--color-border)] p-0.5">
          {(['dia', 'semana', 'mes'] as VisaoCalendario[]).map((v) => (
            <button
              key={v}
              onClick={() => onVisaoChange(v)}
              className={cn(
                'rounded px-3 py-1 text-sm font-medium capitalize transition-colors',
                visao === v
                  ? 'bg-brand-500 text-white'
                  : 'text-[var(--color-ink-600)] hover:bg-[var(--color-canvas)]'
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={onNovoAgendamento}>
          <Plus className="h-4 w-4" />
          Novo agendamento
        </Button>
      </div>
    </div>
  )
}
