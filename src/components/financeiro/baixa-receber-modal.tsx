import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { ContaReceber } from '@/types/database'

export function BaixaReceberModal({
  conta,
  onFechar,
  aoConfirmar,
}: {
  conta: ContaReceber | null
  onFechar: () => void
  aoConfirmar: (metodo: string) => Promise<unknown>
}) {
  const [metodo, setMetodo] = useState('pix')
  const [enviando, setEnviando] = useState(false)

  if (!conta) return null

  async function confirmar() {
    setEnviando(true)
    await aoConfirmar(metodo)
    setEnviando(false)
    onFechar()
  }

  return (
    <Dialog aberto={!!conta} onFechar={onFechar} titulo="Confirmar recebimento" largura="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-ink-600)]">
          Confirmar recebimento de <strong>{conta.descricao}</strong>? O valor entra automaticamente no fluxo de caixa.
        </p>

        <div>
          <Label htmlFor="metodo">Método de pagamento</Label>
          <Select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
            <option value="boleto">Boleto</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="outro">Outro</option>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onFechar}>
            Cancelar
          </Button>
          <Button size="sm" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Confirmando…' : 'Confirmar recebimento'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
