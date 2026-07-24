import { useMemo, useState } from 'react'
import { Wallet, UserCheck, Ban } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useConsumoInterno } from '@/hooks/use-consumo-interno'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'

const corStatusConsumo: Record<string, string> = {
  pendente: 'pendente',
  cobrado: 'pago',
  descontado: 'pago',
  cancelado: 'cancelado',
}

export function AbaConsumoInterno() {
  const { empresa } = useAuth()
  const { consumos, carregando, atualizarStatus } = useConsumoInterno(empresa?.id)
  const [filtroFuncionario, setFiltroFuncionario] = useState('')
  const [processando, setProcessando] = useState<string | null>(null)

  const funcionariosUnicos = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const c of consumos) {
      if (c.funcionario_nome && !mapa.has(c.funcionario_id)) {
        mapa.set(c.funcionario_id, c.funcionario_nome)
      }
    }
    return Array.from(mapa.entries())
  }, [consumos])

  const filtrados = filtroFuncionario
    ? consumos.filter((c) => c.funcionario_id === filtroFuncionario)
    : consumos

  const totalPendente = filtrados
    .filter((c) => c.status === 'pendente')
    .reduce((s, c) => s + Number(c.valor_total), 0)

  const totaisPorFuncionario = useMemo(() => {
    const mapa = new Map<string, { nome: string; pendente: number }>()
    for (const c of consumos.filter((c) => c.status === 'pendente')) {
      const atual = mapa.get(c.funcionario_id) ?? { nome: c.funcionario_nome ?? '', pendente: 0 }
      atual.pendente += Number(c.valor_total)
      mapa.set(c.funcionario_id, atual)
    }
    return Array.from(mapa.entries()).map(([id, v]) => ({ id, ...v }))
  }, [consumos])

  async function handleAtualizar(id: string, status: 'cobrado' | 'descontado' | 'cancelado') {
    setProcessando(id)
    await atualizarStatus(id, status)
    setProcessando(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-ink-400)]">
          Produtos consumidos por funcionários. Registre cobrança ou desconto em folha quando resolvido.
        </p>
        <Select value={filtroFuncionario} onChange={(e) => setFiltroFuncionario(e.target.value)} className="w-auto">
          <option value="">Todos os funcionários</option>
          {funcionariosUnicos.map(([id, nome]) => (
            <option key={id} value={id}>{nome}</option>
          ))}
        </Select>
      </div>

      {/* Cards de resumo por funcionário */}
      {totaisPorFuncionario.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totaisPorFuncionario.map((f) => (
            <Card key={f.id} className="p-4">
              <p className="text-sm font-medium text-[var(--color-ink-900)]">{f.nome}</p>
              <p className="font-data text-lg font-semibold text-warning-500">
                {formatCurrency(f.pendente)}
              </p>
              <p className="text-xs text-[var(--color-ink-400)]">pendente</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabela de consumos */}
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Funcionário</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Qtd</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-ink-400)]">Carregando…</td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhum consumo interno registrado.
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{formatDate(c.criado_em)}</td>
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{c.funcionario_nome}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">
                    {c.quantidade}x {c.produto_nome}
                  </td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{c.quantidade}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(c.valor_total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={corStatusConsumo[c.status] ?? 'pendente'} />
                  </td>
                  <td className="px-4 py-3">
                    {c.status === 'pendente' && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Cobrar"
                          onClick={() => handleAtualizar(c.id, 'cobrado')}
                          disabled={processando === c.id}
                        >
                          <Wallet className="h-4 w-4 text-success-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Descontar"
                          onClick={() => handleAtualizar(c.id, 'descontado')}
                          disabled={processando === c.id}
                        >
                          <UserCheck className="h-4 w-4 text-brand-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Cancelar"
                          onClick={() => handleAtualizar(c.id, 'cancelado')}
                          disabled={processando === c.id}
                        >
                          <Ban className="h-4 w-4 text-danger-500" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {totalPendente > 0 && (
        <p className="text-right text-sm font-medium text-warning-500">
          Total pendente: {formatCurrency(totalPendente)}
        </p>
      )}
    </div>
  )
}
