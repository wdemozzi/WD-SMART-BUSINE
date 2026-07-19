import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useServicos } from '@/hooks/use-servicos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ServicoFormModal } from '@/components/configuracoes/servico-form-modal'
import { formatCurrency } from '@/lib/utils'
import type { Servico } from '@/types/database'

export function AbaServicos() {
  const { empresa } = useAuth()
  const { servicos, carregando, erro, criar, atualizar, excluir } = useServicos(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [servicoEmEdicao, setServicoEmEdicao] = useState<Servico | null>(null)
  const [servicoParaExcluir, setServicoParaExcluir] = useState<Servico | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function confirmarExclusao() {
    if (!servicoParaExcluir) return
    setExcluindo(true)
    await excluir(servicoParaExcluir.id)
    setExcluindo(false)
    setServicoParaExcluir(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">
          Serviços aparecem no formulário de agendamento e na página pública, quando ativos.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setServicoEmEdicao(null)
            setModalAberto(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo serviço
        </Button>
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Duração</th>
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
            ) : servicos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhum serviço cadastrado ainda.
                </td>
              </tr>
            ) : (
              servicos.map((s) => (
                <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{s.nome}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{s.categoria ?? '—'}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{s.duracao_minutos} min</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(s.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={s.ativo ? 'text-success-500' : 'text-[var(--color-ink-400)]'}>
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        onClick={() => {
                          setServicoEmEdicao(s)
                          setModalAberto(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setServicoParaExcluir(s)}>
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

      <ServicoFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        servicoEmEdicao={servicoEmEdicao}
        aoSalvar={(valores) => (servicoEmEdicao ? atualizar(servicoEmEdicao.id, valores) : criar(valores))}
      />

      <ConfirmDialog
        aberto={!!servicoParaExcluir}
        onFechar={() => setServicoParaExcluir(null)}
        titulo="Excluir serviço"
        mensagem={`Tem certeza que deseja excluir "${servicoParaExcluir?.nome}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
