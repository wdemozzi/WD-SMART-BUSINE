import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Tag, X, Clock, AlertTriangle, Sparkles } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Select, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { aplicarCupom, previsualizarCupom } from '@/hooks/use-cupons'
import { buscarHorariosDisponiveis } from '@/hooks/use-agendamento-publico'
import { buscarPacoteDisponivel } from '@/hooks/use-vendas-pacotes'
import { buscarOcorrenciaCliente, buscarUltimoAtendimento, type OcorrenciaCliente } from '@/hooks/use-ocorrencias-clientes'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Cliente, Servico, Funcionario } from '@/types/database'

interface NovoAgendamentoModalProps {
  aberto: boolean
  onFechar: () => void
  empresaId: string
  clientes: Cliente[]
  servicos: Servico[]
  funcionarios: Funcionario[]
  dataInicial: Date
  preenchimentoInicial?: { clienteId: string; servicoId: string; funcionarioId: string | null }
  aoCriar: (payload: {
    cliente_id: string
    servico_id: string
    funcionario_id: string | null
    data_hora_inicio: string
    data_hora_fim: string
    valor: number | null
    cupom_id: string | null
    valor_desconto: number | null
    venda_pacote_id: string | null
    observacoes?: string
  }) => Promise<unknown>
}

function proximosDias(quantidade: number, aPartirDe: Date) {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(aPartirDe)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    return d
  })
}

