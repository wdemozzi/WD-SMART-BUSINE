import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Check, ChevronLeft, Clock, User, AtSign, MapPin, Phone } from 'lucide-react'
import {
  useEmpresaPublica,
  useServicosPublicos,
  useFuncionariosPublicos,
  buscarHorariosDisponiveis,
  criarAgendamentoPublico,
  type ServicoPublico,
  type FuncionarioPublico,
} from '@/hooks/use-agendamento-publico'
import { formatCurrency } from '@/lib/utils'

type Etapa = 'servico' | 'profissional' | 'data' | 'horario' | 'dados' | 'confirmado'

function proximosDias(quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

// Remove marcações de markdown que às vezes vêm coladas de outro lugar
// (##, **negrito**, etc.) para exibir como texto corrido e limpo.
function limparTexto(texto: string) {
  return texto
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export function AgendamentoPublicoPage() {
  const { slug } = useParams<{ slug: string }>()
  const { empresa, carregando: carregandoEmpresa, naoEncontrada } = useEmpresaPublica(slug)
  const { servicos, carregando: carregandoServicos } = useServicosPublicos(empresa?.id)
  const { funcionarios, carregando: carregandoFuncionarios } = useFuncionariosPublicos(empresa?.id)

  const [etapa, setEtapa] = useState<Etapa>('servico')
  const [servico, setServico] = useState<ServicoPublico | null>(null)
  const [funcionario, setFuncionario] = useState<FuncionarioPublico | null>(null)
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)
  const [horarios, setHorarios] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [bioExpandida, setBioExpandida] = useState(false)

  const dias = useMemo(() => proximosDias(14), [])
  const [segundosParaReiniciar, setSegundosParaReiniciar] = useState(8)

  function reiniciarFluxo() {
    setEtapa('servico')
    setServico(null)
    setFuncionario(null)
    setDiaSelecionado(null)
    setHorarios([])
    setHorarioSelecionado(null)
    setNome('')
    setWhatsapp('')
    setEmail('')
    setErro(null)
  }

  useEffect(() => {
    if (etapa !== 'confirmado') return
    setSegundosParaReiniciar(8)

    const contador = setInterval(() => {
      setSegundosParaReiniciar((s) => s - 1)
    }, 1000)

    const timeout = setTimeout(() => {
      reiniciarFluxo()
    }, 8000)

    return () => {
      clearInterval(contador)
      clearTimeout(timeout)
    }
  }, [etapa])

  useEffect(() => {
    if (empresa?.cor_primaria) {
      document.documentElement.style.setProperty('--color-brand-500', empresa.cor_primaria)
    }
  }, [empresa?.cor_primaria])

  useEffect(() => {
    if (!empresa?.id || !funcionario || !servico || !diaSelecionado) return
    setCarregandoHorarios(true)
    setHorarioSelecionado(null)
    const diaISO = diaSelecionado.toISOString().slice(0, 10)
    buscarHorariosDisponiveis(empresa.id, funcionario.id, servico.id, diaISO).then((lista) => {
      // Remove horários que já passaram (evita agendamento no passado no mesmo dia)
      const agora = new Date()
      const ehHoje = diaSelecionado.toDateString() === agora.toDateString()
      const filtrada = ehHoje
        ? lista.filter((h) => new Date(h).getTime() > agora.getTime())
        : lista
      setHorarios(filtrada)
      setCarregandoHorarios(false)
    })
  }, [empresa?.id, funcionario, servico, diaSelecionado])

  async function confirmarAgendamento() {
    if (!empresa || !servico || !funcionario || !horarioSelecionado) return
    if (!nome.trim() || !whatsapp.trim()) {
      setErro('Preencha nome e WhatsApp para continuar.')
      return
    }

    setEnviando(true)
    setErro(null)

    const resultado = await criarAgendamentoPublico({
      empresaId: empresa.id,
      servicoId: servico.id,
      funcionarioId: funcionario.id,
      dataHoraInicio: horarioSelecionado,
      nome,
      telefone: whatsapp,
      whatsapp,
      email,
    })

    setEnviando(false)

    if (resultado.mensagem_erro) {
      setErro(resultado.mensagem_erro)
      return
    }

    setEtapa('confirmado')
  }

  if (carregandoEmpresa) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Carregando…</div>
  }

  if (naoEncontrada || !empresa) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-lg font-semibold text-gray-900">Página não encontrada</p>
        <p className="text-sm text-gray-500">Verifique se o link de agendamento está correto.</p>
      </div>
    )
  }

  const bioLimpa = empresa.descricao_publica ? limparTexto(empresa.descricao_publica) : null
  const bioEhLonga = (bioLimpa?.length ?? 0) > 160
  const bioExibida = bioEhLonga && !bioExpandida ? `${bioLimpa!.slice(0, 160).trim()}…` : bioLimpa

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero: banner com overlay + logo sobreposto, estilo página de negócio */}
      <div className="relative">
        <div
          className="h-44 w-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-500)]/60 bg-cover bg-center sm:h-56"
          style={empresa.banner_url ? { backgroundImage: `url(${empresa.banner_url})` } : undefined}
        />
        {/* Esmaece a base do banner para a transição com o conteúdo ficar suave */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </div>

      <header className="bg-gray-50 px-4 pb-6 text-center">
        <div className="mx-auto -mt-12 mb-3 flex justify-center sm:-mt-14">
          {empresa.logo_url ? (
            <img
              src={empresa.logo_url}
              alt={empresa.nome}
              className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-[var(--color-brand-500)] font-display text-2xl font-semibold text-white shadow-md sm:h-28 sm:w-28">
              {empresa.nome[0]}
            </div>
          )}
        </div>

        <h1 className="text-xl font-semibold text-gray-900">{empresa.nome}</h1>

        {bioExibida && (
          <div className="mx-auto mt-2 max-w-md">
            <p className="text-sm leading-relaxed text-gray-500">{bioExibida}</p>
            {bioEhLonga && (
              <button
                onClick={() => setBioExpandida((v) => !v)}
                className="mt-1 text-xs font-medium text-[var(--color-brand-500)]"
              >
                {bioExpandida ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>
        )}

        <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
          {empresa.instagram && (
            <a
              href={`https://instagram.com/${empresa.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[var(--color-brand-500)]"
            >
              <AtSign className="h-3.5 w-3.5" />
              {empresa.instagram}
            </a>
          )}
          {empresa.telefone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {empresa.telefone}
            </span>
          )}
          {empresa.endereco && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {empresa.endereco}
              {empresa.cidade ? `, ${empresa.cidade}` : ''}
            </span>
          )}
          {empresa.horario_funcionamento && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {empresa.horario_funcionamento}
            </span>
          )}
        </div>

        <button
          onClick={() => document.getElementById('fluxo-agendamento')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-5 rounded-md bg-[var(--color-brand-500)] px-6 py-2.5 text-sm font-medium text-white shadow-sm"
        >
          Agendar horário
        </button>
      </header>

      <div id="fluxo-agendamento" className="border-t border-gray-200 bg-white" />

      <main className="mx-auto max-w-md px-4 py-6">
        {etapa !== 'servico' && etapa !== 'confirmado' && (
          <button
            onClick={() => {
              const ordem: Etapa[] = ['servico', 'profissional', 'data', 'horario', 'dados']
              const idx = ordem.indexOf(etapa)
              setEtapa(ordem[Math.max(idx - 1, 0)])
            }}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
        )}

        {etapa === 'servico' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">1. Escolha o serviço</h2>
            {carregandoServicos ? (
              <p className="text-sm text-gray-400">Carregando serviços…</p>
            ) : servicos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum serviço disponível no momento.</p>
            ) : (
              servicos.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServico(s)
                    setEtapa('profissional')
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-[var(--color-brand-500)]"
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.nome}</p>
                    <p className="text-xs text-gray-500">{s.duracao_minutos} min</p>
                  </div>
                  <span className="font-medium text-[var(--color-brand-500)]">{formatCurrency(s.valor)}</span>
                </button>
              ))
            )}
          </div>
        )}

        {etapa === 'profissional' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">2. Escolha o profissional</h2>
            {carregandoFuncionarios ? (
              <p className="text-sm text-gray-400">Carregando profissionais…</p>
            ) : funcionarios.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum profissional disponível no momento.</p>
            ) : (
              funcionarios.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFuncionario(f)
                    setEtapa('data')
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-[var(--color-brand-500)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{f.nome}</p>
                    {f.cargo && <p className="text-xs text-gray-500">{f.cargo}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {etapa === 'data' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">3. Escolha a data</h2>
            <div className="grid grid-cols-4 gap-2">
              {dias.map((d) => (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    setDiaSelecionado(d)
                    setEtapa('horario')
                  }}
                  className="flex flex-col items-center rounded-lg border border-gray-200 bg-white py-3 hover:border-[var(--color-brand-500)]"
                >
                  <span className="text-xs capitalize text-gray-400">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className="text-base font-semibold text-gray-900">{d.getDate()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {etapa === 'horario' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">4. Escolha o horário</h2>
            {carregandoHorarios ? (
              <p className="text-sm text-gray-400">Buscando horários…</p>
            ) : horarios.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum horário disponível neste dia. Volte e escolha outra data.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {horarios.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setHorarioSelecionado(h)
                      setEtapa('dados')
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-900 hover:border-[var(--color-brand-500)]"
                  >
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {new Date(h).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {etapa === 'dados' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">5. Seus dados</h2>

            <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium text-gray-900">{servico?.nome}</p>
              <p className="text-gray-500">
                com {funcionario?.nome} · {diaSelecionado?.toLocaleDateString('pt-BR')} às{' '}
                {horarioSelecionado &&
                  new Date(horarioSelecionado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Nome completo</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)]"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">WhatsApp</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)]"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">E-mail (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)]"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

            <button
              onClick={confirmarAgendamento}
              disabled={enviando}
              className="w-full rounded-md bg-[var(--color-brand-500)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {enviando ? 'Confirmando…' : 'Confirmar agendamento'}
            </button>
          </div>
        )}

        {etapa === 'confirmado' && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Agendamento confirmado!</h2>
            <p className="max-w-xs text-sm text-gray-500">
              {servico?.nome} com {funcionario?.nome} em {diaSelecionado?.toLocaleDateString('pt-BR')} às{' '}
              {horarioSelecionado &&
                new Date(horarioSelecionado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Voltando ao início em {segundosParaReiniciar}s…
            </div>
            <button
              onClick={reiniciarFluxo}
              className="mt-1 text-xs font-medium text-[var(--color-brand-500)] underline"
            >
              Fazer novo agendamento agora
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
