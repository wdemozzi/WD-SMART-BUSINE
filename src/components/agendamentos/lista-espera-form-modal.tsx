import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Select, Input, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Cliente, Servico, Funcionario } from '@/types/database'
import type { ListaEsperaFormValues } from '@/hooks/use-lista-espera'

export function ListaEsperaFormModal({
  aberto,
  onFechar,
  clientes,
  servicos,
  funcionarios,
  valoresIniciais,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  clientes: Cliente[]
  servicos: Servico[]
  funcionarios: Funcionario[]
  valoresIniciais?: Partial<ListaEsperaFormValues>
  aoSalvar: (valores: ListaEsperaFormValues) => Promise<unknown>
}) {
  const valoresVazios: ListaEsperaFormValues = {
    cliente_id: valoresIniciais?.cliente_id ?? '',
    servico_id: valoresIniciais?.servico_id ?? '',
    funcionario_id: valoresIniciais?.funcionario_id ?? null,
    data_desejada: valoresIniciais?.data_desejada ?? null,
    horario_desejado: valoresIniciais?.horario_desejado ?? '09:00',
    observacoes: valoresIniciais?.observacoes ?? '',
  }

  const [valores, setValores] = useState<ListaEsperaFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarCampo<K extends keyof ListaEsperaFormValues>(campo: K, valor: ListaEsperaFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.cliente_id || !valores.servico_id) {
      setErro('Selecione o cliente e o serviço.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível adicionar à lista de espera.')
      return
    }

    setValores(valoresVazios)
    onFechar()
  }

  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo="Adicionar à lista de espera" largura="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="le_cliente">Cliente</Label>
          <Select id="le_cliente" value={valores.cliente_id} onChange={(e) => atualizarCampo('cliente_id', e.target.value)} required>
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="le_servico">Serviço desejado</Label>
            <Select id="le_servico" value={valores.servico_id} onChange={(e) => atualizarCampo('servico_id', e.target.value)} required>
              <option value="">Selecione</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="le_funcionario">Profissional (opcional)</Label>
            <Select
              id="le_funcionario"
              value={valores.funcionario_id ?? ''}
              onChange={(e) => atualizarCampo('funcionario_id', e.target.value || null)}
            >
              <option value="">Qualquer um</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="le_data">Data desejada (opcional)</Label>
            <Input
              id="le_data"
              type="date"
              value={valores.data_desejada ?? ''}
              onChange={(e) => atualizarCampo('data_desejada', e.target.value || null)}
            />
          </div>
          <div>
            <Label htmlFor="le_horario">Horário desejado</Label>
            <Input
              id="le_horario"
              type="time"
              value={valores.horario_desejado}
              onChange={(e) => atualizarCampo('horario_desejado', e.target.value)}
              required
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-[var(--color-ink-400)]">
          Deixe a data em branco para avisar em qualquer dia que abrir vaga próxima desse horário.
        </p>

        <div>
          <Label htmlFor="le_obs">Observações (opcional)</Label>
          <Textarea id="le_obs" value={valores.observacoes} onChange={(e) => atualizarCampo('observacoes', e.target.value)} />
        </div>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Adicionando…' : 'Adicionar à lista'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
