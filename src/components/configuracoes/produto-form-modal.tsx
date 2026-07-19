import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Produto } from '@/types/database'
import type { ProdutoFormValues } from '@/hooks/use-produtos'

const valoresVazios: ProdutoFormValues = {
  nome: '',
  descricao: '',
  categoria: '',
  codigo_barras: '',
  preco_custo: 0,
  preco_venda: 0,
  quantidade_estoque: 0,
  estoque_minimo: 0,
  ativo: true,
}

export function ProdutoFormModal({
  aberto,
  onFechar,
  produtoEmEdicao,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  produtoEmEdicao: Produto | null
  aoSalvar: (valores: ProdutoFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<ProdutoFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    if (produtoEmEdicao) {
      setValores({
        nome: produtoEmEdicao.nome,
        descricao: produtoEmEdicao.descricao ?? '',
        categoria: produtoEmEdicao.categoria ?? '',
        codigo_barras: produtoEmEdicao.codigo_barras ?? '',
        preco_custo: produtoEmEdicao.preco_custo,
        preco_venda: produtoEmEdicao.preco_venda,
        quantidade_estoque: produtoEmEdicao.quantidade_estoque,
        estoque_minimo: produtoEmEdicao.estoque_minimo,
        ativo: produtoEmEdicao.ativo,
      })
    } else {
      setValores(valoresVazios)
    }
    setErro(null)
  }, [aberto, produtoEmEdicao])

  function atualizarCampo<K extends keyof ProdutoFormValues>(campo: K, valor: ProdutoFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.nome.trim()) {
      setErro('O nome do produto é obrigatório.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível salvar o produto.')
      return
    }

    onFechar()
  }

  return (
    <Dialog
      aberto={aberto}
      onFechar={onFechar}
      titulo={produtoEmEdicao ? 'Editar produto' : 'Novo produto'}
      largura="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome do produto</Label>
          <Input
            id="nome"
            value={valores.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            placeholder="Ex: Pomada modeladora"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={valores.categoria}
              onChange={(e) => atualizarCampo('categoria', e.target.value)}
              placeholder="Ex: Cabelo, Bebidas…"
            />
          </div>
          <div>
            <Label htmlFor="codigo_barras">Código de barras</Label>
            <Input
              id="codigo_barras"
              value={valores.codigo_barras}
              onChange={(e) => atualizarCampo('codigo_barras', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="preco_custo">Preço de custo (R$)</Label>
            <Input
              id="preco_custo"
              type="number"
              min={0}
              step="0.01"
              value={valores.preco_custo}
              onChange={(e) => atualizarCampo('preco_custo', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="preco_venda">Preço de venda (R$)</Label>
            <Input
              id="preco_venda"
              type="number"
              min={0}
              step="0.01"
              value={valores.preco_venda}
              onChange={(e) => atualizarCampo('preco_venda', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="quantidade_estoque">Estoque atual</Label>
            <Input
              id="quantidade_estoque"
              type="number"
              min={0}
              value={valores.quantidade_estoque}
              onChange={(e) => atualizarCampo('quantidade_estoque', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="estoque_minimo">Estoque mínimo (alerta)</Label>
            <Input
              id="estoque_minimo"
              type="number"
              min={0}
              value={valores.estoque_minimo}
              onChange={(e) => atualizarCampo('estoque_minimo', Number(e.target.value))}
            />
          </div>
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
          Produto ativo (aparece no PDV)
        </label>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : produtoEmEdicao ? 'Salvar alterações' : 'Criar produto'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