function paraInputDatetimeLocal(data: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

export function NovoAgendamentoModal({
  aberto,
  onFechar,
  empresaId,
  clientes,
  servicos,
  funcionarios,
  dataInicial,
  preenchimentoInicial,
  aoCriar,
}: NovoAgendamentoModalProps) {
  const [clienteId, setClienteId] = useState(preenchimentoInicial?.clienteId ?? '')
  const [servicoId, setServicoId] = useState(preenchimentoInicial?.servicoId ?? '')
  const [funcionarioId, setFuncionarioId] = useState(preenchimentoInicial?.funcionarioId ?? '')
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)
  const [horarios, setHorarios] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)
  const [inicioManual, setInicioManual] = useState(paraInputDatetimeLocal(dataInicial))
  const [observacoes, setObservacoes] = useState('')
  const [codigoCupom, setCodigoCupom] = useState('')
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [cupomAplicado, setCupomAplicado] = useState<{ id: string; codigo: string; desconto: number } | null>(null)
  const [erroCupom, setErroCupom] = useState<string | null>(null)
  const [pacoteDisponivel, setPacoteDisponivel] = useState<{ vendaPacoteId: string; pacoteNome: string; restantes: number } | null>(null)
  const [usarPacote, setUsarPacote] = useState(false)
  const [ocorrenciaCliente, setOcorrenciaCliente] = useState<OcorrenciaCliente | null>(null)
  const [sugestaoRepetir, setSugestaoRepetir] = useState<Awaited<ReturnType<typeof buscarUltimoAtendimento>>>(null)
  const [sugestaoDispensada, setSugestaoDispensada] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (aberto && preenchimentoInicial) {
      setClienteId(preenchimentoInicial.clienteId)
      setServicoId(preenchimentoInicial.servicoId)
      setFuncionarioId(preenchimentoInicial.funcionarioId ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, preenchimentoInicial])

  const dias = useMemo(() => proximosDias(14, new Date()), [])

  const servicoSelecionado = useMemo(() => servicos.find((s) => s.id === servicoId), [servicos, servicoId])

  useEffect(() => {
    setCupomAplicado(null)
    setErroCupom(null)
  }, [servicoId])

  useEffect(() => {
    setPacoteDisponivel(null)
    setUsarPacote(false)
    if (!clienteId || !servicoId) return
    buscarPacoteDisponivel(clienteId, servicoId).then(setPacoteDisponivel)
  }, [clienteId, servicoId])

  useEffect(() => {
    setOcorrenciaCliente(null)
    if (!clienteId) return
    buscarOcorrenciaCliente(clienteId).then(setOcorrenciaCliente)
  }, [clienteId])

  useEffect(() => {
    setSugestaoRepetir(null)
    setSugestaoDispensada(false)
    if (!clienteId) return
    buscarUltimoAtendimento(clienteId).then(setSugestaoRepetir)
  }, [clienteId])

  function aplicarSugestao() {
    if (!sugestaoRepetir) return
    setServicoId(sugestaoRepetir.servicoId)
    setFuncionarioId(sugestaoRepetir.funcionarioId ?? '')
    setSugestaoDispensada(true)
  }

  // Reseta a seleção de dia/horário quando trocam serviço ou profissional
  useEffect(() => {
    setDiaSelecionado(null)
    setHorarioSelecionado(null)
    setHorarios([])
  }, [servicoId, funcionarioId])

  useEffect(() => {
    if (!diaSelecionado || !servicoId || !funcionarioId) return
    setCarregandoHorarios(true)
    setHorarioSelecionado(null)
    const diaISO = diaSelecionado.toISOString().slice(0, 10)
    buscarHorariosDisponiveis(empresaId, funcionarioId, servicoId, diaISO).then((lista) => {
      setHorarios(lista)
      setCarregandoHorarios(false)
    })
  }, [diaSelecionado, servicoId, funcionarioId, empresaId])

  async function handleAplicarCupom() {
    if (!codigoCupom.trim() || !servicoSelecionado) return
    setValidandoCupom(true)
    setErroCupom(null)

    const resultado = await previsualizarCupom(empresaId, codigoCupom.trim(), servicoSelecionado.valor, clienteId || null)
    setValidandoCupom(false)

    if (!resultado.valido) {
      setErroCupom(resultado.mensagem)
      setCupomAplicado(null)
      return
    }

    setCupomAplicado({ id: resultado.cupomId!, codigo: codigoCupom.trim().toUpperCase(), desconto: resultado.desconto })
  }

  function removerCupom() {
    setCupomAplicado(null)
    setCodigoCupom('')
    setErroCupom(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!clienteId || !servicoId) {
      setErro('Selecione o cliente e o serviço.')
      return
    }

    // Com profissional escolhido, usa o horário do grid; sem preferência, usa o campo manual
    const dataInicio = funcionarioId && horarioSelecionado ? new Date(horarioSelecionado) : new Date(inicioManual)

    if (funcionarioId && !horarioSelecionado) {
      setErro('Escolha um horário disponível.')
      return
    }

    const duracao = servicoSelecionado?.duracao_minutos ?? 30
    const dataFim = new Date(dataInicio.getTime() + duracao * 60000)
    const valorOriginal = servicoSelecionado?.valor ?? 0

    setEnviando(true)

    let cupomId: string | null = null
    let valorDesconto: number | null = null
    let valorFinal = valorOriginal

    if (usarPacote && pacoteDisponivel) {
      valorFinal = 0
    } else if (cupomAplicado) {
      const resultado = await aplicarCupom(empresaId, cupomAplicado.codigo, valorOriginal, clienteId || null)
      if (resultado.mensagem_erro) {
        setEnviando(false)
        setErroCupom(resultado.mensagem_erro)
        setCupomAplicado(null)
        return
      }
      cupomId = resultado.cupom_id
      valorDesconto = resultado.valor_desconto
      valorFinal = resultado.valor_final
    }

    const resultado = await aoCriar({
      cliente_id: clienteId,
      servico_id: servicoId,
      funcionario_id: funcionarioId || null,
      data_hora_inicio: dataInicio.toISOString(),
      data_hora_fim: dataFim.toISOString(),
      valor: valorFinal,
      cupom_id: cupomId,
      valor_desconto: valorDesconto,
      venda_pacote_id: usarPacote && pacoteDisponivel ? pacoteDisponivel.vendaPacoteId : null,
      observacoes: observacoes || undefined,
    })
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível criar o agendamento. Verifique se o horário está livre.')
      return
    }

    setClienteId('')
    setServicoId('')
    setFuncionarioId('')
    setDiaSelecionado(null)
    setHorarioSelecionado(null)
    setObservacoes('')
    removerCupom()
    onFechar()
  }

  return (
    <Dialog aberto={aberto} onFechar={onFechar} titulo="Novo agendamento" largura="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          {ocorrenciaCliente && (
            <p className="mt-1.5 flex items-start gap-1.5 rounded-md bg-warning-50 px-2.5 py-1.5 text-xs text-warning-500">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {ocorrenciaCliente.total_faltas > 0 &&
                  `Já faltou ${ocorrenciaCliente.total_faltas}x. `}
                {ocorrenciaCliente.cancelamentos_ultima_hora > 0 &&
                  `Cancelou em cima da hora ${ocorrenciaCliente.cancelamentos_ultima_hora}x. `}
                {ocorrenciaCliente.total_reagendamentos > 0 &&
                  `Já remarcou ${ocorrenciaCliente.total_reagendamentos}x.`}
              </span>
            </p>
          )}
        </div>

        {sugestaoRepetir && !sugestaoDispensada && (
          <div className="flex items-start gap-2 rounded-md border border-brand-500/30 bg-brand-50 px-3 py-2 text-xs dark:bg-brand-500/10">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
            <div className="flex-1">
              <p className="text-brand-700 dark:text-brand-400">
                Na última visita ({formatDate(sugestaoRepetir.dataHoraInicio)}), fez{' '}
                <strong>{sugestaoRepetir.servicoNome}</strong>
                {sugestaoRepetir.funcionarioNome && <> com {sugestaoRepetir.funcionarioNome}</>}. Repetir o mesmo?
              </p>
              <div className="mt-1.5 flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={aplicarSugestao}>
                  Repetir atendimento
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSugestaoDispensada(true)}>
                  Não, obrigado
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="servico">Serviço</Label>
            <Select id="servico" value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
              <option value="">Selecione</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.duracao_minutos}min)
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="funcionario">Profissional</Label>
            <Select id="funcionario" value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
              <option value="">Sem preferência</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {!servicoId ? (
          <p className="rounded-md bg-[var(--color-canvas)] px-3 py-2 text-xs text-[var(--color-ink-400)]">
            Escolha um serviço para ver as datas e horários disponíveis.
          </p>
        ) : !funcionarioId ? (
          <div>
            <Label htmlFor="inicio-manual">Data e horário</Label>
            <Input id="inicio-manual" type="datetime-local" value={inicioManual} onChange={(e) => setInicioManual(e.target.value)} required />
            <p className="mt-1 text-xs text-[var(--color-ink-400)]">
              Escolha um profissional específico para ver a grade de horários livres automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Data</Label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {dias.map((d) => {
                  const ativo = diaSelecionado?.toDateString() === d.toDateString()
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setDiaSelecionado(d)}
                      className={cn(
                        'flex shrink-0 flex-col items-center rounded-md border px-2.5 py-1.5 text-xs',
                        ativo
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10'
                          : 'border-[var(--color-border)] text-[var(--color-ink-600)] hover:border-brand-500'
                      )}
                    >
                      <span className="capitalize text-[10px] text-[var(--color-ink-400)]">
                        {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </span>
                      <span className="font-semibold">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {diaSelecionado && (
              <div>
                <Label>Horário</Label>
                {carregandoHorarios ? (
                  <p className="text-xs text-[var(--color-ink-400)]">Buscando horários livres…</p>
                ) : horarios.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-400)]">Nenhum horário livre neste dia. Escolha outra data.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {horarios.map((h) => {
                      const ativo = horarioSelecionado === h
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHorarioSelecionado(h)}
                          className={cn(
                            'flex items-center justify-center gap-1 rounded-md border py-1.5 text-xs font-medium',
                            ativo
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-[var(--color-border)] text-[var(--color-ink-900)] hover:border-brand-500'
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {new Date(h).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="observacoes">Observações (opcional)</Label>
          <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        {pacoteDisponivel && (
          <label className="flex items-center gap-2 rounded-md border border-brand-500/30 bg-brand-50 px-3 py-2 text-sm dark:bg-brand-500/10">
            <input
              type="checkbox"
              checked={usarPacote}
              onChange={(e) => setUsarPacote(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
            />
            <span className="text-brand-700 dark:text-brand-400">
              Usar sessão do pacote <strong>{pacoteDisponivel.pacoteNome}</strong> ({pacoteDisponivel.restantes} restantes)
            </span>
          </label>
        )}

        {!usarPacote && (
          <div>
            <Label htmlFor="cupom">Cupom de desconto (opcional)</Label>
            {cupomAplicado ? (
              <div className="flex items-center justify-between rounded-md border border-success-500/30 bg-success-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 font-medium text-success-500">
                  <Tag className="h-3.5 w-3.5" />
                  {cupomAplicado.codigo} aplicado — desconto de {formatCurrency(cupomAplicado.desconto)}
                </span>
                <button type="button" onClick={removerCupom} aria-label="Remover cupom">
                  <X className="h-4 w-4 text-success-500" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="cupom"
                  value={codigoCupom}
                  onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                  placeholder="Ex: BEMVINDO10"
                  disabled={!servicoId}
                />
                <Button type="button" variant="secondary" onClick={handleAplicarCupom} disabled={!servicoId || validandoCupom}>
                  {validandoCupom ? 'Validando…' : 'Aplicar'}
                </Button>
              </div>
            )}
            {!servicoId && <p className="mt-1 text-xs text-[var(--color-ink-400)]">Selecione um serviço primeiro.</p>}
            {erroCupom && <p className="mt-1 text-xs text-danger-500">{erroCupom}</p>}
          </div>
        )}

        {servicoSelecionado && (
          <div className="rounded-md bg-[var(--color-canvas)] px-3 py-2 text-sm">
            {usarPacote ? (
              <div className="flex justify-between font-medium text-[var(--color-ink-900)]">
                <span>Total (sessão do pacote)</span>
                <span className="font-data text-success-500">Grátis</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-[var(--color-ink-600)]">
                  <span>Valor do serviço</span>
                  <span className="font-data">{formatCurrency(servicoSelecionado.valor)}</span>
                </div>
                {cupomAplicado && (
                  <div className="flex justify-between text-success-500">
                    <span>Desconto</span>
                    <span className="font-data">- {formatCurrency(cupomAplicado.desconto)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-[var(--color-border)] pt-1 font-medium text-[var(--color-ink-900)]">
                  <span>Total</span>
                  <span className="font-data">{formatCurrency(servicoSelecionado.valor - (cupomAplicado?.desconto ?? 0))}</span>
                </div>
              </>
            )}
          </div>
        )}

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Criar agendamento'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
