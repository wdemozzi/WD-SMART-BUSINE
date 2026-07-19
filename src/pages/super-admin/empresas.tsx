import { useState } from 'react'
import { Building2, Plus, Search } from 'lucide-react'
import { useSuperAdminEmpresas, usePlanos } from '@/hooks/use-super-admin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Select } from '@/components/ui/form'
import { PlanoFormModal } from '@/components/super-admin/plano-form-modal'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { EmpresaSuperAdmin } from '@/hooks/use-super-admin'

type AbaSuperAdmin = 'empresas' | 'planos'

const statusOpcoes: EmpresaSuperAdmin['status'][] = ['trial', 'ativa', 'inadimplente', 'suspensa', 'cancelada']

const corStatus: Record<EmpresaSuperAdmin['status'], string> = {
  trial: 'bg-info-50 text-info-500',
  ativa: 'bg-success-50 text-success-500',
  inadimplente: 'bg-warning-50 text-warning-500',
  suspensa: 'bg-danger-50 text-danger-500',
  cancelada: 'bg-[var(--color-canvas)] text-[var(--color-ink-400)]',
}

function AbaEmpresas() {
  const { empresas, carregando, erro, alterarStatus } = useSuperAdminEmpresas()
  const [busca, setBusca] = useState('')

  const filtradas = empresas.filter((e) => e.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:max-w-xs">
        <Search className="h-4 w-4 text-[var(--color-ink-400)]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar empresa…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-400)]"
        />
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Usuários</th>
              <th className="px-4 py-3 font-medium">Clientes</th>
              <th className="px-4 py-3 font-medium">Assinatura até</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                  Carregando…
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            ) : (
              filtradas.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{e.nome}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">
                    {e.plano_nome ?? '—'}
                    {e.valor_mensal != null && (
                      <span className="ml-1 font-data text-xs text-[var(--color-ink-400)]">
                        ({formatCurrency(e.valor_mensal)}/mês)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{e.total_usuarios}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{e.total_clientes}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">
                    {e.assinatura_valida_ate ? formatDate(e.assinatura_valida_ate) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={e.status}
                      onChange={(ev) => alterarStatus(e.id, ev.target.value as EmpresaSuperAdmin['status'])}
                      className={cn('h-8 w-36 rounded-full border-0 px-2.5 py-0 text-xs font-medium capitalize', corStatus[e.status])}
                    >
                      {statusOpcoes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function AbaPlanos() {
  const { planos, carregando, criar, alternarAtivo } = usePlanos()
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo plano
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Mensal</th>
              <th className="px-4 py-3 font-medium">Anual</th>
              <th className="px-4 py-3 font-medium">IA incluída</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                  Carregando…
                </td>
              </tr>
            ) : planos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhum plano cadastrado ainda.
                </td>
              </tr>
            ) : (
              planos.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{p.nome}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(p.valor_mensal)}</td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">
                    {p.valor_anual != null ? formatCurrency(p.valor_anual) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{p.ia_incluida ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => alternarAtivo(p)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        p.ativo ? 'bg-success-50 text-success-500' : 'bg-[var(--color-canvas)] text-[var(--color-ink-400)]'
                      )}
                    >
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <PlanoFormModal aberto={modalAberto} onFechar={() => setModalAberto(false)} aoSalvar={criar} />
    </div>
  )
}

export function SuperAdminEmpresasPage() {
  const [aba, setAba] = useState<AbaSuperAdmin>('empresas')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand-500" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Painel do Super Admin</h1>
          <p className="text-sm text-[var(--color-ink-400)]">Gerencie todas as empresas e planos da plataforma.</p>
        </div>
      </div>

      <Tabs
        abas={[
          { valor: 'empresas', rotulo: 'Empresas' },
          { valor: 'planos', rotulo: 'Planos' },
        ]}
        ativa={aba}
        onChange={setAba}
      />

      {aba === 'empresas' ? <AbaEmpresas /> : <AbaPlanos />}
    </div>
  )
}
