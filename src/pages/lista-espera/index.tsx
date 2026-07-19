import { useState } from 'react'
import { Plus, Trash2, MessageCircle, Clock3 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useListaEspera } from '@/hooks/use-lista-espera'
import { useCadastrosAgenda } from '@/hooks/use-cadastros-agenda'
import { linkWhatsapp } from '@/hooks/use-notificacoes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListaEsperaFormModal } from '@/components/agendamentos/lista-espera-form-modal'
import { formatDate } from '@/lib/utils'
import type { ListaEspera } from '@/types/database'

function mensagemVagaAberta(nome: string, servico: string) {
  const primeiroNome = nome.split(' ')[0]
  return `Olá ${primeiroNome}! Abriu uma vaga para "${servico}" aqui — você ainda quer agendar? Me chama pra confirmar o horário!`
}

const rotuloStatus: Record<ListaEspera['status'], { texto: string; cor: string }> = {
  aguardando: { texto: 'Aguardando', cor: 'bg-[var(--color-canvas)] text-[var(--color-ink-600)]' },
  notificado: { texto: 'Vaga avisada', cor: 'bg-success-50 text-success-500' },
  atendido: { texto: 'Atendido', cor: 'bg-info-50 text-info-500' },
  cancelado: { texto: 'Cancelado', cor: 'bg-danger-50 text-danger-500' },
}

export function ListaEsperaPage() {
  const { empresa } = useAuth()
  const { entradas, carregando, adicionar, atualizarStatus, excluir } = useListaEspera(empresa?.id)
  const { clientes, servicos, funcionarios } = useCadastrosAgenda(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)

  function whatsappDoCliente(clienteId: string) {
    return clientes.find((c) => c.id === clienteId)?.whatsapp ?? null
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Lista de espera</h1>
          <p className="text-sm text-[var(--color-ink-400)]">
            Quando um agendamento é cancelado, o próximo da fila para aquele serviço é avisado automaticamente (veja o sininho).
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Adicionar à lista
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Profissional</th>
              <th className="px-4 py-3 font-medium">Data desejada</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                  Carregando…
                </td>
              </tr>
            ) : entradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-ink-400)]">
                  <Clock3 className="mx-auto mb-2 h-5 w-5" />
                  Ninguém na lista de espera no momento.
                </td>
              </tr>
            ) : (
              entradas.map((e) => {
                const numero = whatsappDoCliente(e.cliente_id)
                return (
                  <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                    <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{e.cliente_nome}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-600)]">{e.servico_nome}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-600)]">{e.funcionario_nome ?? 'Qualquer um'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-600)]">
                      {e.data_desejada ? formatDate(e.data_desejada) : 'Qualquer dia'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rotuloStatus[e.status].cor}`}>
                        {rotuloStatus[e.status].texto}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {(e.status === 'aguardando' || e.status === 'notificado') && (
                          <>
                            {numero && (
                              <a
                                href={linkWhatsapp(numero, mensagemVagaAberta(e.cliente_nome ?? '', e.servico_nome ?? ''))}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-md p-2 text-success-500 hover:bg-success-50"
                                aria-label="Chamar no WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Marcar como atendido"
                              onClick={() => atualizarStatus(e.id, 'atendido')}
                            >
                              <Clock3 className="h-4 w-4 text-success-500" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => excluir(e.id)}>
                          <Trash2 className="h-4 w-4 text-danger-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Card>

      <ListaEsperaFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        clientes={clientes}
        servicos={servicos}
        funcionarios={funcionarios}
        aoSalvar={adicionar}
      />
    </div>
  )
}
