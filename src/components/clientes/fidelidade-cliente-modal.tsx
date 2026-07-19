import { useState } from 'react'
import { Award, Gift } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useFidelidadeCliente } from '@/hooks/use-fidelidade-cliente'
import { useFidelidadeRecompensas } from '@/hooks/use-fidelidade'
import { formatDate } from '@/lib/utils'
import type { Cliente } from '@/types/database'

function rotuloMovimento(tipo: string) {
  if (tipo === 'ganho') return { texto: 'Pontos ganhos', cor: 'text-success-500' }
  if (tipo === 'resgate') return { texto: 'Resgate', cor: 'text-danger-500' }
  return { texto: 'Ajuste', cor: 'text-[var(--color-ink-600)]' }
}

export function FidelidadeClienteModal({ cliente, onFechar }: { cliente: Cliente | null; onFechar: () => void }) {
  const { empresa, perfil } = useAuth()
  const { saldo, movimentos, carregando, resgatar } = useFidelidadeCliente(cliente?.id, empresa?.id)
  const { recompensas } = useFidelidadeRecompensas(empresa?.id)
  const [resgatando, setResgatando] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null)

  if (!cliente) return null

  async function handleResgatar(recompensaId: string) {
    setResgatando(recompensaId)
    setMensagem(null)
    const resultado = await resgatar(recompensaId, perfil?.id ?? null)
    setResgatando(null)

    if (!resultado.sucesso) {
      setMensagem({ tipo: 'erro', texto: resultado.mensagem_erro ?? 'Não foi possível resgatar.' })
    } else {
      setMensagem({ tipo: 'sucesso', texto: 'Recompensa resgatada com sucesso!' })
    }
  }

  return (
    <Dialog aberto={!!cliente} onFechar={onFechar} titulo={`Fidelidade — ${cliente.nome}`} largura="max-w-lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
          <Award className="h-6 w-6 text-brand-500" />
          <div>
            <p className="font-data text-2xl font-semibold text-brand-600">{saldo} pts</p>
            <p className="text-xs text-[var(--color-ink-400)]">Saldo atual de pontos</p>
          </div>
        </div>

        {mensagem && (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              mensagem.tipo === 'erro' ? 'bg-danger-50 text-danger-500' : 'bg-success-50 text-success-500'
            }`}
          >
            {mensagem.texto}
          </p>
        )}

        <div>
          <h3 className="mb-2 text-sm font-medium text-[var(--color-ink-900)]">Recompensas disponíveis</h3>
          {recompensas.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-400)]">Nenhuma recompensa cadastrada ainda.</p>
          ) : (
            <div className="space-y-1.5">
              {recompensas.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Gift className="h-3.5 w-3.5 text-brand-500" />
                    <span className="text-sm font-medium text-[var(--color-ink-900)]">{r.nome}</span>
                    <span className="font-data text-xs text-[var(--color-ink-400)]">{r.pontos_necessarios} pts</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saldo < r.pontos_necessarios || resgatando === r.id}
                    onClick={() => handleResgatar(r.id)}
                  >
                    {resgatando === r.id ? 'Resgatando…' : 'Resgatar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-[var(--color-ink-900)]">Histórico</h3>
          {carregando ? (
            <p className="text-sm text-[var(--color-ink-400)]">Carregando…</p>
          ) : movimentos.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-400)]">Nenhuma movimentação ainda.</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {movimentos.map((m) => {
                const rotulo = rotuloMovimento(m.tipo)
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className={rotulo.cor}>{m.descricao ?? rotulo.texto}</p>
                      <p className="text-xs text-[var(--color-ink-400)]">{formatDate(m.criado_em, true)}</p>
                    </div>
                    <span className={`font-data font-medium ${rotulo.cor}`}>
                      {m.pontos > 0 ? '+' : ''}
                      {m.pontos}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
