import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cupom, TipoDesconto } from '@/types/database'

export interface CupomFormValues {
  codigo: string
  descricao: string
  tipo: TipoDesconto
  valor: number
  validade: string
  limite_uso: number | null
  limite_uso_por_cliente: number | null
}

export function useCupons(empresaId: string | undefined) {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    if (error) setErro('Não foi possível carregar os cupons.')
    else {
      setCupons((data ?? []) as Cupom[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: CupomFormValues) {
    const { error } = await supabase.from('cupons').insert({
      empresa_id: empresaId,
      ...valores,
      codigo: valores.codigo.toUpperCase(),
      validade: valores.validade || null,
    })
    if (!error) await carregar()
    return error
  }

  async function alternarAtivo(cupom: Cupom) {
    const { error } = await supabase.from('cupons').update({ ativo: !cupom.ativo }).eq('id', cupom.id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('cupons').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { cupons, carregando, erro, criar, alternarAtivo, excluir }
}

// Pré-visualiza o cupom (sem incrementar o uso) para mostrar o desconto antes de confirmar.
// A validação definitiva + incremento acontece via aplicarCupom() no momento de salvar.
export async function previsualizarCupom(
  empresaId: string,
  codigo: string,
  valorOriginal: number,
  clienteId?: string | null
) {
  const { data, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('empresa_id', empresaId)
    .ilike('codigo', codigo)
    .maybeSingle()

  if (error || !data) return { valido: false, mensagem: 'Cupom não encontrado.', desconto: 0 }

  const cupom = data as Cupom

  if (!cupom.ativo) return { valido: false, mensagem: 'Este cupom está inativo.', desconto: 0 }
  if (cupom.validade && new Date(cupom.validade) < new Date(new Date().toDateString()))
    return { valido: false, mensagem: 'Este cupom expirou.', desconto: 0 }
  if (cupom.limite_uso != null && cupom.quantidade_usada >= cupom.limite_uso)
    return { valido: false, mensagem: 'Este cupom atingiu o limite de usos.', desconto: 0 }

  if (clienteId && cupom.limite_uso_por_cliente != null) {
    const { count } = await supabase
      .from('cupom_usos')
      .select('id', { count: 'exact', head: true })
      .eq('cupom_id', cupom.id)
      .eq('cliente_id', clienteId)

    if ((count ?? 0) >= cupom.limite_uso_por_cliente) {
      return { valido: false, mensagem: 'Este cliente já utilizou o limite de vezes permitido para esse cupom.', desconto: 0 }
    }
  }

  const desconto =
    cupom.tipo === 'percentual' ? Math.round(valorOriginal * cupom.valor) / 100 : Math.min(cupom.valor, valorOriginal)

  return { valido: true, mensagem: null, desconto, cupomId: cupom.id }
}

export interface ResultadoAplicacaoCupom {
  cupom_id: string | null
  valor_desconto: number | null
  valor_final: number
  mensagem_erro: string | null
}

// Valida e aplica um cupom via função do banco (aplicar_cupom), que também
// incrementa o contador de uso de forma segura contra corrida.
export async function aplicarCupom(empresaId: string, codigo: string, valorOriginal: number, clienteId?: string | null) {
  const { data, error } = await supabase.rpc('aplicar_cupom', {
    p_empresa_id: empresaId,
    p_codigo: codigo,
    p_valor_original: valorOriginal,
    p_cliente_id: clienteId ?? null,
  })

  if (error || !data || data.length === 0) {
    return { cupom_id: null, valor_desconto: null, valor_final: valorOriginal, mensagem_erro: 'Não foi possível validar o cupom.' } as ResultadoAplicacaoCupom
  }

  return data[0] as ResultadoAplicacaoCupom
}
