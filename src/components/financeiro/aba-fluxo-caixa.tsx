import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Smartphone, CreditCard, Banknote, FileText, MoreHorizontal } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { useFluxoCaixa, intervaloDoPeriodo, type PeriodoFinanceiro } from '@/hooks/use-fluxo-caixa'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/form'
import { cn, formatCurrency } from '@/lib/utils'

const periodos: { valor: PeriodoFinanceiro; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'semana', rotulo: 'Esta semana' },
  { valor: 'mes', rotulo: 'Este mês' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
]

const metodosInfo = [
  { chave: 'pix' as const, rotulo: 'PIX', icone: Smartphone },
  { chave: 'cartao' as const, rotulo: 'Cartão', icone: CreditCard },
  { chave: 'dinheiro' as const, rotulo: 'Dinheiro', icone: Banknote },
  { chave: 'boleto' as const, rotulo: 'Boleto', icone: FileText },
  { chave: 'outro' as const, rotulo: 'Outro', icone: MoreHorizontal },
]

function paraInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function AbaFluxoCaixa() {
  const { empresa } = useAuth()
  const [periodo, setPeriodo] = useState<PeriodoFinanceiro>('mes')
  const [inicioPersonalizado, setInicioPersonalizado] = useState(paraInputDate(new Date()))
  const [fimPersonalizado, setFimPersonalizado] = useState(paraInputDate(new Date()))

  const { inicio, fim } = useMemo(
    () =>
      intervaloDoPeriodo(
        periodo,
        new Date(),
        new Date(`${inicioPersonalizado}T00:00:00`),
        new Date(`${fimPersonalizado}T23:59:59`)
      ),
    [periodo, inicioPersonalizado, fimPersonalizado]
  )

  const { pontos, totalEntradas, totalSaidas, saldo, porMetodo, carregando } = useFluxoCaixa(empresa?.id, inicio, fim)

  const totalPorMetodos = Object.values(porMetodo).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-[var(--color-border)] p-0.5">
          {periodos.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPeriodo(p.valor)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                periodo === p.valor ? 'bg-brand-500 text-white' : 'text-[var(--color-ink-600)] hover:bg-[var(--color-canvas)]'
              )}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        {periodo === 'personalizado' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={inicioPersonalizado} onChange={(e) => setInicioPersonalizado(e.target.value)} className="w-auto" />
            <span className="text-sm text-[var(--color-ink-400)]">até</span>
            <Input type="date" value={fimPersonalizado} onChange={(e) => setFimPersonalizado(e.target.value)} className="w-auto" />
          </div>
        )}
      </div>

      {carregando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--color-border)]/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Entradas no período" value={formatCurrency(totalEntradas)} icon={TrendingUp} />
          <MetricCard label="Saídas no período" value={formatCurrency(totalSaidas)} icon={TrendingDown} />
          <MetricCard label="Saldo no período" value={formatCurrency(saldo)} icon={Wallet} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Faturamento por forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {metodosInfo.map((m) => {
            const valor = porMetodo[m.chave]
            const pct = totalPorMetodos > 0 ? Math.round((valor / totalPorMetodos) * 100) : 0
            return (
              <div key={m.chave} className="rounded-md border border-[var(--color-border)] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[var(--color-ink-400)]">
                  <m.icone className="h-3.5 w-3.5" />
                  <span className="text-xs">{m.rotulo}</span>
                </div>
                <p className="font-data text-lg font-semibold text-[var(--color-ink-900)]">{formatCurrency(valor)}</p>
                <p className="text-xs text-[var(--color-ink-400)]">{pct}% do total</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas x Saídas no período</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pontos} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="dia" fontSize={12} stroke="var(--color-ink-400)" tickLine={false} axisLine={false} />
              <YAxis fontSize={12} stroke="var(--color-ink-400)" tickLine={false} axisLine={false} width={48} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}
              />
              <Legend />
              <Bar dataKey="receita" name="Entradas" fill="#059669" radius={[3, 3, 0, 0]} />
              <Bar dataKey="despesa" name="Saídas" fill="#DC2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
