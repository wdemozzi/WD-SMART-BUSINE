import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { CupomFormValues } from '@/hooks/use-cupons'

const valoresVazios: CupomFormValues = {
  codigo: '',
  descricao: '',
  tipo: 'percentual',
  valor: 10,
  validade: '',
  limite_uso: null,
  limite_uso_por_cliente: null,
}

export function CupomFormModal({
  aberto,
  onFechar,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  aoSalvar: (valores: CupomFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<CupomFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarCampo<K extends keyof CupomFormValues>(campo: K, valor: CupomFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.codigo.trim() || valores.valor <= 0) {
      setErro('Preencha o código e um valor de desconto maior que zero.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível criar o cupom. O código já pode estar em uso.')
      return
    }

    setValores(valoresVazios)
    onFechar()
  }

  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo="Novo cupom de desconto" largura="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="codigo">Código do cupom</Label>
          <Input
            id="codigo"
            value={valores.codigo}
            onChange={(e) => atualizarCampo('codigo', e.target.value.toUpperCase())}
            placeholder="Ex: BEMVINDO10"
            required
          />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Input
            id="descricao"
            value={valores.descricao}
            onChange={(e) => atualizarCampo('descricao', e.target.value)}
            placeholder="Ex: Promoção de aniversário da loja"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tipo">Tipo de desconto</Label>
            <Select id="tipo" value={valores.tipo} onChange={(e) => atualizarCampo('tipo', e.target.value as CupomFormValues['tipo'])}>
              <option value="percentual">Percentual (%)</option>
              <option value="valor_fixo">Valor fixo (R$)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="valor">{valores.tipo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}</Label>
            <Input
              id="valor"
              type="number"
              min={0}
              step={valores.tipo === 'percentual' ? 1 : 0.01}
              value={valores.valor}
              onChange={(e) => atualizarCampo('valor', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="validade">Validade (opcional)</Label>
            <Input id="validade" type="date" value={valores.validade} onChange={(e) => atualizarCampo('validade', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="limite">Limite de usos (total)</Label>
            <Input
              id="limite"
              type="number"
              min={0}
              placeholder="Ilimitado"
              value={valores.limite_uso ?? ''}
              onChange={(e) => atualizarCampo('limite_uso', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="limite_por_cliente">Limite de usos por cliente</Label>
          <Input
            id="limite_por_cliente"
            type="number"
            min={0}
            placeholder="Ilimitado (mesmo cliente pode usar várias vezes)"
            value={valores.limite_uso_por_cliente ?? ''}
            onChange={(e) => atualizarCampo('limite_uso_por_cliente', e.target.value ? Number(e.target.value) : null)}
          />
          <p className="mt-1 text-xs text-[var(--color-ink-400)]">Ex: 1 impede que o mesmo cliente use o cupom mais de uma vez.</p>
        </div>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Criar cupom'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
