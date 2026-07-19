import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface EmpresaSuperAdmin {
  id: string
  nome: string
  status: 'ativa' | 'inadimplente' | 'suspensa' | 'cancelada' | 'trial'
  plano_nome: string | null
  valor_mensal: number | null
  total_usuarios: number
  total_clientes: number
  assinatura_valida_ate: string | null
}

export function useSuperAdminEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaSuperAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data, error } = await supabase.from('vw_super_admin_empresas').select('*').order('nome')

    if (error) setErro('Não foi possível carregar as empresas.')
    else {
      setEmpresas((data ?? []) as EmpresaSuperAdmin[])
      setErro(null)
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function alterarStatus(empresaId: string, status: EmpresaSuperAdmin['status']) {
    const { error } = await supabase.from('empresas').update({ status }).eq('id', empresaId)
    if (!error) await carregar()
    return error
  }

  return { empresas, carregando, erro, alterarStatus, recarregar: carregar }
}

export interface PlanoFormValues {
  nome: string
  descricao: string
  valor_mensal: number
  valor_anual: number | null
  limite_usuarios: number | null
  limite_clientes: number | null
  ia_incluida: boolean
  ativo: boolean
}

export interface Plano extends PlanoFormValues {
  id: string
}

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase.from('planos').select('*').order('valor_mensal')
    setPlanos((data ?? []) as Plano[])
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: PlanoFormValues) {
    const { error } = await supabase.from('planos').insert(valores)
    if (!error) await carregar()
    return error
  }

  async function alternarAtivo(plano: Plano) {
    const { error } = await supabase.from('planos').update({ ativo: !plano.ativo }).eq('id', plano.id)
    if (!error) await carregar()
    return error
  }

  return { planos, carregando, criar, alternarAtivo, recarregar: carregar }
}
