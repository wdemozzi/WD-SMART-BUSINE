import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type VisaoCalendario = 'dia' | 'semana' | 'mes'

export function intervaloDaVisao(data: Date, visao: VisaoCalendario) {
  if (visao === 'dia') return { inicio: startOfDay(data), fim: endOfDay(data) }
  if (visao === 'semana')
    return {
      inicio: startOfWeek(data, { weekStartsOn: 0 }),
      fim: endOfWeek(data, { weekStartsOn: 0 }),
    }
  return { inicio: startOfMonth(data), fim: endOfMonth(data) }
}

export function diasDoIntervalo(inicio: Date, fim: Date) {
  return eachDayOfInterval({ start: inicio, end: fim })
}

export function navegar(data: Date, visao: VisaoCalendario, direcao: 1 | -1) {
  if (visao === 'dia') return addDays(data, direcao)
  if (visao === 'semana') return addWeeks(data, direcao)
  return addMonths(data, direcao)
}

export function tituloIntervalo(data: Date, visao: VisaoCalendario) {
  if (visao === 'dia') return format(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  if (visao === 'mes') return format(data, "MMMM 'de' yyyy", { locale: ptBR })
  const { inicio, fim } = intervaloDaVisao(data, 'semana')
  const mesmoMes = inicio.getMonth() === fim.getMonth()
  return mesmoMes
    ? `${format(inicio, 'd')} – ${format(fim, "d 'de' MMMM", { locale: ptBR })}`
    : `${format(inicio, 'd MMM', { locale: ptBR })} – ${format(fim, 'd MMM', { locale: ptBR })}`
}

export const HORA_INICIO_GRADE = 7
export const HORA_FIM_GRADE = 21

export function minutosDesde(hora: number, data: Date) {
  return (data.getHours() - hora) * 60 + data.getMinutes()
}
