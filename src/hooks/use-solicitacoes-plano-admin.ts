import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface SolicitacaoPlanoAdmin {
  id: string
  empresa_id: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  criado_em: string
  empresa_nome?: string
  plano_atual_nome?: string
  plano_solicitado_nome?: string
}

export function useSolicitacoesPlanoAdmin() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPlanoAdmin[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase
      .from('solicitacoes_mudanca_plano')
      .select('*, empresas(nome), plano_atual:planos!solicitacoes_mudanca_plano_plano_atual_id_fkey(nome), plano_solicitado:planos!solicitacoes_mudanca_plano_plano_solicitado_id_fkey(nome)')
      .order('criado_em', { ascending: false })

    type LinhaBruta = SolicitacaoPlanoAdmin & {
      empresas: { nome: string } | null
      plano_atual: { nome: string } | null
      plano_solicitado: { nome: string } | null
    }
    const linhas = (data ?? []) as unknown as LinhaBruta[]
    setSolicitacoes(
      linhas.map((l) => ({
        ...l,
        empresa_nome: l.empresas?.nome,
        plano_atual_nome: l.plano_atual?.nome,
        plano_solicitado_nome: l.plano_solicitado?.nome,
      }))
    )
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function aprovar(id: string) {
    const { error } = await supabase.rpc('aprovar_solicitacao_plano', { p_solicitacao_id: id })
    if (!error) await carregar()
    return error
  }

  async function rejeitar(id: string) {
    const { error } = await supabase
      .from('solicitacoes_mudanca_plano')
      .update({ status: 'rejeitada', respondido_em: new Date().toISOString() })
      .eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { solicitacoes, carregando, aprovar, rejeitar }
}
