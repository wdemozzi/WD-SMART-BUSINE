import { useState } from 'react'
import { Package, Check } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { usePacotes } from '@/hooks/use-pacotes'
import { useVendasPacotesCliente, venderPacote } from '@/hooks/use-vendas-pacotes'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Cliente } from '@/types/database'

export function VenderPacoteModal({ cliente, onFechar }: { cliente: Cliente | null; onFechar: () => void }) {
  const { empresa, perfil } = useAuth()
  const { pacotes } = usePacotes(empresa?.id)
  const { vendas, carregando, recarregar } = useVendasPacotesCliente(cliente?.id)
  const [pacoteId, setPacoteId] = useState('')
  const [metodo, setMetodo] = useState('pix')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  if (!cliente) return null

  const pacotesAtivos = pacotes.filter((p) => p.ativo)

  async function handleVender() {
    if (!pacoteId || !empresa?.id) return
    setEnviando(true)
    setErro(null)

    const { error } = await venderPacote({
      empresaId: empresa.id,
      clienteId: cliente!.id,
      pacoteId,
      metodo,
      criadoPor: perfil?.id ?? null,
    })

    setEnviando(false)

    if (error) {
      setErro('Não foi possível vender o pacote.')
      return
    }

    setSucesso(true)
    setPacoteId('')
    await recarregar()
  }

  return (
    <Dialog aberto={!!cliente} onFechar={onFechar} titulo={`Pacotes — ${cliente.nome}`} largura="max-w-lg">
      <div className="space-y-5">
        <div className="space-y-3 rounded-md border border-[var(--color-border)] p-3">
          <p className="text-sm font-medium text-[var(--color-ink-900)]">Vender novo pacote</p>
          <Select value={pacoteId} onChange={(e) => setPacoteId(e.target.value)}>
            <option value="">Selecione um pacote</option>
            {pacotesAtivos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {formatCurrency(p.valor_total)}
              </option>
            ))}
          </Select>
          <Select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="boleto">Boleto</option>
            <option value="outro">Outro</option>
          </Select>

          {erro && <p className="text-xs text-danger-500">{erro}</p>}
          {sucesso && (
            <p className="flex items-center gap-1 text-xs text-success-500">
              <Check className="h-3.5 w-3.5" /> Pacote vendido e lançado no fluxo de caixa.
            </p>
          )}

          <Button size="sm" className="w-full" onClick={handleVender} disabled={!pacoteId || enviando}>
            {enviando ? 'Registrando…' : 'Vender pacote'}
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-ink-900)]">Pacotes deste cliente</p>
          {carregando ? (
            <p className="text-sm text-[var(--color-ink-400)]">Carregando…</p>
          ) : vendas.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-400)]">Nenhum pacote comprado ainda.</p>
          ) : (
            <div className="space-y-2">
              {vendas.map((v) => (
                <div key={v.id} className="rounded-md border border-[var(--color-border)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-900)]">
                      <Package className="h-3.5 w-3.5 text-brand-500" />
                      {v.pacote_nome}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.status === 'ativo'
                          ? 'bg-success-50 text-success-500'
                          : v.status === 'finalizado'
                            ? 'bg-[var(--color-canvas)] text-[var(--color-ink-400)]'
                            : 'bg-danger-50 text-danger-500'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-400)]">Comprado em {formatDate(v.criado_em)}</p>
                  <div className="mt-1.5 space-y-0.5 text-xs text-[var(--color-ink-600)]">
                    {v.saldos.map((s) => (
                      <p key={s.id}>
                        {s.quantidade_total - s.quantidade_usada} de {s.quantidade_total} sessões restantes
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
