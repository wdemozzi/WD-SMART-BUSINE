import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface HorarioTrabalho {
  id: string
  funcionario_id: string
  dia_semana: number // 0 = domingo … 6 = sábado
  hora_inicio: string // 'HH:MM:SS'
  hora_fim: string
}

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function useFuncionarioHorarios(funcionarioId: string | undefined) {
  const [horarios, setHorarios] = useState<HorarioTrabalho[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!funcionarioId) return
    setCarregando(true)
    const { data } = await supabase
      .from('funcionario_horarios')
      .select('*')
      .eq('funcionario_id', funcionarioId)
      .order('dia_semana')

    setHorarios((data ?? []) as HorarioTrabalho[])
    setCarregando(false)
  }, [funcionarioId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function definirDia(diaSemana: number, ativo: boolean, horaInicio: string, horaFim: string) {
    const existente = horarios.find((h) => h.dia_semana === diaSemana)

    if (!ativo) {
      if (existente) {
        await supabase.from('funcionario_horarios').delete().eq('id', existente.id)
      }
    } else if (existente) {
      await supabase
        .from('funcionario_horarios')
        .update({ hora_inicio: horaInicio, hora_fim: horaFim })
        .eq('id', existente.id)
    } else {
      await supabase
        .from('funcionario_horarios')
        .insert({ funcionario_id: funcionarioId, dia_semana: diaSemana, hora_inicio: horaInicio, hora_fim: horaFim })
    }

    await carregar()
  }

  return { horarios, carregando, definirDia, recarregar: carregar }
}
