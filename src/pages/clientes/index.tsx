import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, Award, Package } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useClientes } from '@/hooks/use-clientes'
import { useRecorrenciaClientes } from '@/hooks/use-recorrencia-clientes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { ClienteFormModal } from '@/components/clientes/cliente-form-modal'
import { AbaRecorrencia } from '@/components/clientes/aba-recorrencia'
import { AbaOcorrencias } from '@/components/clientes/aba-ocorrencias'
import { FidelidadeClienteModal } from '@/components/clientes/fidelidade-cliente-modal'
import { VenderPacoteModal } from '@/components/clientes/vender-pacote-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate } from '@/lib/utils'
import type { Cliente } from '@/types/database'

type AbaClientes = 'todos' | 'recorrencia' | 'ocorrencias'

export function ClientesPage() {
  const { empresa } = useAuth()
  const { clientes, carregando, erro, criar, atualizar, excluir } = useClientes(empresa?.id)
  const { clientes: recorrencia, inativos, carregando: carregandoRecorrencia } = useRecorrenciaClientes(empresa?.id)
  const [aba, setAba] = useState<AbaClientes>('todos')
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null)
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null)
  const [clienteFidelidade, setClienteFidelidade] = useState<Cliente | null>(null)
  const [clientePacote, setClientePacote] = useState<Cliente | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const clientesFiltrados = clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))

  function abrirNovo() {
    setClienteEmEdicao(null)
    setModalAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEmEdicao(cliente)
    setModalAberto(true)
  }

  async function confirmarExclusao() {
    if (!clienteParaExcluir) return
    setExcluindo(true)
    await excluir(clienteParaExcluir.id)
    setExcluindo(false)
    setClienteParaExcluir(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Clientes</h1>
          <p className="text-sm text-[var(--color-ink-400)]">
            {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
            {inativos.length > 0 && ` · ${inativos.length} sem aparecer há 30+ dias`}
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <Tabs
        abas={[
          { valor: 'todos', rotulo: 'Todos' },
          { valor: 'recorrencia', rotulo: 'Recorrência' },
          { valor: 'ocorrencias', rotulo: 'Ocorrências' },
        ]}
        ativa={aba}
        onChange={setAba}
      />

      {aba === 'todos' ? (
        <>
          <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:max-w-xs">
            <Search className="h-4 w-4 text-[var(--color-ink-400)]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-400)]"
            />
          </div>

          {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Cidade</th>
                  <th className="px-4 py-3 font-medium">Cliente desde</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                      Carregando clientes…
                    </td>
                  </tr>
                ) : clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                      Nenhum cliente encontrado. Cadastre o primeiro para começar.
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{cliente.nome}</td>
                      <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{cliente.whatsapp ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-600)]">{cliente.cidade ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-600)]">{formatDate(cliente.criado_em)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Pacotes" onClick={() => setClientePacote(cliente)}>
                            <Package className="h-4 w-4 text-brand-500" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Fidelidade" onClick={() => setClienteFidelidade(cliente)}>
                            <Award className="h-4 w-4 text-brand-500" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => abrirEdicao(cliente)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir"
                            onClick={() => setClienteParaExcluir(cliente)}
                          >
                            <Trash2 className="h-4 w-4 text-danger-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      ) : aba === 'recorrencia' ? (
        <AbaRecorrencia clientes={recorrencia} carregando={carregandoRecorrencia} />
      ) : (
        <AbaOcorrencias empresaId={empresa?.id} />
      )}

      <ClienteFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        clienteEmEdicao={clienteEmEdicao}
        aoSalvar={(valores) =>
          clienteEmEdicao ? atualizar(clienteEmEdicao.id, valores) : criar(valores)
        }
      />

      <ConfirmDialog
        aberto={!!clienteParaExcluir}
        onFechar={() => setClienteParaExcluir(null)}
        titulo="Excluir cliente"
        mensagem={`Tem certeza que deseja excluir "${clienteParaExcluir?.nome}"? Essa ação também remove o histórico e os agendamentos vinculados a ele.`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />

      <FidelidadeClienteModal cliente={clienteFidelidade} onFechar={() => setClienteFidelidade(null)} />
      <VenderPacoteModal cliente={clientePacote} onFechar={() => setClientePacote(null)} />
    </div>
  )
}
