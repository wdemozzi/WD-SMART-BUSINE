import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { PlanoFormValues } from '@/hooks/use-super-admin'

const valoresVazios: PlanoFormValues = {
  nome: '',
  descricao: '',
  valor_mensal: 0,
  valor_anual: null,
  limite_usuarios: null,
  limite_clientes: null,
  ia_incluida: false,
  ativo: true,
}

export function PlanoFormModal({
  aberto,
  onFechar,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  aoSalvar: (valores: PlanoFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<PlanoFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarCampo<K extends keyof PlanoFormValues>(campo: K, valor: PlanoFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.nome.trim()) {
      setErro('Informe o nome do plano.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível criar o plano.')
      return
    }

    setValores(valoresVazios)
    onFechar()
  }

  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo="Novo plano" largura="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome do plano</Label>
          <Input id="nome" value={valores.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} placeholder="Ex: Pro" required />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" value={valores.descricao} onChange={(e) => atualizarCampo('descricao', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="valor_mensal">Valor mensal (R$)</Label>
            <Input
              id="valor_mensal"
              type="number"
              min={0}
              step="0.01"
              value={valores.valor_mensal}
              onChange={(e) => atualizarCampo('valor_mensal', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="valor_anual">Valor anual (opcional)</Label>
            <Input
              id="valor_anual"
              type="number"
              min={0}
              step="0.01"
              value={valores.valor_anual ?? ''}
              onChange={(e) => atualizarCampo('valor_anual', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="limite_usuarios">Limite de usuários</Label>
            <Input
              id="limite_usuarios"
              type="number"
              min={0}
              placeholder="Ilimitado"
              value={valores.limite_usuarios ?? ''}
              onChange={(e) => atualizarCampo('limite_usuarios', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="limite_clientes">Limite de clientes</Label>
            <Input
              id="limite_clientes"
              type="number"
              min={0}
              placeholder="Ilimitado"
              value={valores.limite_clientes ?? ''}
              onChange={(e) => atualizarCampo('limite_clientes', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-900)]">
          <input
            type="checkbox"
            checked={valores.ia_incluida}
            onChange={(e) => atualizarCampo('ia_incluida', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
          />
          Inclui assistente de IA
        </label>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Criar plano'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
