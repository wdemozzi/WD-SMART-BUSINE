import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ConsumoInterno {
  id: string
  empresa_id: string
  funcionario_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  valor_total: number
  status: 'pendente' | 'cobrado' | 'descontado' | 'cancelado'
  criado_em: string
  produto_nome?: string
  funcionario_nome?: string
}

export function useConsumoInterno(empresaId: string | undefined) {
  const [consumos, setConsumos] = useState<ConsumoInterno[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)

    const { data } = await supabase
      .from('consumo_interno')
      .select('*, produtos(nome), funcionarios(nome)')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    type LinhaBruta = ConsumoInterno & { produtos: { nome: string } | null; funcionarios: { nome: string } | null }
    const linhas = (data ?? []) as unknown as LinhaBruta[]
    setConsumos(
      linhas.map((c) => ({
        ...c,
        produto_nome: c.produtos?.nome ?? 'Produto',
        funcionario_nome: c.funcionarios?.nome ?? 'Funcionário',
      }))
    )
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function atualizarStatus(id: string, status: 'cobrado' | 'descontado' | 'cancelado') {
    const { error } = await supabase
      .from('consumo_interno')
      .update({ status })
      .eq('id', id)

    if (!error) await carregar()
    return error
  }

  return { consumos, carregando, atualizarStatus, recarregar: carregar }
}
