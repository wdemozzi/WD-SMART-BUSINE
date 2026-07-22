import { useState } from 'react'
import { Users, CalendarDays, Wallet, Download, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { exportarCsv } from '@/lib/export-csv'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { formatDate } from '@/lib/utils'

function primeiroDiaDoMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

export function RelatoriosPage() {
  const { empresa } = useAuth()
  const [inicio, setInicio] = useState(primeiroDiaDoMes())
  const [fim, setFim] = useState(hoje())
  const [gerando, setGerando] = useState<string | null>(null)

  async function exportarClientes() {
    if (!empresa?.id) return
    setGerando('clientes')

    const { data } = await supabase
      .from('vw_recorrencia_clientes')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('nome')

    const linhas = (data ?? []).map((c: any) => ({
      nome: c.nome,
      whatsapp: c.whatsapp ?? '',
      cliente_desde: formatDate(c.cliente_desde),
      ultima_visita: c.ultima_visita ? formatDate(c.ultima_visita) : 'Nunca compareceu',
      dias_sem_aparecer: c.dias_sem_aparecer ?? '—',
      total_atendimentos: c.total_atendimentos,
      status: c.dias_sem_aparecer == null ? 'Sem histórico' : c.dias_sem_aparecer >= 30 ? 'Inativo' : 'Ativo',
    }))

    exportarCsv(`clientes_${hoje()}`, [
      { chave: 'nome', rotulo: 'Nome' },
      { chave: 'whatsapp', rotulo: 'WhatsApp' },
      { chave: 'cliente_desde', rotulo: 'Cliente desde' },
      { chave: 'ultima_visita', rotulo: 'Última visita' },
      { chave: 'dias_sem_aparecer', rotulo: 'Dias sem aparecer' },
      { chave: 'total_atendimentos', rotulo: 'Total de atendimentos' },
      { chave: 'status', rotulo: 'Status' },
    ], linhas)

    setGerando(null)
  }

  async function exportarAgendamentos() {
    if (!empresa?.id) return
    setGerando('agendamentos')

    const { data } = await supabase
      .from('agendamentos')
      .select('data_hora_inicio, status, valor, clientes(nome), servicos(nome), funcionarios(nome)')
      .eq('empresa_id', empresa.id)
      .gte('data_hora_inicio', `${inicio}T00:00:00`)
      .lte('data_hora_inicio', `${fim}T23:59:59`)
      .order('data_hora_inicio')

    const linhas = (data ?? []).map((a: any) => ({
      data: formatDate(a.data_hora_inicio, true),
      cliente: a.clientes?.nome ?? '',
      servico: a.servicos?.nome ?? '',
      profissional: a.funcionarios?.nome ?? 'Sem preferência',
      status: a.status,
      valor: a.valor ?? 0,
    }))

    exportarCsv(`agendamentos_${inicio}_a_${fim}`, [
      { chave: 'data', rotulo: 'Data e hora' },
      { chave: 'cliente', rotulo: 'Cliente' },
      { chave: 'servico', rotulo: 'Serviço' },
      { chave: 'profissional', rotulo: 'Profissional' },
      { chave: 'status', rotulo: 'Status' },
      { chave: 'valor', rotulo: 'Valor (R$)' },
    ], linhas)

    setGerando(null)
  }

  async function exportarFinanceiro() {
    if (!empresa?.id) return
    setGerando('financeiro')

    const { data } = await supabase
      .from('transacoes_financeiras')
      .select('data_transacao, tipo, origem, descricao, valor, metodo')
      .eq('empresa_id', empresa.id)
      .gte('data_transacao', `${inicio}T00:00:00`)
      .lte('data_transacao', `${fim}T23:59:59`)
      .order('data_transacao')

    const linhas = (data ?? []).map((t: any) => ({
      data: formatDate(t.data_transacao, true),
      tipo: t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      origem: t.origem ?? '',
      descricao: t.descricao,
      valor: t.valor,
      metodo: t.metodo ?? '',
    }))

    exportarCsv(`financeiro_${inicio}_a_${fim}`, [
      { chave: 'data', rotulo: 'Data' },
      { chave: 'tipo', rotulo: 'Tipo' },
      { chave: 'origem', rotulo: 'Origem' },
      { chave: 'descricao', rotulo: 'Descrição' },
      { chave: 'valor', rotulo: 'Valor (R$)' },
      { chave: 'metodo', rotulo: 'Forma de pagamento' },
    ], linhas)

    setGerando(null)
  }

  async function exportarEmails() {
    if (!empresa?.id) return
    setGerando('emails')

    const { data } = await supabase
      .from('clientes')
      .select('nome, email, whatsapp, cidade, criado_em')
      .eq('empresa_id', empresa.id)
      .not('email', 'is', null)
      .neq('email', '')
      .order('nome')

    const linhas = (data ?? []).map((c: any) => ({
      nome: c.nome,
      email: c.email,
      whatsapp: c.whatsapp ?? '',
      cidade: c.cidade ?? '',
      cliente_desde: formatDate(c.criado_em),
    }))

    exportarCsv(`emails_clientes_${hoje()}`, [
      { chave: 'nome', rotulo: 'Nome' },
      { chave: 'email', rotulo: 'E-mail' },
      { chave: 'whatsapp', rotulo: 'WhatsApp' },
      { chave: 'cidade', rotulo: 'Cidade' },
      { chave: 'cliente_desde', rotulo: 'Cliente desde' },
    ], linhas)

    setGerando(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Relatórios</h1>
        <p className="text-sm text-[var(--color-ink-400)]">
          Exporte seus dados em CSV — abre direto no Excel, Google Sheets ou qualquer planilha.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink-900)]">Período (para Agenda e Financeiro)</label>
            <div className="flex items-center gap-2">
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-auto" />
              <span className="text-sm text-[var(--color-ink-400)]">até</span>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="w-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-[var(--color-ink-400)]">
              Todos os clientes com última visita, recorrência e status (ativo/inativo).
            </p>
            <Button size="sm" className="w-full" onClick={exportarClientes} disabled={gerando === 'clientes'}>
              <Download className="h-4 w-4" />
              {gerando === 'clientes' ? 'Gerando…' : 'Exportar CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-[var(--color-ink-400)]">
              Agendamentos do período selecionado, com status e valor de cada um.
            </p>
            <Button size="sm" className="w-full" onClick={exportarAgendamentos} disabled={gerando === 'agendamentos'}>
              <Download className="h-4 w-4" />
              {gerando === 'agendamentos' ? 'Gerando…' : 'Exportar CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-[var(--color-ink-400)]">
              Todas as entradas e saídas do período, com forma de pagamento.
            </p>
            <Button size="sm" className="w-full" onClick={exportarFinanceiro} disabled={gerando === 'financeiro'}>
              <Download className="h-4 w-4" />
              {gerando === 'financeiro' ? 'Gerando…' : 'Exportar CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-[var(--color-ink-400)]">
              Lista de e-mails cadastrados, para campanhas de marketing e promoções.
            </p>
            <Button size="sm" className="w-full" onClick={exportarEmails} disabled={gerando === 'emails'}>
              <Download className="h-4 w-4" />
              {gerando === 'emails' ? 'Gerando…' : 'Exportar CSV'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
