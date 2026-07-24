import { useEffect, useState } from 'react'
import { Users, CalendarCheck, TrendingUp, Percent, HandCoins } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRecorrenciaClientes } from '@/hooks/use-recorrencia-clientes'
import { MetricCard } from '@/components/dashboard/metric-card'
import { CardClientesInativos } from '@/components/dashboard/clientes-inativos-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { DashboardResumo } from '@/types/database'

export function DashboardPage() {
  const { empresa, perfil } = useAuth()
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const [receitaDiaria, setReceitaDiaria] = useState<{ dia: string; receita: number }[]>([])
  const [comissoesPendentes, setComissoesPendentes] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const { inativos } = useRecorrenciaClientes(empresa?.id)

  useEffect(() => {
    if (!empresa?.id) return

    async function carregar() {
      const [{ data: resumoData }, { data: receitaData }, { data: comissoesData }] = await Promise.all([
        supabase.from('vw_dashboard_resumo').select('*').eq('empresa_id', empresa!.id).single(),
        supabase
          .from('vw_receita_diaria')
          .select('*')
          .eq('empresa_id', empresa!.id)
          .order('dia', { ascending: true }),
        supabase
          .from('comissoes')
          .select('valor_comissao')
          .eq('empresa_id', empresa!.id)
          .eq('status', 'pendente')
          .gte('criado_em', startOfMonth(new Date()).toISOString())
          .lte('criado_em', endOfMonth(new Date()).toISOString()),
      ])

      setResumo(resumoData as DashboardResumo | null)
      setReceitaDiaria(
        (receitaData ?? []).map((r: { dia: string; receita: number }) => ({
          dia: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(r.dia)),
          receita: Number(r.receita ?? 0),
        }))
      )
      setComissoesPendentes(
        (comissoesData ?? []).reduce((soma: number, c: { valor_comissao: number }) => soma + Number(c.valor_comissao), 0)
      )
      setCarregando(false)
    }

    carregar()
  }, [empresa?.id])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">
          Olá, {perfil?.nome_completo?.split(' ')[0] ?? ''} 👋
        </h1>
        <p className="text-sm text-[var(--color-ink-400)]">
          Aqui está o que está acontecendo na {empresa?.nome ?? 'sua empresa'} hoje.
        </p>
      </div>

      {carregando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--color-border)]/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Clientes ativos"
            value={String(resumo?.total_clientes ?? 0)}
            icon={Users}
          />
          <MetricCard
            label="Agendamentos hoje"
            value={String(resumo?.agendamentos_hoje ?? 0)}
            icon={CalendarCheck}
          />
          <MetricCard
            label="Receita do mês"
            value={formatCurrency(resumo?.receita_mensal ?? 0)}
            icon={TrendingUp}
          />
          <MetricCard
            label="Taxa de comparecimento"
            value={`${resumo?.taxa_comparecimento_pct ?? 0}%`}
            icon={Percent}
          />
          <MetricCard
            label="Comissões pendentes (mês)"
            value={formatCurrency(comissoesPendentes)}
            icon={HandCoins}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Receita — últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={receitaDiaria} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="dia" fontSize={12} stroke="var(--color-ink-400)" tickLine={false} axisLine={false} />
              <YAxis fontSize={12} stroke="var(--color-ink-400)" tickLine={false} axisLine={false} width={48} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="receita" stroke="#4F46E5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <CardClientesInativos inativos={inativos} />
    </div>
  )
}
