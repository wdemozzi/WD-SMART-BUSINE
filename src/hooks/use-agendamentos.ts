import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AgendamentoCompleto, StatusAgendamento } from '@/types/database'

export function useAgendamentos(empresaId: string | undefined, inicio: Date, fim: Date) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoCompleto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    setErro(null)

    const { data, error } = await supabase
      .from('agendamentos')
      .select(
        `id, empresa_id, cliente_id, funcionario_id, servico_id, data_hora_inicio, data_hora_fim, status, valor,
         clientes ( nome ),
         servicos ( nome ),
         funcionarios ( nome )`
      )
      .eq('empresa_id', empresaId)
      .gte('data_hora_inicio', inicio.toISOString())
      .lte('data_hora_inicio', fim.toISOString())
      .order('data_hora_inicio', { ascending: true })

    if (error) {
      setErro('Não foi possível carregar os agendamentos.')
      setCarregando(false)
      return
    }

    type LinhaBruta = {
      id: string
      empresa_id: string
      cliente_id: string
      funcionario_id: string | null
      servico_id: string
      data_hora_inicio: string
      data_hora_fim: string
      status: StatusAgendamento
      valor: number | null
      clientes: { nome: string } | null
      servicos: { nome: string } | null
      funcionarios: { nome: string } | null
    }

    const normalizados: AgendamentoCompleto[] = ((data ?? []) as unknown as LinhaBruta[]).map((a) => ({
      id: a.id,
      empresa_id: a.empresa_id,
      cliente_id: a.cliente_id,
      funcionario_id: a.funcionario_id,
      servico_id: a.servico_id,
      data_hora_inicio: a.data_hora_inicio,
      data_hora_fim: a.data_hora_fim,
      status: a.status,
      valor: a.valor,
      cliente_nome: a.clientes?.nome ?? 'Cliente',
      servico_nome: a.servicos?.nome ?? 'Serviço',
      funcionario_nome: a.funcionarios?.nome ?? null,
    }))

    setAgendamentos(normalizados)
    setCarregando(false)
  }, [empresaId, inicio.getTime(), fim.getTime()])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function atualizarStatus(id: string, status: StatusAgendamento, motivo?: string) {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status, ...(motivo ? { cancelado_motivo: motivo } : {}) })
      .eq('id', id)

    if (!error) await carregar()
    return error
  }

  // Conclui o atendimento E lança a entrada correspondente no fluxo de caixa,
  // tudo em um único passo — evita esquecer de registrar o pagamento depois.
  async function concluirComPagamento(agendamento: AgendamentoCompleto, metodo: string) {
    const { error: erroStatus } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido' as StatusAgendamento })
      .eq('id', agendamento.id)

    if (erroStatus) return erroStatus

    if (agendamento.valor != null && agendamento.valor > 0) {
      const { error: erroTransacao } = await supabase.from('transacoes_financeiras').insert({
        empresa_id: empresaId,
        tipo: 'entrada',
        origem: 'agendamento',
        origem_id: agendamento.id,
        descricao: `Atendimento: ${agendamento.servico_nome} — ${agendamento.cliente_nome}`,
        valor: agendamento.valor,
        metodo,
        data_transacao: new Date().toISOString(),
      })
      if (erroTransacao) return erroTransacao
    }

    await carregar()
    return null
  }

  async function reagendar(id: string, novoInicio: Date, novoFim: Date) {
    const { error } = await supabase
      .from('agendamentos')
      .update({ data_hora_inicio: novoInicio.toISOString(), data_hora_fim: novoFim.toISOString() })
      .eq('id', id)

    if (!error) await carregar()
    return error
  }

  async function criar(payload: {
    cliente_id: string
    servico_id: string
    funcionario_id: string | null
    data_hora_inicio: string
    data_hora_fim: string
    valor: number | null
    cupom_id?: string | null
    valor_desconto?: number | null
    venda_pacote_id?: string | null
    observacoes?: string
  }) {
    const { error } = await supabase.from('agendamentos').insert({
      empresa_id: empresaId,
      origem: 'painel',
      status: 'agendado',
      ...payload,
    })

    if (!error) await carregar()
    return error
  }

  return { agendamentos, carregando, erro, recarregar: carregar, atualizarStatus, concluirComPagamento, reagendar, criar }
}
