import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useAuth } from '@/context/AuthContext'
import { useComissoes } from '@/hooks/use-comissoes'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'

function paraInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function ComissoesPage() {
  const { empresa } = useAuth()
  const [inicioStr, setInicioStr] = useState(paraInputDate(startOfMonth(new Date())))
  const [fimStr, setFimStr] = useState(paraInputDate(endOfMonth(new Date())))
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pagando, setPagando] = useState<string | null>(null)

  const inicio = useMemo(() => new Date(`${inicioStr}T00:00:00`), [inicioStr])
  const fim = useMemo(() => new Date(`${fimStr}T23:59:59`), [fimStr])

  const { resumo, carregando, pagarPendentes } = useComissoes(empresa?.id, inicio, fim)

  async function handlePagar(funcionarioId: string) {
    setPagando(funcionarioId)
    await pagarPendentes(funcionarioId)
    setPagando(null)
  }

  const totalPendenteGeral = resumo.reduce((s, r) => s + r.totalPendente, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Comissões</h1>
        <p className="text-sm text-[var(--color-ink-400)]">
          Calculadas automaticamente sobre atendimentos concluídos na Agenda, conforme o % configurado em cada profissional.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Input type="date" value={inicioStr} onChange={(e) => setInicioStr(e.target.value)} className="w-auto" />
          <span className="text-sm text-[var(--color-ink-400)]">até</span>
          <Input type="date" value={fimStr} onChange={(e) => setFimStr(e.target.value)} className="w-auto" />
        </div>
        <div className="ml-auto rounded-md bg-warning-50 px-3 py-2 text-sm font-medium text-warning-500">
          Total pendente no período: {formatCurrency(totalPendenteGeral)}
        </div>
      </div>

      {carregando ? (
        <div className="h-40 animate-pulse rounded-lg bg-[var(--color-border)]/30" />
      ) : resumo.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-ink-400)]">
          Nenhuma comissão gerada neste período. Configure o % de comissão em Configurações → Funcionários.
        </p>
      ) : (
        <div className="space-y-3">
          {resumo.map((r) => (
            <Card key={r.funcionario_id} className="overflow-hidden">
              <button
                onClick={() => setExpandido(expandido === r.funcionario_id ? null : r.funcionario_id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-canvas)]"
              >
                <div>
                  <p className="font-medium text-[var(--color-ink-900)]">{r.funcionario_nome}</p>
                  <p className="text-xs text-[var(--color-ink-400)]">{r.comissoes.length} lançamento(s)</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-data text-sm font-semibold text-warning-500">{formatCurrency(r.totalPendente)}</p>
                    <p className="text-xs text-[var(--color-ink-400)]">pendente</p>
                  </div>
                  <div className="text-right">
                    <p className="font-data text-sm text-success-500">{formatCurrency(r.totalPago)}</p>
                    <p className="text-xs text-[var(--color-ink-400)]">já paga</p>
                  </div>
                  {expandido === r.funcionario_id ? (
                    <ChevronUp className="h-4 w-4 text-[var(--color-ink-400)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--color-ink-400)]" />
                  )}
                </div>
              </button>

              {expandido === r.funcionario_id && (
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <div className="mb-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handlePagar(r.funcionario_id)}
                      disabled={r.totalPendente <= 0 || pagando === r.funcionario_id}
                    >
                      <Wallet className="h-4 w-4" />
                      {pagando === r.funcionario_id
                        ? 'Pagando…'
                        : `Pagar ${formatCurrency(r.totalPendente)} pendente(s)`}
                    </Button>
                  </div>

                  <table className="w-full text-left text-sm">
                    <thead className="text-[var(--color-ink-400)]">
                      <tr>
                        <th className="pb-1.5 font-medium">Data</th>
                        <th className="pb-1.5 font-medium">Origem</th>
                        <th className="pb-1.5 font-medium">Base</th>
                        <th className="pb-1.5 font-medium">%</th>
                        <th className="pb-1.5 font-medium">Comissão</th>
                        <th className="pb-1.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.comissoes.map((c) => (
                        <tr key={c.id} className="border-t border-[var(--color-border)]">
                          <td className="py-1.5 text-[var(--color-ink-600)]">{formatDate(c.criado_em, true)}</td>
                          <td className="py-1.5 text-[var(--color-ink-600)]">
                            {c.origem === 'agendamento' ? 'Atendimento' : 'Venda PDV'}
                          </td>
                          <td className="py-1.5 font-data text-[var(--color-ink-600)]">{formatCurrency(c.valor_base)}</td>
                          <td className="py-1.5 font-data text-[var(--color-ink-600)]">{c.percentual_aplicado}%</td>
                          <td className="py-1.5 font-data font-medium text-[var(--color-ink-900)]">
                            {formatCurrency(c.valor_comissao)}
                          </td>
                          <td className="py-1.5">
                            <StatusBadge status={c.status === 'pendente' ? 'pendente' : 'pago'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
