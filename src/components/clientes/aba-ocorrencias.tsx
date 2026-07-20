import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useOcorrenciasClientes } from '@/hooks/use-ocorrencias-clientes'
import { formatDate } from '@/lib/utils'

export function AbaOcorrencias({ empresaId }: { empresaId: string | undefined }) {
  const { ocorrencias, carregando } = useOcorrenciasClientes(empresaId)

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Faltas</th>
            <th className="px-4 py-3 font-medium">Cancel. em cima da hora</th>
            <th className="px-4 py-3 font-medium">Cancelamentos totais</th>
            <th className="px-4 py-3 font-medium">Remarcações</th>
            <th className="px-4 py-3 font-medium">Última ocorrência</th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                Carregando…
              </td>
            </tr>
          ) : ocorrencias.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-ink-400)]">
                <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
                Nenhuma ocorrência registrada. 🎉
              </td>
            </tr>
          ) : (
            ocorrencias.map((o) => (
              <tr key={o.cliente_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{o.nome}</td>
                <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">
                  {o.total_faltas > 0 ? (
                    <span className="rounded-full bg-danger-50 px-2 py-0.5 text-danger-500">{o.total_faltas}</span>
                  ) : (
                    '0'
                  )}
                </td>
                <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">
                  {o.cancelamentos_ultima_hora > 0 ? (
                    <span className="rounded-full bg-warning-50 px-2 py-0.5 text-warning-500">{o.cancelamentos_ultima_hora}</span>
                  ) : (
                    '0'
                  )}
                </td>
                <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{o.total_cancelamentos}</td>
                <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{o.total_reagendamentos}</td>
                <td className="px-4 py-3 text-[var(--color-ink-600)]">
                  {o.ultima_ocorrencia_em ? formatDate(o.ultima_ocorrencia_em, true) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  )
}
