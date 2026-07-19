import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Award } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFidelidadeConfig, useFidelidadeRecompensas } from '@/hooks/use-fidelidade'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label, Input } from '@/components/ui/form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { FidelidadeConfig, FidelidadeRecompensa } from '@/types/database'

export function AbaFidelidade() {
  const { empresa } = useAuth()
  const { config, carregando, salvar } = useFidelidadeConfig(empresa?.id)
  const { recompensas, carregando: carregandoRecompensas, criar, excluir } = useFidelidadeRecompensas(empresa?.id)

  const [form, setForm] = useState<Omit<FidelidadeConfig, 'empresa_id'> | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const [nomeRecompensa, setNomeRecompensa] = useState('')
  const [pontosRecompensa, setPontosRecompensa] = useState(100)
  const [recompensaParaExcluir, setRecompensaParaExcluir] = useState<FidelidadeRecompensa | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    if (config) setForm({ ativo: config.ativo, pontos_por_real: config.pontos_por_real, descricao: config.descricao })
  }, [config])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSalvando(true)
    const erro = await salvar(form)
    setSalvando(false)
    setSucesso(!erro)
  }

  async function handleCriarRecompensa(e: FormEvent) {
    e.preventDefault()
    if (!nomeRecompensa.trim()) return
    await criar({ nome: nomeRecompensa, pontos_necessarios: pontosRecompensa, ativo: true })
    setNomeRecompensa('')
    setPontosRecompensa(100)
  }

  async function confirmarExclusao() {
    if (!recompensaParaExcluir) return
    setExcluindo(true)
    await excluir(recompensaParaExcluir.id)
    setExcluindo(false)
    setRecompensaParaExcluir(null)
  }

  if (carregando || !form) {
    return <div className="h-64 animate-pulse rounded-lg bg-[var(--color-border)]/30" />
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink-900)]">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => {
                  setForm({ ...form, ativo: e.target.checked })
                  setSucesso(false)
                }}
                className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
              />
              Programa de fidelidade ativo
            </label>

            <div>
              <Label htmlFor="pontos_por_real">Pontos ganhos por R$1 gasto</Label>
              <Input
                id="pontos_por_real"
                type="number"
                min={0}
                step="0.1"
                value={form.pontos_por_real}
                onChange={(e) => {
                  setForm({ ...form, pontos_por_real: Number(e.target.value) })
                  setSucesso(false)
                }}
              />
              <p className="mt-1 text-xs text-[var(--color-ink-400)]">
                Pontos são creditados automaticamente quando um atendimento é concluído na Agenda ou uma venda é
                feita no PDV.
              </p>
            </div>

            <div>
              <Label htmlFor="descricao">Como explicar a regra pro cliente (opcional)</Label>
              <Input
                id="descricao"
                value={form.descricao ?? ''}
                onChange={(e) => {
                  setForm({ ...form, descricao: e.target.value })
                  setSucesso(false)
                }}
                placeholder="Ex: A cada real gasto, você ganha 1 ponto para trocar por recompensas!"
              />
            </div>

            {sucesso && <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">Configuração salva.</p>}

            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar configuração'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-display text-base font-semibold text-[var(--color-ink-900)]">Recompensas</h3>

        <form onSubmit={handleCriarRecompensa} className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1">
            <Label htmlFor="nome_recompensa">Nome</Label>
            <Input
              id="nome_recompensa"
              value={nomeRecompensa}
              onChange={(e) => setNomeRecompensa(e.target.value)}
              placeholder="Ex: Corte grátis"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="pontos_recompensa">Pontos</Label>
            <Input
              id="pontos_recompensa"
              type="number"
              min={1}
              value={pontosRecompensa}
              onChange={(e) => setPontosRecompensa(Number(e.target.value))}
            />
          </div>
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </form>

        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
              <tr>
                <th className="px-4 py-3 font-medium">Recompensa</th>
                <th className="px-4 py-3 font-medium">Pontos necessários</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregandoRecompensas ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                    Carregando…
                  </td>
                </tr>
              ) : recompensas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-ink-400)]">
                    Nenhuma recompensa cadastrada ainda.
                  </td>
                </tr>
              ) : (
                recompensas.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-[var(--color-ink-900)]">
                        <Award className="h-3.5 w-3.5 text-brand-500" />
                        {r.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{r.pontos_necessarios} pts</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setRecompensaParaExcluir(r)}>
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <ConfirmDialog
        aberto={!!recompensaParaExcluir}
        onFechar={() => setRecompensaParaExcluir(null)}
        titulo="Excluir recompensa"
        mensagem={`Tem certeza que deseja excluir "${recompensaParaExcluir?.nome}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />
    </div>
  )
}
