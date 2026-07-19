import { useMemo, useState } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Tag, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useProdutos } from '@/hooks/use-produtos'
import { useCadastrosAgenda } from '@/hooks/use-cadastros-agenda'
import { previsualizarCupom } from '@/hooks/use-cupons'
import { registrarVenda } from '@/hooks/use-vendas'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'
import type { Produto } from '@/types/database'

interface ItemCarrinho {
  produto: Produto
  quantidade: number
}

export function PdvPage() {
  const { empresa, perfil } = useAuth()
  const { produtos, carregando, recarregar } = useProdutos(empresa?.id)
  const { clientes, funcionarios } = useCadastrosAgenda(empresa?.id)

  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [clienteId, setClienteId] = useState('')
  const [funcionarioId, setFuncionarioId] = useState('')
  const [metodo, setMetodo] = useState('pix')
  const [codigoCupom, setCodigoCupom] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; desconto: number } | null>(null)
  const [erroCupom, setErroCupom] = useState<string | null>(null)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [erroVenda, setErroVenda] = useState<string | null>(null)
  const [sucessoVenda, setSucessoVenda] = useState<number | null>(null)

  const produtosFiltrados = produtos.filter(
    (p) => p.ativo && p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const valorBruto = useMemo(
    () => carrinho.reduce((soma, item) => soma + item.produto.preco_venda * item.quantidade, 0),
    [carrinho]
  )
  const valorTotal = Math.max(valorBruto - (cupomAplicado?.desconto ?? 0), 0)

  function adicionarAoCarrinho(produto: Produto) {
    setSucessoVenda(null)
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id)
      if (existente) {
        if (existente.quantidade >= produto.quantidade_estoque) return atual
        return atual.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
      }
      return [...atual, { produto, quantidade: 1 }]
    })
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((atual) =>
      atual.map((i) =>
        i.produto.id === produtoId
          ? { ...i, quantidade: Math.min(Math.max(i.quantidade + delta, 1), i.produto.quantidade_estoque) }
          : i
      )
    )
  }

  function removerDoCarrinho(produtoId: string) {
    setCarrinho((atual) => atual.filter((i) => i.produto.id !== produtoId))
  }

  async function handleAplicarCupom() {
    if (!codigoCupom.trim() || !empresa?.id) return
    setValidandoCupom(true)
    setErroCupom(null)

    const resultado = await previsualizarCupom(empresa.id, codigoCupom.trim(), valorBruto, clienteId || null)
    setValidandoCupom(false)

    if (!resultado.valido) {
      setErroCupom(resultado.mensagem)
      setCupomAplicado(null)
      return
    }

    setCupomAplicado({ codigo: codigoCupom.trim().toUpperCase(), desconto: resultado.desconto })
  }

  function removerCupom() {
    setCupomAplicado(null)
    setCodigoCupom('')
    setErroCupom(null)
  }

  async function finalizarVenda() {
    if (!empresa?.id || carrinho.length === 0) return
    setFinalizando(true)
    setErroVenda(null)

    const resultado = await registrarVenda({
      empresaId: empresa.id,
      clienteId: clienteId || null,
      funcionarioId: funcionarioId || null,
      metodo,
      cupomCodigo: cupomAplicado?.codigo ?? null,
      criadoPor: perfil?.id ?? null,
      itens: carrinho.map((i) => ({ produto_id: i.produto.id, quantidade: i.quantidade })),
    })

    setFinalizando(false)

    if (resultado.mensagem_erro) {
      setErroVenda(resultado.mensagem_erro)
      return
    }

    setSucessoVenda(resultado.valor_total)
    setCarrinho([])
    setClienteId('')
    setFuncionarioId('')
    removerCupom()
    await recarregar()
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Grade de produtos */}
      <div className="space-y-4 lg:col-span-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">PDV</h1>
          <p className="text-sm text-[var(--color-ink-400)]">Clique em um produto para adicionar ao carrinho.</p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <Search className="h-4 w-4 text-[var(--color-ink-400)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-400)]"
          />
        </div>

        {carregando ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-[var(--color-border)]/30" />
            ))}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-ink-400)]">
            Nenhum produto ativo encontrado. Cadastre produtos em Configurações → Produtos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {produtosFiltrados.map((p) => {
              const semEstoque = p.quantidade_estoque <= 0
              return (
                <button
                  key={p.id}
                  onClick={() => adicionarAoCarrinho(p)}
                  disabled={semEstoque}
                  className="flex flex-col items-start gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <p className="text-sm font-medium text-[var(--color-ink-900)]">{p.nome}</p>
                  <p className="font-data text-sm text-brand-600">{formatCurrency(p.preco_venda)}</p>
                  <p className="text-xs text-[var(--color-ink-400)]">
                    {semEstoque ? 'Sem estoque' : `${p.quantidade_estoque} em estoque`}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Carrinho */}
      <Card className="flex h-fit flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-brand-500" />
          <h2 className="font-display text-base font-semibold text-[var(--color-ink-900)]">Carrinho</h2>
        </div>

        {carrinho.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-400)]">Carrinho vazio</p>
        ) : (
          <div className="space-y-2">
            {carrinho.map((item) => (
              <div key={item.produto.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-ink-900)]">{item.produto.nome}</p>
                  <p className="font-data text-xs text-[var(--color-ink-400)]">
                    {formatCurrency(item.produto.preco_venda)} un.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => alterarQuantidade(item.produto.id, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-5 text-center font-data">{item.quantidade}</span>
                  <Button variant="ghost" size="icon" onClick={() => alterarQuantidade(item.produto.id, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removerDoCarrinho(item.produto.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-danger-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Venda avulsa (sem cliente)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>

          <Select value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
            <option value="">Sem vendedor</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>

          {cupomAplicado ? (
            <div className="flex items-center justify-between rounded-md border border-success-500/30 bg-success-50 px-2.5 py-1.5 text-xs">
              <span className="flex items-center gap-1 font-medium text-success-500">
                <Tag className="h-3 w-3" />
                {cupomAplicado.codigo} · -{formatCurrency(cupomAplicado.desconto)}
              </span>
              <button onClick={removerCupom} aria-label="Remover cupom">
                <X className="h-3.5 w-3.5 text-success-500" />
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input
                value={codigoCupom}
                onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                placeholder="Cupom"
                disabled={carrinho.length === 0}
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAplicarCupom}
                disabled={carrinho.length === 0 || validandoCupom}
              >
                {validandoCupom ? '…' : 'Aplicar'}
              </Button>
            </div>
          )}
          {erroCupom && <p className="text-xs text-danger-500">{erroCupom}</p>}

          <Select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="boleto">Boleto</option>
            <option value="outro">Outro</option>
          </Select>
        </div>

        <div className="space-y-1 border-t border-[var(--color-border)] pt-3 text-sm">
          <div className="flex justify-between text-[var(--color-ink-600)]">
            <span>Subtotal</span>
            <span className="font-data">{formatCurrency(valorBruto)}</span>
          </div>
          {cupomAplicado && (
            <div className="flex justify-between text-success-500">
              <span>Desconto</span>
              <span className="font-data">- {formatCurrency(cupomAplicado.desconto)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-base font-semibold text-[var(--color-ink-900)]">
            <span>Total</span>
            <span className="font-data">{formatCurrency(valorTotal)}</span>
          </div>
        </div>

        {erroVenda && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erroVenda}</p>}
        {sucessoVenda != null && (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">
            Venda registrada: {formatCurrency(sucessoVenda)}
          </p>
        )}

        <Button className="w-full" disabled={carrinho.length === 0 || finalizando} onClick={finalizarVenda}>
          {finalizando ? 'Finalizando…' : 'Finalizar venda'}
        </Button>
      </Card>
    </div>
  )
}
