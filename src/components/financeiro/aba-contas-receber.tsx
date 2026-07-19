import { useState } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useContasReceber } from '@/hooks/use-contas-receber'
import { useCadastrosAgenda } from '@/hooks/use-cadastros-agenda'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ContaReceberFormModal } from '@/components/financeiro/conta-receber-form-modal'
import { BaixaReceberModal } from '@/components/financeiro/baixa-receber-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ContaReceber } from '@/types/database'

export function AbaContasReceber() {
  const { empresa } = useAuth()
  const { contas, carregando, erro, criar, excluir, darBaixa } = useContasReceber(empresa?.id)
  const { clientes } = useCadastrosAgenda(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [contaParaBaixa, setContaParaBaixa] = useState<ContaReceber | null>(null)
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaReceber | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function confirmarExclusao() {
    if (!contaParaExcluir) return
    setExcluindo(true)
    await excluir(contaParaExcluir.id)
    setExcluindo(false)
    setContaParaExcluir(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">Cobranças e mensalidades a receber dos clientes.</p>
        <Button size="sm" onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova conta a receber
        </Button>
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                  Carregando…
                </td>
              </tr>
            ) : contas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhuma conta a receber cadastrada.
                </td>
              </tr>
            ) : (
              contas.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{c.descricao}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{formatDate(c.vencimento)}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(c.valor)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {c.status === 'pendente' && (
                        <Button variant="ghost" size="icon" aria-label="Confirmar recebimento" onClick={() => setContaParaBaixa(c)}>
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

      <ContaReceberFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        clientes={clientes}
        aoSalvar={criar}
      />

      <BaixaReceberModal
        conta={contaParaBaixa}
        onFechar={() => setContaParaBaixa(null)}
        aoConfirmar={(metodo) => darBaixa(contaParaBaixa!, metodo)}
      />

      <ConfirmDialog
        aberto={!!contaParaExcluir}
        onFechar={() => setContaParaExcluir(null)}
        titulo="Excluir conta a receber"
        mensagem={`Tem certeza que deseja excluir "${contaParaExcluir?.descricao}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
