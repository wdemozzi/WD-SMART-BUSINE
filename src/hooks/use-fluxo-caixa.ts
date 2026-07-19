import { useEffect, useState } from 'react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'

export type PeriodoFinanceiro = 'hoje' | 'semana' | 'mes' | 'personalizado'

export interface PontoFluxo {
  dia: string
  receita: number
  despesa: number
}

export interface TotaisPorMetodo {
  pix: number
  cartao: number
  dinheiro: number
  boleto: number
  outro: number
}

const metodosVazios: TotaisPorMetodo = { pix: 0, cartao: 0, dinheiro: 0, boleto: 0, outro: 0 }

export function intervaloDoPeriodo(periodo: PeriodoFinanceiro, dataBase = new Date(), inicioPersonalizado?: Date, fimPersonalizado?: Date) {
  if (periodo === 'hoje') return { inicio: startOfDay(dataBase), fim: endOfDay(dataBase) }
  if (periodo === 'semana') return { inicio: startOfWeek(dataBase, { weekStartsOn: 0 }), fim: endOfWeek(dataBase, { weekStartsOn: 0 }) }
  if (periodo === 'mes') return { inicio: startOfMonth(dataBase), fim: endOfMonth(dataBase) }
  return { inicio: inicioPersonalizado ?? startOfMonth(dataBase), fim: fimPersonalizado ?? endOfMonth(dataBase) }
}

export function useFluxoCaixa(empresaId: string | undefined, inicio: Date, fim: Date) {
  const [pontos, setPontos] = useState<PontoFluxo[]>([])
  const [totalEntradas, setTotalEntradas] = useState(0)
  const [totalSaidas, setTotalSaidas] = useState(0)
  const [porMetodo, setPorMetodo] = useState<TotaisPorMetodo>(metodosVazios)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!empresaId) return

    async function carregar() {
      setCarregando(true)

      const { data: transacoes } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, valor, metodo, data_transacao')
        .eq('empresa_id', empresaId!)
        .gte('data_transacao', inicio.toISOString())
        .lte('data_transacao', fim.toISOString())
        .order('data_transacao', { ascending: true })

      const lista = (transacoes ?? []) as { tipo: string; valor: number; metodo: string | null; data_transacao: string }[]

      let entradas = 0
      let saidas = 0
      const metodos: TotaisPorMetodo = { ...metodosVazios }
      const porDia = new Map<string, { receita: number; despesa: number }>()

      for (const t of lista) {
        const valor = Number(t.valor)
        const chaveDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
          new Date(t.data_transacao)
        )
        const atual = porDia.get(chaveDia) ?? { receita: 0, despesa: 0 }

        if (t.tipo === 'entrada') {
          entradas += valor
          atual.receita += valor
          const metodo = (t.metodo ?? 'outro') as keyof TotaisPorMetodo
          metodos[metodo in metodos ? metodo : 'outro'] += valor
        } else {
          saidas += valor
          atual.despesa += valor
        }

        porDia.set(chaveDia, atual)
      }

      setTotalEntradas(entradas)
      setTotalSaidas(saidas)
      setPorMetodo(metodos)
      setPontos(Array.from(porDia.entries()).map(([dia, v]) => ({ dia, ...v })))
      setCarregando(false)
    }

    carregar()
  }, [empresaId, inicio.getTime(), fim.getTime()])

  return { pontos, totalEntradas, totalSaidas, saldo: totalEntradas - totalSaidas, porMetodo, carregando }
}
