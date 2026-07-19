import { format, isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { diasDoIntervalo } from '@/lib/date-helpers'
import { cn } from '@/lib/utils'
import type { AgendamentoCompleto } from '@/types/database'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function GradeMes({
  mesReferencia,
  agendamentos,
  onSelecionarDia,
  onSelecionarAgendamento,
}: {
  mesReferencia: Date
  agendamentos: AgendamentoCompleto[]
  onSelecionarDia: (data: Date) => void
  onSelecionarAgendamento: (a: AgendamentoCompleto) => void
}) {
  const inicioGrade = startOfWeek(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1), { weekStartsOn: 0 })
  const fimGrade = endOfWeek(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0), { weekStartsOn: 0 })
  const dias = diasDoIntervalo(inicioGrade, fimGrade)

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-[var(--color-ink-400)]">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const doMes = isSameMonth(dia, mesReferencia)
          const agendamentosDoDia = agendamentos
            .filter((a) => isSameDay(new Date(a.data_hora_inicio), dia))
            .sort((a, b) => a.data_hora_inicio.localeCompare(b.data_hora_inicio))

          return (
            <button
              key={dia.toISOString()}
              onClick={() => onSelecionarDia(dia)}
              className={cn(
                'flex min-h-24 flex-col gap-1 border-b border-r border-[var(--color-border)] p-1.5 text-left hover:bg-[var(--color-canvas)]',
                !doMes && 'bg-[var(--color-canvas)]/50 text-[var(--color-ink-400)]'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
                  isToday(dia) && 'bg-brand-500 text-white'
                )}
              >
                {format(dia, 'd')}
              </span>

              <div className="flex flex-col gap-0.5">
                {agendamentosDoDia.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelecionarAgendamento(a)
                    }}
                    className="truncate rounded bg-brand-50 px-1 py-0.5 text-[11px] text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                  >
                    {format(new Date(a.data_hora_inicio), 'HH:mm')} {a.cliente_nome}
                  </span>
                ))}
                {agendamentosDoDia.length > 3 && (
                  <span className="text-[11px] text-[var(--color-ink-400)]">
                    +{agendamentosDoDia.length - 3} mais
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
