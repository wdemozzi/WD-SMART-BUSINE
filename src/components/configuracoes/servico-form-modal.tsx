import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Servico } from '@/types/database'
import type { ServicoFormValues } from '@/hooks/use-servicos'

const valoresVazios: ServicoFormValues = {
  nome: '',
  descricao: '',
  valor: 0,
  duracao_minutos: 30,
  categoria: '',
  ativo: true,
}

export function ServicoFormModal({
  aberto,
  onFechar,
  servicoEmEdicao,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  servicoEmEdicao: Servico | null
  aoSalvar: (valores: ServicoFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<ServicoFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    if (servicoEmEdicao) {
      setValores({
        nome: servicoEmEdicao.nome,
        descricao: (servicoEmEdicao as unknown as { descricao?: string }).descricao ?? '',
        valor: servicoEmEdicao.valor,
        duracao_minutos: servicoEmEdicao.duracao_minutos,
        categoria: servicoEmEdicao.categoria ?? '',
        ativo: servicoEmEdicao.ativo,
      })
    } else {
      setValores(valoresVazios)
    }
    setErro(null)
  }, [aberto, servicoEmEdicao])

  function atualizarCampo<K extends keyof ServicoFormValues>(campo: K, valor: ServicoFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.nome.trim()) {
      setErro('O nome do serviço é obrigatório.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível salvar o serviço.')
      return
    }

    onFechar()
  }

  return (
    <Dialog
      aberto={aberto}
      onFechar={onFechar}
      titulo={servicoEmEdicao ? 'Editar serviço' : 'Novo serviço'}
      largura="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome do serviço</Label>
          <Input
            id="nome"
            value={valores.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            placeholder="Ex: Corte de cabelo"
            required
          />
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
            <Label htmlFor="duracao">Duração (min)</Label>
            <Input
              id="duracao"
              type="number"
              min={5}
              step={5}
              value={valores.duracao_minutos}
              onChange={(e) => atualizarCampo('duracao_minutos', Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            value={valores.categoria}
            onChange={(e) => atualizarCampo('categoria', e.target.value)}
            placeholder="Ex: Cabelo, Estética, Consulta…"
          />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" value={valores.descricao} onChange={(e) => atualizarCampo('descricao', e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-900)]">
          <input
            type="checkbox"
            checked={valores.ativo}
            onChange={(e) => atualizarCampo('ativo', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
          />
          Serviço ativo (aparece na agenda e no agendamento online)
        </label>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : servicoEmEdicao ? 'Salvar alterações' : 'Criar serviço'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
