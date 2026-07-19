import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Funcionario } from '@/types/database'
import type { FuncionarioFormValues } from '@/hooks/use-funcionarios'

const valoresVazios: FuncionarioFormValues = {
  nome: '',
  telefone: '',
  email: '',
  cargo: '',
  ativo: true,
  percentual_comissao: null,
}

export function FuncionarioFormModal({
  aberto,
  onFechar,
  funcionarioEmEdicao,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  funcionarioEmEdicao: Funcionario | null
  aoSalvar: (valores: FuncionarioFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<FuncionarioFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    if (funcionarioEmEdicao) {
      setValores({
        nome: funcionarioEmEdicao.nome,
        telefone: (funcionarioEmEdicao as unknown as { telefone?: string }).telefone ?? '',
        email: (funcionarioEmEdicao as unknown as { email?: string }).email ?? '',
        cargo: funcionarioEmEdicao.cargo ?? '',
        ativo: funcionarioEmEdicao.ativo,
        percentual_comissao: funcionarioEmEdicao.percentual_comissao,
      })
    } else {
      setValores(valoresVazios)
    }
    setErro(null)
  }, [aberto, funcionarioEmEdicao])

  function atualizarCampo<K extends keyof FuncionarioFormValues>(campo: K, valor: FuncionarioFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.nome.trim()) {
      setErro('O nome do profissional é obrigatório.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível salvar o profissional.')
      return
    }

    onFechar()
  }

  return (
    <Dialog
      aberto={aberto}
      onFechar={onFechar}
      titulo={funcionarioEmEdicao ? 'Editar profissional' : 'Novo profissional'}
      largura="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" value={valores.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="cargo">Cargo</Label>
          <Input
            id="cargo"
            value={valores.cargo}
            onChange={(e) => atualizarCampo('cargo', e.target.value)}
            placeholder="Ex: Cabeleireiro, Veterinário, Advogado…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={valores.telefone} onChange={(e) => atualizarCampo('telefone', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={valores.email} onChange={(e) => atualizarCampo('email', e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="percentual_comissao">Comissão (% sobre atendimentos e vendas)</Label>
          <Input
            id="percentual_comissao"
            type="number"
            min={0}
            max={100}
            step="0.5"
            placeholder="Sem comissão"
            value={valores.percentual_comissao ?? ''}
            onChange={(e) => atualizarCampo('percentual_comissao', e.target.value ? Number(e.target.value) : null)}
          />
          <p className="mt-1 text-xs text-[var(--color-ink-400)]">
            Calculada automaticamente quando um atendimento é concluído por este profissional na Agenda.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-900)]">
          <input
            type="checkbox"
            checked={valores.ativo}
            onChange={(e) => atualizarCampo('ativo', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
          />
          Profissional ativo (aparece na agenda)
        </label>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : funcionarioEmEdicao ? 'Salvar alterações' : 'Criar profissional'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
