import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({
  label,
  value,
  icon: Icon,
  tendencia,
}: {
  label: string
  value: string
  icon: LucideIcon
  tendencia?: { valor: string; positiva: boolean }
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-5">
        <div className="space-y-1">
          <p className="text-sm text-[var(--color-ink-600)]">{label}</p>
          <p className="font-data text-2xl font-semibold text-[var(--color-ink-900)]">{value}</p>
          {tendencia && (
            <p
              className={cn(
                'text-xs font-medium',
                tendencia.positiva ? 'text-success-500' : 'text-danger-500'
              )}
            >
              {tendencia.positiva ? '↑' : '↓'} {tendencia.valor}
            </p>
          )}
        </div>
        <div className="rounded-md bg-brand-50 p-2 text-brand-500 dark:bg-brand-500/10">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}
