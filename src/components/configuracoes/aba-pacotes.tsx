import { useState } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePacotes } from '@/hooks/use-pacotes'
import { useCadastrosAgenda } from '@/hooks/use-cadastros-agenda'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PacoteFormModal } from '@/components/configuracoes/pacote-form-modal'
import { formatCurrency, cn } from '@/lib/utils'
import type { Pacote } from '@/types/database'

export function AbaPacotes() {
  const { empresa } = useAuth()
  const { pacotes, itensPorPacote, carregando, criar, alternarAtivo, excluir } = usePacotes(empresa?.id)
  const { servicos } = useCadastrosAgenda(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [pacoteParaExcluir, setPacoteParaExcluir] = useState<Pacote | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function confirmarExclusao() {
    if (!pacoteParaExcluir) return
    setExcluindo(true)
    await excluir(pacoteParaExcluir.id)
    setExcluindo(false)
    setPacoteParaExcluir(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">
          Combos de sessões que o cliente compra de uma vez e usa aos poucos (ex: 10 cortes por R$400).
        </p>
        <Button size="sm" onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo pacote
        </Button>
      </div>

      {carregando ? (
        <div className="h-40 animate-pulse rounded-lg bg-[var(--color-border)]/30" />
      ) : pacotes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-ink-400)]">
          Nenhum pacote cadastrado ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pacotes.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-brand-500" />
                  <p className="font-medium text-[var(--color-ink-900)]">{p.nome}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setPacoteParaExcluir(p)}>
                  <Trash2 className="h-4 w-4 text-danger-500" />
                </Button>
              </div>

              <p className="mt-1 font-data text-lg font-semibold text-brand-600">{formatCurrency(p.valor_total)}</p>

              <ul className="mt-2 space-y-0.5 text-xs text-[var(--color-ink-600)]">
                {(itensPorPacote[p.id] ?? []).map((item) => (
                  <li key={item.id}>
                    {item.quantidade}x {item.servico_nome}
                  </li>
                ))}
              </ul>

              {p.validade_dias && (
                <p className="mt-1 text-xs text-[var(--color-ink-400)]">Válido por {p.validade_dias} dias após a compra</p>
              )}

              <button
                onClick={() => alternarAtivo(p)}
                className={cn(
                  'mt-3 rounded-full px-2.5 py-1 text-xs font-medium',
                  p.ativo ? 'bg-success-50 text-success-500' : 'bg-[var(--color-canvas)] text-[var(--color-ink-400)]'
                )}
              >
                {p.ativo ? 'Ativo' : 'Inativo'}
              </button>
            </Card>
          ))}
        </div>
      )}

      <PacoteFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} servicos={servicos} aoSalvar={criar} />

      <ConfirmDialog
        aberto={!!pacoteParaExcluir}
        onFechar={() => setPacoteParaExcluir(null)}
        titulo="Excluir pacote"
        mensagem={`Tem certeza que deseja excluir "${pacoteParaExcluir?.nome}"? Pacotes já vendidos para clientes não são afetados.`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
