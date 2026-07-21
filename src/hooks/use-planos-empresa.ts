import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface PlanoInfo {
  id: string
  nome: string
  descricao: string | null
  valor_mensal: number
  limite_usuarios: number | null
  limite_clientes: number | null
  ia_incluida: boolean
}

export interface Mensalidade {
  id: string
  valor: number
  status: string
  inicio_periodo: string
  fim_periodo: string
}

export interface HistoricoPlano {
  id: string
  plano_anterior_id: string | null
  plano_novo_id: string | null
  alterado_em: string
  plano_anterior_nome?: string
  plano_novo_nome?: string
}

export interface SolicitacaoPlano {
  id: string
  plano_solicitado_id: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  criado_em: string
  plano_solicitado_nome?: string
}

export function usePlanoAtual(planoId: string | undefined) {
  const [plano, setPlano] = useState<PlanoInfo | null>(null)

  useEffect(() => {
    if (!planoId) return
    supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single()
      .then(({ data }) => setPlano(data as PlanoInfo | null))
  }, [planoId])

  return plano
}

export function usePlanosDisponiveis() {
  const [planos, setPlanos] = useState<PlanoInfo[]>([])

  useEffect(() => {
    supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('valor_mensal')
      .then(({ data }) => setPlanos((data ?? []) as PlanoInfo[]))
  }, [])

  return planos
}

export function useMensalidades(empresaId: string | undefined) {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    supabase
      .from('assinaturas')
      .select('id, valor, status, inicio_periodo, fim_periodo')
      .eq('empresa_id', empresaId)
      .order('inicio_periodo', { ascending: false })
      .then(({ data }) => {
        setMensalidades((data ?? []) as Mensalidade[])
        setCarregando(false)
      })
  }, [empresaId])

  const hoje = new Date().toISOString().slice(0, 10)
  const pagas = mensalidades.filter((m) => m.status === 'pago')
  const aVencer = mensalidades.filter((m) => m.status !== 'pago' && m.fim_periodo >= hoje)
  const vencidas = mensalidades.filter((m) => m.status !== 'pago' && m.fim_periodo < hoje)

  return { mensalidades, pagas, aVencer, vencidas, carregando }
}

export function useHistoricoPlanos(empresaId: string | undefined) {
  const [historico, setHistorico] = useState<HistoricoPlano[]>([])

  useEffect(() => {
    if (!empresaId) return
    supabase
      .from('historico_planos')
      .select('*, plano_anterior:planos!historico_planos_plano_anterior_id_fkey(nome), plano_novo:planos!historico_planos_plano_novo_id_fkey(nome)')
      .eq('empresa_id', empresaId)
      .order('alterado_em', { ascending: false })
      .then(({ data }) => {
        type LinhaBruta = HistoricoPlano & {
          plano_anterior: { nome: string } | null
          plano_novo: { nome: string } | null
        }
        const linhas = (data ?? []) as unknown as LinhaBruta[]
        setHistorico(
          linhas.map((l) => ({
            ...l,
            plano_anterior_nome: l.plano_anterior?.nome,
            plano_novo_nome: l.plano_novo?.nome,
          }))
        )
      })
  }, [empresaId])

  return historico
}

export function useSolicitacoesPlano(empresaId: string | undefined) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPlano[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data } = await supabase
      .from('solicitacoes_mudanca_plano')
      .select('*, planos(nome)')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    type LinhaBruta = SolicitacaoPlano & { planos: { nome: string } | null }
    const linhas = (data ?? []) as unknown as LinhaBruta[]
    setSolicitacoes(linhas.map((l) => ({ ...l, plano_solicitado_nome: l.planos?.nome })))
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function solicitar(planoAtualId: string | null, planoSolicitadoId: string, criadoPor: string | null) {
    const { error } = await supabase.from('solicitacoes_mudanca_plano').insert({
      empresa_id: empresaId,
      plano_atual_id: planoAtualId,
      plano_solicitado_id: planoSolicitadoId,
      criado_por: criadoPor,
    })
    if (!error) await carregar()
    return error
  }

  const solicitacaoPendente = solicitacoes.find((s) => s.status === 'pendente') ?? null

  return { solicitacoes, solicitacaoPendente, carregando, solicitar }
}
