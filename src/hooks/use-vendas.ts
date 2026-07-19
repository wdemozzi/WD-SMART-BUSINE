import { supabase } from '@/lib/supabase'

export interface ItemCarrinho {
  produto_id: string
  quantidade: number
}

export interface ResultadoVenda {
  venda_id: string | null
  valor_total: number
  mensagem_erro: string | null
}

export async function registrarVenda(params: {
  empresaId: string
  clienteId: string | null
  funcionarioId: string | null
  metodo: string
  cupomCodigo: string | null
  criadoPor: string | null
  itens: ItemCarrinho[]
}) {
  const { data, error } = await supabase.rpc('registrar_venda', {
    p_empresa_id: params.empresaId,
    p_cliente_id: params.clienteId,
    p_funcionario_id: params.funcionarioId,
    p_metodo: params.metodo,
    p_cupom_codigo: params.cupomCodigo,
    p_criado_por: params.criadoPor,
    p_itens: params.itens,
  })

  if (error || !data || data.length === 0) {
    return { venda_id: null, valor_total: 0, mensagem_erro: 'Não foi possível registrar a venda.' } as ResultadoVenda
  }

  return data[0] as ResultadoVenda
}
