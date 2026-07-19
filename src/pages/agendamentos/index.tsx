import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAgendamentos } from '@/hooks/use-agendamentos'
import { useCadastrosAgenda } from '@/hooks/use-cadastros-agenda'
import { intervaloDaVisao, diasDoIntervalo, navegar, type VisaoCalendario } from '@/lib/date-helpers'
import { CalendarToolbar } from '@/components/agendamentos/calendar-toolbar'
import { GradeHorarios } from '@/components/agendamentos/grade-horarios'
import { GradeMes } from '@/components/agendamentos/grade-mes'
import { NovoAgendamentoModal } from '@/components/agendamentos/novo-agendamento-modal'
import { DetalheAgendamentoModal } from '@/components/agendamentos/detalhe-agendamento-modal'
import type { AgendamentoCompleto } from '@/types/database'

export function AgendamentosPage() {
  const { empresa } = useAuth()
  const [dataAtual, setDataAtual] = useState(new Date())
  const [visao, setVisao] = useState<VisaoCalendario>('semana')
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [horarioParaNovo, setHorarioParaNovo] = useState(new Date())
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoCompleto | null>(null)

  const { inicio, fim } = useMemo(() => intervaloDaVisao(dataAtual, visao), [dataAtual, visao])
  const dias = useMemo(() => diasDoIntervalo(inicio, fim), [inicio, fim])

  const { agendamentos, carregando, erro, atualizarStatus, concluirComPagamento, reagendar, criar, recarregar } = useAgendamentos(
    empresa?.id,
    inicio,
    fim
  )
  const { clientes, servicos, funcionarios } = useCadastrosAgenda(empresa?.id)

  // Atualiza a agenda automaticamente a cada 5s, para refletir agendamentos
  // feitos pela página pública sem precisar dar F5 manualmente.
  useEffect(() => {
    const intervalo = setInterval(() => {
      recarregar()
    }, 5000)
    return () => clearInterval(intervalo)
  }, [recarregar])

  function abrirNovoAgendamento(data: Date) {
    setHorarioParaNovo(data)
    setModalNovoAberto(true)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Agenda</h1>
        <p className="text-sm text-[var(--color-ink-400)]">
          Clique em um horário livre para criar um agendamento, ou em um existente para ver detalhes.
        </p>
      </div>

      <CalendarToolbar
        data={dataAtual}
        visao={visao}
        onVisaoChange={setVisao}
        onNavegar={(direcao) => setDataAtual((d) => navegar(d, visao, direcao))}
        onHoje={() => setDataAtual(new Date())}
        onNovoAgendamento={() => abrirNovoAgendamento(new Date())}
      />

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      {carregando ? (
        <div className="h-[600px] animate-pulse rounded-lg bg-[var(--color-border)]/30" />
      ) : visao === 'mes' ? (
        <GradeMes
          mesReferencia={dataAtual}
          agendamentos={agendamentos}
          onSelecionarDia={(data) => {
            setDataAtual(data)
            setVisao('dia')
          }}
          onSelecionarAgendamento={setAgendamentoSelecionado}
        />
      ) : (
        <GradeHorarios
          dias={dias}
          agendamentos={agendamentos}
          onSelecionarAgendamento={setAgendamentoSelecionado}
          onSelecionarHorario={abrirNovoAgendamento}
        />
      )}

      <NovoAgendamentoModal
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        empresaId={empresa!.id}
        clientes={clientes}
        servicos={servicos}
        funcionarios={funcionarios}
        dataInicial={horarioParaNovo}
        aoCriar={criar}
      />

      <DetalheAgendamentoModal
        agendamento={agendamentoSelecionado}
        onFechar={() => setAgendamentoSelecionado(null)}
        aoAtualizarStatus={atualizarStatus}
        aoConcluirComPagamento={concluirComPagamento}
        aoReagendar={reagendar}
      />
    </div>
  )
}
