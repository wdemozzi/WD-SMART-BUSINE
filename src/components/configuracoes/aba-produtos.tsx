import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useProdutos } from '@/hooks/use-produtos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ProdutoFormModal } from '@/components/configuracoes/produto-form-modal'
import { formatCurrency, cn } from '@/lib/utils'
import type { Produto } from '@/types/database'

export function AbaProdutos() {
  const { empresa } = useAuth()
  const { produtos, carregando, erro, criar, atualizar, excluir } = useProdutos(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null)
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function confirmarExclusao() {
    if (!produtoParaExcluir) return
    setExcluindo(true)
    await excluir(produtoParaExcluir.id)
    setExcluindo(false)
    setProdutoParaExcluir(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">Produtos vendidos no PDV, com controle de estoque.</p>
        <Button
          size="sm"
          onClick={() => {
            setProdutoEmEdicao(null)
            setModalAberto(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço de venda</th>
              <th className="px-4 py-3 font-medium">Estoque</th>
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
            ) : produtos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            ) : (
              produtos.map((p) => {
                const estoqueBaixo = p.quantidade_estoque <= p.estoque_minimo
                return (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                    <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{p.nome}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-600)]">{p.categoria ?? '—'}</td>
                    <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(p.preco_venda)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-data',
                          estoqueBaixo ? 'text-warning-500' : 'text-[var(--color-ink-600)]'
                        )}
                      >
                        {estoqueBaixo && <AlertTriangle className="h-3.5 w-3.5" />}
                        {p.quantidade_estoque} un.
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.ativo ? 'text-success-500' : 'text-[var(--color-ink-400)]'}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setProdutoEmEdicao(p)
                            setModalAberto(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setProdutoParaExcluir(p)}>
                          <Trash2 className="h-4 w-4 text-danger-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Card>

      <ProdutoFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        produtoEmEdicao={produtoEmEdicao}
        aoSalvar={(valores) => (produtoEmEdicao ? atualizar(produtoEmEdicao.id, valores) : criar(valores))}
      />

      <ConfirmDialog
        aberto={!!produtoParaExcluir}
        onFechar={() => setProdutoParaExcluir(null)}
        titulo="Excluir produto"
        mensagem={`Tem certeza que deseja excluir "${produtoParaExcluir?.nome}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
