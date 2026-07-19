import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ComissaoDetalhe {
  id: string
  funcionario_id: string
  origem: 'agendamento' | 'venda_pdv'
  descricao: string | null
  valor_base: number
  percentual_aplicado: number
  valor_comissao: number
  status: 'pendente' | 'paga'
  criado_em: string
}

export interface ResumoPorFuncionario {
  funcionario_id: string
  funcionario_nome: string
  totalPendente: number
  totalPago: number
  comissoes: ComissaoDetalhe[]
}

export function useComissoes(empresaId: string | undefined, inicio: Date, fim: Date) {
  const [resumo, setResumo] = useState<ResumoPorFuncionario[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)

    const { data } = await supabase
      .from('comissoes')
      .select('id, funcionario_id, origem, descricao, valor_base, percentual_aplicado, valor_comissao, status, criado_em, funcionarios(nome)')
      .eq('empresa_id', empresaId)
      .gte('criado_em', inicio.toISOString())
      .lte('criado_em', fim.toISOString())
      .order('criado_em', { ascending: false })

    type LinhaBruta = ComissaoDetalhe & { funcionarios: { nome: string } | null }
    const linhas = (data ?? []) as unknown as LinhaBruta[]

    const mapa = new Map<string, ResumoPorFuncionario>()
    for (const l of linhas) {
      const atual = mapa.get(l.funcionario_id) ?? {
        funcionario_id: l.funcionario_id,
        funcionario_nome: l.funcionarios?.nome ?? 'Profissional',
        totalPendente: 0,
        totalPago: 0,
        comissoes: [],
      }
      if (l.status === 'pendente') atual.totalPendente += Number(l.valor_comissao)
      else atual.totalPago += Number(l.valor_comissao)
      atual.comissoes.push(l)
      mapa.set(l.funcionario_id, atual)
    }

    setResumo(Array.from(mapa.values()).sort((a, b) => b.totalPendente - a.totalPendente))
    setCarregando(false)
  }, [empresaId, inicio.getTime(), fim.getTime()])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function pagarPendentes(funcionarioId: string) {
    const { data, error } = await supabase.rpc('pagar_comissoes_pendentes', {
      p_empresa_id: empresaId,
      p_funcionario_id: funcionarioId,
      p_inicio: inicio.toISOString(),
      p_fim: fim.toISOString(),
    })

    if (!error) await carregar()
    return { valorPago: (data as number) ?? 0, error }
  }

  return { resumo, carregando, pagarPendentes, recarregar: carregar }
}
