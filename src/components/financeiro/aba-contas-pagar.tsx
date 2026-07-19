import { useState } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useContasPagar } from '@/hooks/use-contas-pagar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ContaPagarFormModal } from '@/components/financeiro/conta-pagar-form-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ContaPagar } from '@/types/database'

export function AbaContasPagar() {
  const { empresa } = useAuth()
  const { contas, carregando, erro, criar, excluir, darBaixa } = useContasPagar(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaPagar | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [pagando, setPagando] = useState<string | null>(null)

  async function confirmarExclusao() {
    if (!contaParaExcluir) return
    setExcluindo(true)
    await excluir(contaParaExcluir.id)
    setExcluindo(false)
    setContaParaExcluir(null)
  }

  async function pagar(conta: ContaPagar) {
    setPagando(conta.id)
    await darBaixa(conta)
    setPagando(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">Despesas e contas fixas da empresa.</p>
        <Button size="sm" onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova conta a pagar
        </Button>
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                  Carregando…
                </td>
              </tr>
            ) : contas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhuma conta a pagar cadastrada.
                </td>
              </tr>
            ) : (
              contas.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{c.descricao}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{c.categoria ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{formatDate(c.vencimento)}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(c.valor)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {c.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Marcar como paga"
                          onClick={() => pagar(c)}
                          disabled={pagando === c.id}
                        >
                          <CheckCircle2 className="h-4 w-4 text-success-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setContaParaExcluir(c)}>
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <ContaPagarFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} aoSalvar={criar} />

      <ConfirmDialog
        aberto={!!contaParaExcluir}
        onFechar={() => setContaParaExcluir(null)}
        titulo="Excluir conta a pagar"
        mensagem={`Tem certeza que deseja excluir "${contaParaExcluir?.descricao}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
