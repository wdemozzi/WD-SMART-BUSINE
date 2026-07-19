import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { VendaPacote, SaldoPacote } from '@/types/database'

export interface VendaPacoteComSaldo extends VendaPacote {
  saldos: SaldoPacote[]
}

export function useVendasPacotesCliente(clienteId: string | undefined) {
  const [vendas, setVendas] = useState<VendaPacoteComSaldo[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!clienteId) return
    setCarregando(true)

    const { data } = await supabase
      .from('vendas_pacotes')
      .select('*, pacotes(nome), vendas_pacotes_saldo(*)')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })

    type LinhaBruta = VendaPacote & { pacotes: { nome: string } | null; vendas_pacotes_saldo: SaldoPacote[] }
    const linhas = (data ?? []) as unknown as LinhaBruta[]

    setVendas(
      linhas.map((v) => ({
        ...v,
        pacote_nome: v.pacotes?.nome,
        saldos: v.vendas_pacotes_saldo,
      }))
    )
    setCarregando(false)
  }, [clienteId])

  useEffect(() => {
    carregar()
  }, [carregar])

  return { vendas, carregando, recarregar: carregar }
}

// Retorna, para um cliente + serviço, a venda de pacote ativa (se houver)
// com sessões disponíveis para aquele serviço — usada no momento de agendar.
export async function buscarPacoteDisponivel(clienteId: string, servicoId: string) {
  const { data } = await supabase
    .from('vendas_pacotes')
    .select('*, pacotes(nome), vendas_pacotes_saldo(*)')
    .eq('cliente_id', clienteId)
    .eq('status', 'ativo')

  type LinhaBruta = VendaPacote & { pacotes: { nome: string } | null; vendas_pacotes_saldo: SaldoPacote[] }
  const linhas = (data ?? []) as unknown as LinhaBruta[]

  for (const v of linhas) {
    const saldo = v.vendas_pacotes_saldo.find((s) => s.servico_id === servicoId)
    if (saldo && saldo.quantidade_usada < saldo.quantidade_total) {
      return {
        vendaPacoteId: v.id,
        pacoteNome: v.pacotes?.nome ?? 'Pacote',
        restantes: saldo.quantidade_total - saldo.quantidade_usada,
      }
    }
  }
  return null
}

export async function venderPacote(params: {
  empresaId: string
  clienteId: string
  pacoteId: string
  metodo: string
  criadoPor: string | null
}) {
  const { data, error } = await supabase.rpc('vender_pacote', {
    p_empresa_id: params.empresaId,
    p_cliente_id: params.clienteId,
    p_pacote_id: params.pacoteId,
    p_metodo: params.metodo,
    p_criado_por: params.criadoPor,
  })

  return { vendaId: data as string | null, error }
}
