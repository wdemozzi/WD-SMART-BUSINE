import { useEffect, useState } from 'react'
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

function hojeISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function maxISO() {
  const d = new Date()
  d.setDate(d.getDate() + 60)
  return d.toISOString().slice(0, 10)
}

// Remove marcações de markdown que às vezes vêm coladas de outro lugar
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
  const [dataDigitada, setDataDigitada] = useState('')
  const [horarios, setHorarios] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [horaDigitada, setHoraDigitada] = useState('')
  const [erroHorario, setErroHorario] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [bioExpandida, setBioExpandida] = useState(false)

  const [segundosParaReiniciar, setSegundosParaReiniciar] = useState(8)

  function reiniciarFluxo() {
    setEtapa('servico')
    setServico(null)
    setFuncionario(null)
    setDataDigitada('')
    setHorarios([])
    setHoraDigitada('')
    setErroHorario(null)
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

  // Carrega horários disponíveis quando data, serviço e profissional estão definidos
  useEffect(() => {
    if (!empresa?.id || !funcionario || !servico || !dataDigitada) {
      setHorarios([])
      return
    }
    setCarregandoHorarios(true)
    setHoraDigitada('')
    setErroHorario(null)
    buscarHorariosDisponiveis(empresa.id, funcionario.id, servico.id, dataDigitada).then((lista) => {
      const agora = new Date()
      const ehHoje = dataDigitada === hojeISO()
      const filtrada = ehHoje
        ? lista.filter((h: string) => new Date(h).getTime() > agora.getTime())
        : lista
      setHorarios(filtrada)
      setCarregandoHorarios(false)
    })
  }, [empresa?.id, funcionario, servico, dataDigitada])

  function avancarParaHorario() {
    if (!dataDigitada) return
    setHoraDigitada('')
    setErroHorario(null)
    setEtapa('horario')
  }

  function confirmarHorario() {
    if (!horaDigitada) return
    setErroHorario(null)

    // Monta data/hora completa e valida contra a lista de disponíveis
    const dataHora = new Date(`${dataDigitada}T${horaDigitada}:00`)

    if (isNaN(dataHora.getTime())) {
      setErroHorario('Hora inválida. Use o formato HH:MM.')
      return
    }

    // Verifica se está na lista de horários disponíveis
    const iso = dataHora.toISOString()
    if (horarios.length > 0 && !horarios.includes(iso)) {
      setErroHorario('Este horário não está disponível. Escolha outro.')
      return
    }

    // Verifica se não é no passado
    if (dataHora.getTime() <= new Date().getTime()) {
      setErroHorario('Não é possível agendar em um horário que já passou.')
      return
    }

    setEtapa('dados')
  }

  async function confirmarAgendamento() {
    if (!empresa || !servico || !funcionario || !horaDigitada || !dataDigitada) return
    if (!nome.trim() || !whatsapp.trim()) {
      setErro('Preencha nome e WhatsApp para continuar.')
      return
    }

    const dataHora = new Date(`${dataDigitada}T${horaDigitada}:00`)
    if (isNaN(dataHora.getTime())) {
      setErro('Data ou horário inválido.')
      return
    }

    setEnviando(true)
    setErro(null)

    const resultado = await criarAgendamentoPublico({
      empresaId: empresa.id,
      servicoId: servico.id,
      funcionarioId: funcionario.id,
      dataHoraInicio: dataHora.toISOString(),
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
      {/* Hero */}
      <div className="relative">
        <div
          className="h-44 w-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-500)]/60 bg-cover bg-center sm:h-56"
          style={empresa.banner_url ? { backgroundImage: `url(${empresa.banner_url})` } : undefined}
        />
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

        {/* Etapa 1 — Serviço */}
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

        {/* Etapa 2 — Profissional */}
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

        {/* Etapa 3 — Digitar data */}
        {etapa === 'data' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">3. Digite a data</h2>
            <p className="text-sm text-gray-500">
              Escolha um dia para o seu agendamento. Datas indisponíveis não terão horários livres.
            </p>

            <input
              type="date"
              value={dataDigitada}
              onChange={(e) => setDataDigitada(e.target.value)}
              min={hojeISO()}
              max={maxISO()}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
            />

            <button
              onClick={avancarParaHorario}
              disabled={!dataDigitada}
              className="w-full rounded-md bg-[var(--color-brand-500)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Ver horários disponíveis
            </button>
          </div>
        )}

        {/* Etapa 4 — Digitar hora */}
        {etapa === 'horario' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">4. Digite o horário</h2>

            {carregandoHorarios ? (
              <p className="text-sm text-gray-400">Buscando horários livres…</p>
            ) : horarios.length === 0 && dataDigitada ? (
              <p className="text-sm text-gray-400">Nenhum horário disponível neste dia. Volte e escolha outra data.</p>
            ) : null}

            {/* Input de hora */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">
                Horário desejado
              </label>
              <input
                type="time"
                value={horaDigitada}
                onChange={(e) => {
                  setHoraDigitada(e.target.value)
                  setErroHorario(null)
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
              />

              {/* Sugestões de horários disponíveis */}
              {horarios.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {horarios.slice(0, 12).map((h) => {
                    const hora = new Date(h).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setHoraDigitada(new Date(h).toTimeString().slice(0, 5))
                          setErroHorario(null)
                        }}
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)]"
                      >
                        {hora}
                      </button>
                    )
                  })}
                </div>
              )}

              {erroHorario && (
                <p className="text-xs text-red-600">{erroHorario}</p>
              )}
            </div>

            <button
              onClick={confirmarHorario}
              disabled={!horaDigitada}
              className="w-full rounded-md bg-[var(--color-brand-500)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Etapa 5 — Dados pessoais */}
        {etapa === 'dados' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">5. Seus dados</h2>

            <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium text-gray-900">{servico?.nome}</p>
              <p className="text-gray-500">
                com {funcionario?.nome} · {dataDigitada && new Date(dataDigitada + 'T12:00').toLocaleDateString('pt-BR')} às{' '}
                {horaDigitada}
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
                  inputMode="tel"
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
              {servico?.nome} com {funcionario?.nome} em{' '}
              {dataDigitada && new Date(dataDigitada + 'T12:00').toLocaleDateString('pt-BR')} às{' '}
              {horaDigitada}
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
