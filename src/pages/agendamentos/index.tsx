import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAgendamentos } from '@/hooks/use-agendamentos'
import { useCadastrosAgenda } from '@/hooks/use-cadastros-agenda'
import { useListaEspera } from '@/hooks/use-lista-espera'
import { intervaloDaVisao, diasDoIntervalo, navegar, type VisaoCalendario } from '@/lib/date-helpers'
import { CalendarToolbar } from '@/components/agendamentos/calendar-toolbar'
import { GradeHorarios } from '@/components/agendamentos/grade-horarios'
import { GradeMes } from '@/components/agendamentos/grade-mes'
import { NovoAgendamentoModal } from '@/components/agendamentos/novo-agendamento-modal'
import { DetalheAgendamentoModal } from '@/components/agendamentos/detalhe-agendamento-modal'
import type { AgendamentoCompleto } from '@/types/database'

interface PreenchimentoListaEspera {
  listaEsperaId: string
  clienteId: string
  servicoId: string
  funcionarioId: string | null
}

export function AgendamentosPage() {
  const { empresa } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [dataAtual, setDataAtual] = useState(new Date())
  const [visao, setVisao] = useState<VisaoCalendario>('semana')
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [horarioParaNovo, setHorarioParaNovo] = useState(new Date())
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoCompleto | null>(null)
  const [preenchimentoListaEspera, setPreenchimentoListaEspera] = useState<PreenchimentoListaEspera | null>(null)

  const { inicio, fim } = useMemo(() => intervaloDaVisao(dataAtual, visao), [dataAtual, visao])
  const dias = useMemo(() => diasDoIntervalo(inicio, fim), [inicio, fim])

  const { agendamentos, carregando, erro, atualizarStatus, concluirComPagamento, reagendar, criar, recarregar } = useAgendamentos(
    empresa?.id,
    inicio,
    fim
  )
  const { clientes, servicos, funcionarios } = useCadastrosAgenda(empresa?.id)
  const { atualizarStatus: atualizarStatusListaEspera } = useListaEspera(empresa?.id)

  // Chegou aqui vindo do botão "Atender Cliente" da Lista de Espera —
  // abre o modal de novo agendamento já preenchido.
  useEffect(() => {
    const state = location.state as { atenderListaEspera?: PreenchimentoListaEspera } | null
    if (state?.atenderListaEspera) {
      setPreenchimentoListaEspera(state.atenderListaEspera)
      setHorarioParaNovo(new Date())
      setModalNovoAberto(true)
      // Limpa o state da navegação para não reabrir de novo em um F5
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza a agenda automaticamente a cada 5s, para refletir agendamentos
  // feitos pela página pública sem precisar dar F5 manualmente.
  useEffect(() => {
    const intervalo = setInterval(() => {
      recarregar()
    }, 5000)
    return () => clearInterval(intervalo)
  }, [recarregar])

  function abrirNovoAgendamento(data: Date) {
    setPreenchimentoListaEspera(null)
    setHorarioParaNovo(data)
    setModalNovoAberto(true)
  }

  async function handleCriarAgendamento(payload: Parameters<typeof criar>[0]) {
    const resultado = await criar(payload)
    if (!resultado && preenchimentoListaEspera) {
      await atualizarStatusListaEspera(preenchimentoListaEspera.listaEsperaId, 'atendido')
      setPreenchimentoListaEspera(null)
    }
    return resultado
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
        onFechar={() => {
          setModalNovoAberto(false)
          setPreenchimentoListaEspera(null)
        }}
        empresaId={empresa!.id}
        clientes={clientes}
        servicos={servicos}
        funcionarios={funcionarios}
        dataInicial={horarioParaNovo}
        preenchimentoInicial={
          preenchimentoListaEspera
            ? {
                clienteId: preenchimentoListaEspera.clienteId,
                servicoId: preenchimentoListaEspera.servicoId,
                funcionarioId: preenchimentoListaEspera.funcionarioId,
              }
            : undefined
        }
        aoCriar={handleCriarAgendamento}
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
