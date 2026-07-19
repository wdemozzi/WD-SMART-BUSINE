import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface EmpresaFormValues {
  nome: string
  cnpj: string
  segmento: string
  email: string
  telefone: string
  logo_url: string
  banner_url: string
  cor_primaria: string
  endereco: string
  cidade: string
  estado: string
  timezone: string
  instagram: string
  descricao_publica: string
  horario_funcionamento: string
}

const segmentos = [
  { valor: 'clinica_medica', rotulo: 'Clínica médica' },
  { valor: 'clinica_veterinaria', rotulo: 'Clínica veterinária' },
  { valor: 'psicologia', rotulo: 'Psicologia' },
  { valor: 'advocacia', rotulo: 'Advocacia' },
  { valor: 'salao_beleza', rotulo: 'Salão de beleza' },
  { valor: 'barbearia', rotulo: 'Barbearia' },
  { valor: 'consultoria', rotulo: 'Consultoria' },
  { valor: 'oficina', rotulo: 'Oficina' },
  { valor: 'agropecuaria', rotulo: 'Agropecuária' },
  { valor: 'prestador_servico', rotulo: 'Prestador de serviço' },
  { valor: 'outro', rotulo: 'Outro' },
]

export { segmentos }

export function useEmpresaAtual(empresaId: string | undefined) {
  const [valores, setValores] = useState<EmpresaFormValues | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId) return

    async function carregar() {
      const { data, error } = await supabase.from('empresas').select('*').eq('id', empresaId!).single()
      if (error) {
        setErro('Não foi possível carregar os dados da empresa.')
      } else if (data) {
        setValores({
          nome: data.nome ?? '',
          cnpj: data.cnpj ?? '',
          segmento: data.segmento ?? 'outro',
          email: data.email ?? '',
          telefone: data.telefone ?? '',
          logo_url: data.logo_url ?? '',
          banner_url: data.banner_url ?? '',
          cor_primaria: data.cor_primaria ?? '#4F46E5',
          endereco: data.endereco ?? '',
          cidade: data.cidade ?? '',
          estado: data.estado ?? '',
          timezone: data.timezone ?? 'America/Sao_Paulo',
          instagram: data.instagram ?? '',
          descricao_publica: data.descricao_publica ?? '',
          horario_funcionamento: data.horario_funcionamento ?? '',
        })
      }
      setCarregando(false)
    }

    carregar()
  }, [empresaId])

  async function salvar(novosValores: EmpresaFormValues) {
    const { error } = await supabase.from('empresas').update(novosValores).eq('id', empresaId)
    if (!error) setValores(novosValores)
    return error
  }

  return { valores, carregando, erro, salvar }
}
