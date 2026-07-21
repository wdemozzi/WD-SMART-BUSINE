import { useState } from 'react'
import { CreditCard, History, Check, ArrowRightLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  usePlanoAtual,
  usePlanosDisponiveis,
  useMensalidades,
  useHistoricoPlanos,
  useSolicitacoesPlano,
} from '@/hooks/use-planos-empresa'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export function PlanosPage() {
  const { empresa, perfil } = useAuth()
  const planoAtual = usePlanoAtual(empresa?.plano_id ?? undefined)
  const planosDisponiveis = usePlanosDisponiveis()
  const { pagas, aVencer, vencidas, carregando: carregandoMensalidades } = useMensalidades(empresa?.id)
  const historico = useHistoricoPlanos(empresa?.id)
  const { solicitacaoPendente, solicitar } = useSolicitacoesPlano(empresa?.id)

  const [modalAberto, setModalAberto] = useState(false)
  const [planoEscolhido, setPlanoEscolhido] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSolicitar() {
    if (!planoEscolhido) return
    setEnviando(true)
    await solicitar(planoAtual?.id ?? null, planoEscolhido, perfil?.id ?? null)
    setEnviando(false)
    setSucesso(true)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Planos</h1>
        <p className="text-sm text-[var(--color-ink-400)]">Seu plano atual, mensalidades e histórico de assinatura.</p>
      </div>

      {empresa?.status === 'inadimplente' && (
        <p className="rounded-md bg-warning-50 px-3 py-2 text-sm text-warning-500">
          Identificamos uma pendência no pagamento da sua assinatura. Entre em contato com o suporte para regularizar.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Plano atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {planoAtual ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl font-semibold text-[var(--color-ink-900)]">{planoAtual.nome}</p>
                <p className="font-data text-lg text-brand-600">{formatCurrency(planoAtual.valor_mensal)}/mês</p>
                {planoAtual.descricao && <p className="mt-1 text-sm text-[var(--color-ink-400)]">{planoAtual.descricao}</p>}
              </div>
              <div className="flex flex-col gap-1 text-sm text-[var(--color-ink-600)]">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success-500" />
                  {planoAtual.limite_usuarios ? `Até ${planoAtual.limite_usuarios} usuários` : 'Usuários ilimitados'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success-500" />
                  {planoAtual.limite_clientes ? `Até ${planoAtual.limite_clientes} clientes` : 'Clientes ilimitados'}
                </span>
              </div>
              <div>
                {solicitacaoPendente ? (
                  <span className="rounded-full bg-warning-50 px-3 py-1.5 text-xs font-medium text-warning-500">
                    Solicitação de mudança para "{solicitacaoPendente.plano_solicitado_nome}" pendente
                  </span>
                ) : (
                  <Button size="sm" onClick={() => setModalAberto(true)}>
                    <ArrowRightLeft className="h-4 w-4" />
                    Solicitar mudança de plano
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-400)]">Nenhum plano associado à sua empresa ainda.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mensalidades pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-data text-2xl font-semibold text-success-500">{carregandoMensalidades ? '—' : pagas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>A vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-data text-2xl font-semibold text-info-500">{carregandoMensalidades ? '—' : aVencer.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-data text-2xl font-semibold text-danger-500">{carregandoMensalidades ? '—' : vencidas.length}</p>
          </CardContent>
        </Card>
      </div>

      {(pagas.length > 0 || aVencer.length > 0 || vencidas.length > 0) && (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
              <tr>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...vencidas, ...aVencer, ...pagas].map((m) => (
                <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">
                    {formatDate(m.inicio_periodo)} – {formatDate(m.fim_periodo)}
                  </td>
                  <td className="px-4 py-3 font-data text-[var(--color-ink-600)]">{formatCurrency(m.valor)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 font-display text-base font-semibold text-[var(--color-ink-900)]">
          <History className="h-4 w-4" />
          Histórico de alterações de plano
        </h2>
        {historico.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-400)]">Nenhuma alteração de plano registrada ainda.</p>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {historico.map((h) => (
                  <tr key={h.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-ink-600)]">
                      {h.plano_anterior_nome ?? 'Nenhum'} → <strong className="text-[var(--color-ink-900)]">{h.plano_novo_nome}</strong>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-ink-400)]">{formatDate(h.alterado_em, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <Dialog
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false)
          setSucesso(false)
          setPlanoEscolhido('')
        }}
        titulo="Solicitar mudança de plano"
        largura="max-w-md"
      >
        {sucesso ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">
            Solicitação enviada! Nossa equipe vai avaliar e aplicar a mudança em breve.
          </p>
        ) : (
          <div className="space-y-3">
            {planosDisponiveis
              .filter((p) => p.id !== planoAtual?.id)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlanoEscolhido(p.id)}
                  className={`flex w-full items-center justify-between rounded-md border p-3 text-left ${
                    planoEscolhido === p.id ? 'border-brand-500 bg-brand-50' : 'border-[var(--color-border)]'
                  }`}
                >
                  <span>
                    <span className="block font-medium text-[var(--color-ink-900)]">{p.nome}</span>
                    <span className="text-xs text-[var(--color-ink-400)]">{formatCurrency(p.valor_mensal)}/mês</span>
                  </span>
                  {planoEscolhido === p.id && <Check className="h-4 w-4 text-brand-500" />}
                </button>
              ))}

            <Button className="w-full" onClick={handleSolicitar} disabled={!planoEscolhido || enviando}>
              {enviando ? 'Enviando…' : 'Solicitar mudança'}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  )
}
