import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Select, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { PacoteFormValues } from '@/hooks/use-pacotes'
import type { Servico } from '@/types/database'

const valoresVazios: PacoteFormValues = {
  nome: '',
  descricao: '',
  valor_total: 0,
  validade_dias: null,
  ativo: true,
  itens: [{ servico_id: '', quantidade: 1 }],
}

export function PacoteFormModal({
  aberto,
  onFechar,
  servicos,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  servicos: Servico[]
  aoSalvar: (valores: PacoteFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<PacoteFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarCampo<K extends keyof PacoteFormValues>(campo: K, valor: PacoteFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  function atualizarItem(indice: number, campo: 'servico_id' | 'quantidade', valor: string | number) {
    setValores((v) => ({
      ...v,
      itens: v.itens.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it)),
    }))
  }

  function adicionarItem() {
    setValores((v) => ({ ...v, itens: [...v.itens, { servico_id: '', quantidade: 1 }] }))
  }

  function removerItem(indice: number) {
    setValores((v) => ({ ...v, itens: v.itens.filter((_, i) => i !== indice) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.nome.trim() || valores.valor_total <= 0) {
      setErro('Informe o nome e um valor total maior que zero.')
      return
    }

    if (valores.itens.every((i) => !i.servico_id)) {
      setErro('Adicione pelo menos um serviço ao pacote.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível criar o pacote.')
      return
    }

    setValores(valoresVazios)
    onFechar()
  }

  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo="Novo pacote de serviços" largura="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome do pacote</Label>
          <Input
            id="nome"
            value={valores.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            placeholder="Ex: Pacote 10 cortes"
            required
          />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Textarea id="descricao" value={valores.descricao} onChange={(e) => atualizarCampo('descricao', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="valor_total">Valor total (R$)</Label>
            <Input
              id="valor_total"
              type="number"
              min={0}
              step="0.01"
              value={valores.valor_total}
              onChange={(e) => atualizarCampo('valor_total', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="validade_dias">Validade (dias, opcional)</Label>
            <Input
              id="validade_dias"
              type="number"
              min={0}
              placeholder="Sem validade"
              value={valores.validade_dias ?? ''}
              onChange={(e) => atualizarCampo('validade_dias', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <div>
          <Label>Serviços incluídos</Label>
          <div className="space-y-2">
            {valores.itens.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={item.servico_id}
                  onChange={(e) => atualizarItem(i, 'servico_id', e.target.value)}
                  className="flex-1"
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={item.quantidade}
                  onChange={(e) => atualizarItem(i, 'quantidade', Number(e.target.value))}
                  className="w-20"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removerItem(i)}>
                  <Trash2 className="h-4 w-4 text-danger-500" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={adicionarItem}>
            <Plus className="h-4 w-4" />
            Adicionar serviço
          </Button>
        </div>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Criar pacote'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
