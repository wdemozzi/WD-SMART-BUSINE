import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  aberto,
  onFechar,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  variantConfirmar = 'destructive',
  onConfirmar,
  carregando,
}: {
  aberto: boolean
  onFechar: () => void
  titulo: string
  mensagem: string
  textoConfirmar?: string
  variantConfirmar?: 'default' | 'destructive'
  onConfirmar: () => void
  carregando?: boolean
}) {
  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo={titulo} largura="max-w-sm">
      <p className="text-sm text-[var(--color-ink-600)]">{mensagem}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onFechar}>
          Cancelar
        </Button>
        <Button variant={variantConfirmar} size="sm" onClick={onConfirmar} disabled={carregando}>
          {carregando ? 'Excluindo…' : textoConfirmar}
        </Button>
      </div>
    </Dialog>
  )
}
