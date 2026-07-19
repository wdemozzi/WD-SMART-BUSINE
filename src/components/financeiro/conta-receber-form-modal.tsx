import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Cliente } from '@/types/database'
import type { ContaReceberFormValues } from '@/hooks/use-contas-receber'

const valoresVazios: ContaReceberFormValues = {
  descricao: '',
  valor: 0,
  vencimento: new Date().toISOString().slice(0, 10),
  cliente_id: null,
}

export function ContaReceberFormModal({
  aberto,
  onFechar,
  clientes,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  clientes: Cliente[]
  aoSalvar: (valores: ContaReceberFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<ContaReceberFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarCampo<K extends keyof ContaReceberFormValues>(campo: K, valor: ContaReceberFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.descricao.trim() || valores.valor <= 0) {
      setErro('Preencha a descrição e um valor maior que zero.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível salvar. Tente novamente.')
      return
    }

    setValores(valoresVazios)
    onFechar()
  }

  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo="Nova conta a receber" largura="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            value={valores.descricao}
            onChange={(e) => atualizarCampo('descricao', e.target.value)}
            placeholder="Ex: Mensalidade, pacote de sessões…"
            required
          />
        </div>

        <div>
          <Label htmlFor="cliente">Cliente (opcional)</Label>
          <Select
            id="cliente"
            value={valores.cliente_id ?? ''}
            onChange={(e) => atualizarCampo('cliente_id', e.target.value || null)}
          >
            <option value="">Sem cliente vinculado</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              min={0}
              step="0.01"
              value={valores.valor}
              onChange={(e) => atualizarCampo('valor', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="vencimento">Vencimento</Label>
            <Input
              id="vencimento"
              type="date"
              value={valores.vencimento}
              onChange={(e) => atualizarCampo('vencimento', e.target.value)}
            />
          </div>
        </div>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Criar conta'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
