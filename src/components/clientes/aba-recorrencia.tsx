import { MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { linkWhatsapp } from '@/hooks/use-notificacoes'
import { formatDate, cn } from '@/lib/utils'
import type { RecorrenciaCliente } from '@/hooks/use-recorrencia-clientes'

function mensagemVoltaAqui(nome: string) {
  const primeiroNome = nome.split(' ')[0]
  return `Olá ${primeiroNome}! Faz um tempinho que a gente não te vê por aqui 💜 Que tal voltar essa semana? Preparamos um desconto especial pra você. Me chama que eu te explico!`
}

function statusRecorrencia(dias: number | null) {
  if (dias == null) return { rotulo: 'Sem histórico', tom: 'neutro' as const }
  if (dias < 30) return { rotulo: 'Em dia', tom: 'sucesso' as const }
  if (dias < 60) return { rotulo: `${dias} dias sem aparecer`, tom: 'atencao' as const }
  return { rotulo: `${dias} dias sem aparecer`, tom: 'erro' as const }
}

const toneClasses = {
  neutro: 'bg-[var(--color-canvas)] text-[var(--color-ink-600)]',
  sucesso: 'bg-success-50 text-success-500',
  atencao: 'bg-warning-50 text-warning-500',
  erro: 'bg-danger-50 text-danger-500',
}

export function AbaRecorrencia({ clientes, carregando }: { clientes: RecorrenciaCliente[]; carregando: boolean }) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Última visita</th>
            <th className="px-4 py-3 font-medium">Total de atendimentos</th>
            <th className="px-4 py-3 font-medium">Recorrência</th>
            <th className="px-4 py-3 font-medium text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                Carregando…
              </td>
            </tr>
          ) : clientes.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                Nenhum cliente cadastrado ainda.
              </td>
            </tr>
          ) : (
            clientes.map((c) => {
              const status = statusRecorrencia(c.dias_sem_aparecer)
              return (
                <tr key={c.cliente_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{c.nome}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">
                    {c.ultima_visita ? formatDate(c.ultima_visita) : '—'}
                  </td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{c.total_atendimentos}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', toneClasses[status.tom])}>
                      {status.rotulo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.whatsapp && c.dias_sem_aparecer != null && c.dias_sem_aparecer >= 30 && (
                      <a
                        href={linkWhatsapp(c.whatsapp, mensagemVoltaAqui(c.nome))}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-success-50 px-2.5 py-1 text-xs font-medium text-success-500 hover:bg-success-500/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Reengajar
                      </a>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </Card>
  )
}
