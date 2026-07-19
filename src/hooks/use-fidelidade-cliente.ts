import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FidelidadeMovimento } from '@/types/database'

export function useFidelidadeCliente(clienteId: string | undefined, empresaId: string | undefined) {
  const [saldo, setSaldo] = useState(0)
  const [movimentos, setMovimentos] = useState<FidelidadeMovimento[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!clienteId) return
    setCarregando(true)

    const [{ data: saldoData }, { data: movData }] = await Promise.all([
      supabase.from('fidelidade_saldos').select('pontos').eq('cliente_id', clienteId).maybeSingle(),
      supabase
        .from('fidelidade_movimentos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('criado_em', { ascending: false })
        .limit(20),
    ])

    setSaldo(saldoData?.pontos ?? 0)
    setMovimentos((movData ?? []) as FidelidadeMovimento[])
    setCarregando(false)
  }, [clienteId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function resgatar(recompensaId: string, criadoPor: string | null) {
    const { data, error } = await supabase.rpc('resgatar_recompensa_fidelidade', {
      p_empresa_id: empresaId,
      p_cliente_id: clienteId,
      p_recompensa_id: recompensaId,
      p_criado_por: criadoPor,
    })

    if (error || !data || data.length === 0) {
      return { sucesso: false, mensagem_erro: 'Não foi possível resgatar a recompensa.' }
    }

    const resultado = data[0] as { sucesso: boolean; novo_saldo: number; mensagem_erro: string | null }
    if (resultado.sucesso) await carregar()
    return resultado
  }

  return { saldo, movimentos, carregando, resgatar, recarregar: carregar }
}
