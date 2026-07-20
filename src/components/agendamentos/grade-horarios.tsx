import { format, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HORA_INICIO_GRADE, HORA_FIM_GRADE, minutosDesde } from '@/lib/date-helpers'
import type { AgendamentoCompleto } from '@/types/database'

const ALTURA_HORA_PX = 56

const corPorStatus: Record<string, string> = {
  agendado: 'bg-info-50 border-info-500/40 text-info-500',
  confirmado: 'bg-success-50 border-success-500/40 text-success-500',
  em_andamento: 'bg-warning-50 border-warning-500/40 text-warning-500',
  concluido: 'bg-[var(--color-canvas)] border-[var(--color-border)] text-[var(--color-ink-600)]',
  cancelado: 'bg-danger-50 border-danger-500/30 text-danger-500 opacity-60 line-through',
  nao_compareceu: 'bg-danger-50 border-danger-500/30 text-danger-500 opacity-60',
}

export function GradeHorarios({
  dias,
  agendamentos,
  onSelecionarAgendamento,
  onSelecionarHorario,
}: {
  dias: Date[]
  agendamentos: AgendamentoCompleto[]
  onSelecionarAgendamento: (a: AgendamentoCompleto) => void
  onSelecionarHorario: (data: Date) => void
}) {
  const horas = Array.from(
    { length: HORA_FIM_GRADE - HORA_INICIO_GRADE + 1 },
    (_, i) => HORA_INICIO_GRADE + i
  )

  return (
    <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Coluna de horas */}
      <div className="w-14 shrink-0 border-r border-[var(--color-border)]">
        <div className="h-12 border-b border-[var(--color-border)]" />
        {horas.map((h) => (
          <div
            key={h}
            style={{ height: ALTURA_HORA_PX }}
            className="border-b border-[var(--color-border)] px-2 pt-1 text-right font-data text-xs text-[var(--color-ink-400)]"
          >
            {String(h).padStart(2, '0')}h
          </div>
        ))}
      </div>

      {/* Colunas dos dias */}
      <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${dias.length}, minmax(0, 1fr))` }}>
        {dias.map((dia) => {
          const agendamentosDoDia = agendamentos.filter((a) => isSameDay(new Date(a.data_hora_inicio), dia))

          return (
            <div key={dia.toISOString()} className="relative border-r border-[var(--color-border)] last:border-r-0">
              <div
                className={cn(
                  'flex h-12 flex-col items-center justify-center border-b border-[var(--color-border)] text-xs',
                  isToday(dia) && 'bg-brand-50 dark:bg-brand-500/10'
                )}
              >
                <span className="capitalize text-[var(--color-ink-400)]">
                  {format(dia, 'EEE', { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    'font-display text-sm font-semibold',
                    isToday(dia) ? 'text-brand-600' : 'text-[var(--color-ink-900)]'
                  )}
                >
                  {format(dia, 'd')}
                </span>
              </div>

              <div className="relative">
                {horas.map((h) => (
                  <button
                    key={h}
                    style={{ height: ALTURA_HORA_PX }}
                    className="block w-full border-b border-[var(--color-border)] hover:bg-[var(--color-canvas)]"
                    onClick={() => {
                      const dataClicada = new Date(dia)
                      dataClicada.setHours(h, 0, 0, 0)
                      onSelecionarHorario(dataClicada)
                    }}
                  />
                ))}

                {agendamentosDoDia.map((a) => {
                  const inicio = new Date(a.data_hora_inicio)
                  const fim = new Date(a.data_hora_fim)
                  const top = (minutosDesde(HORA_INICIO_GRADE, inicio) / 60) * ALTURA_HORA_PX
                  const altura = Math.max(
                    ((fim.getTime() - inicio.getTime()) / 60000 / 60) * ALTURA_HORA_PX,
                    22
                  )

                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelecionarAgendamento(a)}
                      style={{ top, height: altura }}
                      className={cn(
                        'absolute left-1 right-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs shadow-sm transition-transform hover:z-10 hover:scale-[1.02]',
                        corPorStatus[a.status]
                      )}
                    >
                      <p className="truncate font-medium">
                        {format(inicio, 'HH:mm')} · {a.cliente_nome}
                        {a.origem === 'online' && <Globe className="ml-1 inline h-2.5 w-2.5" />}
                      </p>
                      <p className="truncate opacity-80">{a.servico_nome}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
