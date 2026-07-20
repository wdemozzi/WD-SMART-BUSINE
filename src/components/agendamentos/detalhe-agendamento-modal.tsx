import { useState } from 'react'
import { Phone, Globe } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label, Input, Select } from '@/components/ui/form'
import { StatusBadge } from '@/components/ui/status-badge'
import { linkWhatsapp } from '@/hooks/use-notificacoes'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AgendamentoCompleto, StatusAgendamento } from '@/types/database'

function paraInputDatetimeLocal(iso: string) {
  const data = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

export function DetalheAgendamentoModal({
  agendamento,
  onFechar,
  aoAtualizarStatus,
  aoConcluirComPagamento,
  aoReagendar,
}: {
  agendamento: AgendamentoCompleto | null
  onFechar: () => void
  aoAtualizarStatus: (id: string, status: StatusAgendamento, motivo?: string) => Promise<unknown>
  aoConcluirComPagamento: (agendamento: AgendamentoCompleto, metodo: string) => Promise<unknown>
  aoReagendar: (id: string, novoInicio: Date, novoFim: Date) => Promise<unknown>
}) {
  const [modoReagendar, setModoReagendar] = useState(false)
  const [modoPagamento, setModoPagamento] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState('pix')
  const [novoInicio, setNovoInicio] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (!agendamento) return null

  const duracaoMs = new Date(agendamento.data_hora_fim).getTime() - new Date(agendamento.data_hora_inicio).getTime()

  async function mudarStatus(status: StatusAgendamento) {
    setCarregando(true)
    await aoAtualizarStatus(agendamento!.id, status)
    setCarregando(false)
    onFechar()
  }

  async function confirmarReagendamento() {
    if (!novoInicio) return
    setCarregando(true)
    const inicio = new Date(novoInicio)
    const fim = new Date(inicio.getTime() + duracaoMs)
    await aoReagendar(agendamento!.id, inicio, fim)
    setCarregando(false)
    setModoReagendar(false)
    onFechar()
  }

  async function confirmarConclusaoComPagamento() {
    setCarregando(true)
    await aoConcluirComPagamento(agendamento!, metodoPagamento)
    setCarregando(false)
    setModoPagamento(false)
    onFechar()
  }

  const podeAgir = !['cancelado', 'concluido', 'nao_compareceu'].includes(agendamento.status)
  const agendadoOnline = agendamento.origem === 'online'

  return (
    <Dialog aberto={!!agendamento} onFechar={onFechar} titulo="Detalhes do agendamento">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-base font-semibold text-[var(--color-ink-900)]">
              {agendamento.cliente_nome}
            </p>
            <p className="text-sm text-[var(--color-ink-600)]">{agendamento.servico_nome}</p>
            {agendamento.cliente_whatsapp && (
              <a
                href={linkWhatsapp(agendamento.cliente_whatsapp, '')}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1 text-xs text-[var(--color-ink-400)] hover:text-brand-500"
              >
                <Phone className="h-3 w-3" />
                {agendamento.cliente_whatsapp}
              </a>
            )}
            {agendadoOnline && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-info-50 px-2 py-0.5 text-[10px] font-medium text-info-500">
                <Globe className="h-2.5 w-2.5" />
                Agendado online
              </span>
            )}
          </div>
          <StatusBadge status={agendamento.status} />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--color-ink-400)]">Data e horário</dt>
            <dd className="font-data text-[var(--color-ink-900)]">
              {formatDate(agendamento.data_hora_inicio, true)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-ink-400)]">Profissional</dt>
            <dd className="text-[var(--color-ink-900)]">{agendamento.funcionario_nome ?? 'Sem preferência'}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-ink-400)]">Valor</dt>
            <dd className="font-data text-[var(--color-ink-900)]">
              {agendamento.valor != null ? formatCurrency(agendamento.valor) : '—'}
            </dd>
          </div>
        </dl>

        {modoReagendar ? (
          <div className="space-y-3 rounded-md border border-[var(--color-border)] p-3">
            <Label htmlFor="novo-inicio">Novo horário</Label>
            <Input
              id="novo-inicio"
              type="datetime-local"
              defaultValue={paraInputDatetimeLocal(agendamento.data_hora_inicio)}
              onChange={(e) => setNovoInicio(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModoReagendar(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={confirmarReagendamento} disabled={carregando}>
                Confirmar novo horário
              </Button>
            </div>
          </div>
        ) : modoPagamento ? (
          <div className="space-y-3 rounded-md border border-[var(--color-border)] p-3">
            <p className="text-sm text-[var(--color-ink-600)]">
              Confirmar conclusão do atendimento{agendamento.valor != null && agendamento.valor > 0 ? ` e lançar ${formatCurrency(agendamento.valor)} no fluxo de caixa` : ''}?
            </p>
            {agendamento.valor != null && agendamento.valor > 0 && (
              <div>
                <Label htmlFor="metodo-pagamento">Forma de pagamento</Label>
                <Select id="metodo-pagamento" value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)}>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModoPagamento(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={confirmarConclusaoComPagamento} disabled={carregando}>
                {carregando ? 'Confirmando…' : 'Confirmar conclusão'}
              </Button>
            </div>
          </div>
        ) : (
          podeAgir && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
              {agendamento.status === 'agendado' && (
                <Button size="sm" onClick={() => mudarStatus('confirmado')} disabled={carregando}>
                  Confirmar presença
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setModoPagamento(true)} disabled={carregando}>
                Marcar como concluído
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setModoReagendar(true)}>
                Reagendar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => mudarStatus('nao_compareceu')}
                disabled={carregando}
              >
                Não compareceu
              </Button>
              <Button size="sm" variant="destructive" onClick={() => mudarStatus('cancelado')} disabled={carregando}>
                Cancelar agendamento
              </Button>
            </div>
          )
        )}
      </div>
    </Dialog>
  )
}
