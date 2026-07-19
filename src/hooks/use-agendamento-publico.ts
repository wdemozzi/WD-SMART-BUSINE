import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface EmpresaPublica {
  id: string
  nome: string
  logo_url: string | null
  banner_url: string | null
  cor_primaria: string
  segmento: string
  instagram: string | null
  descricao_publica: string | null
  horario_funcionamento: string | null
  telefone: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
}

export interface ServicoPublico {
  id: string
  nome: string
  descricao: string | null
  valor: number
  duracao_minutos: number
  categoria: string | null
}

export interface FuncionarioPublico {
  id: string
  nome: string
  cargo: string | null
}

export function useEmpresaPublica(slug: string | undefined) {
  const [empresa, setEmpresa] = useState<EmpresaPublica | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrada, setNaoEncontrada] = useState(false)

  useEffect(() => {
    if (!slug) return

    async function carregar() {
      const { data, error } = await supabase.rpc('obter_empresa_publica', { p_slug: slug })
      if (error || !data || data.length === 0) {
        setNaoEncontrada(true)
      } else {
        setEmpresa(data[0] as EmpresaPublica)
      }
      setCarregando(false)
    }

    carregar()
  }, [slug])

  return { empresa, carregando, naoEncontrada }
}

export function useServicosPublicos(empresaId: string | undefined) {
  const [servicos, setServicos] = useState<ServicoPublico[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    supabase
      .rpc('listar_servicos_publicos', { p_empresa_id: empresaId })
      .then(({ data }) => {
        setServicos((data ?? []) as ServicoPublico[])
        setCarregando(false)
      })
  }, [empresaId])

  return { servicos, carregando }
}

export function useFuncionariosPublicos(empresaId: string | undefined) {
  const [funcionarios, setFuncionarios] = useState<FuncionarioPublico[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    supabase
      .rpc('listar_funcionarios_publicos', { p_empresa_id: empresaId })
      .then(({ data }) => {
        setFuncionarios((data ?? []) as FuncionarioPublico[])
        setCarregando(false)
      })
  }, [empresaId])

  return { funcionarios, carregando }
}

export async function buscarHorariosDisponiveis(
  empresaId: string,
  funcionarioId: string,
  servicoId: string,
  dia: string
) {
  const { data, error } = await supabase.rpc('listar_horarios_disponiveis', {
    p_empresa_id: empresaId,
    p_funcionario_id: funcionarioId,
    p_servico_id: servicoId,
    p_dia: dia,
  })

  if (error) return []
  return (data ?? []).map((d: { horario: string }) => d.horario)
}

export async function criarAgendamentoPublico(params: {
  empresaId: string
  servicoId: string
  funcionarioId: string
  dataHoraInicio: string
  nome: string
  telefone: string
  whatsapp: string
  email: string
}) {
  const { data, error } = await supabase.rpc('criar_agendamento_publico', {
    p_empresa_id: params.empresaId,
    p_servico_id: params.servicoId,
    p_funcionario_id: params.funcionarioId,
    p_data_hora_inicio: params.dataHoraInicio,
    p_nome_cliente: params.nome,
    p_telefone: params.telefone,
    p_whatsapp: params.whatsapp,
    p_email: params.email,
  })

  if (error || !data || data.length === 0) {
    return { agendamento_id: null, mensagem_erro: 'Não foi possível confirmar o agendamento.' }
  }

  return data[0] as { agendamento_id: string | null; mensagem_erro: string | null }
}
