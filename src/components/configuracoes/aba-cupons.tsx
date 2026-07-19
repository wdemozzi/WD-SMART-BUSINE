import { useState } from 'react'
import { Plus, Trash2, Ticket } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCupons } from '@/hooks/use-cupons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CupomFormModal } from '@/components/configuracoes/cupom-form-modal'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Cupom } from '@/types/database'

function descreveDesconto(c: Cupom) {
  return c.tipo === 'percentual' ? `${c.valor}%` : formatCurrency(c.valor)
}

export function AbaCupons() {
  const { empresa } = useAuth()
  const { cupons, carregando, erro, criar, alternarAtivo, excluir } = useCupons(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [cupomParaExcluir, setCupomParaExcluir] = useState<Cupom | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function confirmarExclusao() {
    if (!cupomParaExcluir) return
    setExcluindo(true)
    await excluir(cupomParaExcluir.id)
    setExcluindo(false)
    setCupomParaExcluir(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">
          Cupons podem ser aplicados na criação de um agendamento, informando o código.
        </p>
        <Button size="sm" onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Uso</th>
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
            ) : cupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhum cupom criado ainda.
                </td>
              </tr>
            ) : (
              cupons.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-data font-medium text-[var(--color-ink-900)]">
                      <Ticket className="h-3.5 w-3.5 text-brand-500" />
                      {c.codigo}
                    </div>
                    {c.descricao && <p className="mt-0.5 text-xs text-[var(--color-ink-400)]">{c.descricao}</p>}
                  </td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{descreveDesconto(c)}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">
                    {c.validade ? formatDate(c.validade) : 'Sem expiração'}
                  </td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">
                    {c.quantidade_usada}
                    {c.limite_uso ? ` / ${c.limite_uso}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => alternarAtivo(c)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        c.ativo ? 'bg-success-50 text-success-500' : 'bg-[var(--color-canvas)] text-[var(--color-ink-400)]'
                      )}
                    >
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setCupomParaExcluir(c)}>
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

      <CupomFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} aoSalvar={criar} />

      <ConfirmDialog
        aberto={!!cupomParaExcluir}
        onFechar={() => setCupomParaExcluir(null)}
        titulo="Excluir cupom"
        mensagem={`Tem certeza que deseja excluir o cupom "${cupomParaExcluir?.codigo}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
