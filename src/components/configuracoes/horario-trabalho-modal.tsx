import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useFuncionarioHorarios, DIAS_SEMANA } from '@/hooks/use-funcionario-horarios'
import type { Funcionario } from '@/types/database'

interface DiaConfig {
  ativo: boolean
  inicio: string
  fim: string
}

const diaVazio: DiaConfig = { ativo: false, inicio: '09:00', fim: '18:00' }

export function HorarioTrabalhoModal({
  funcionario,
  onFechar,
}: {
  funcionario: Funcionario | null
  onFechar: () => void
}) {
  const { horarios, carregando, definirDia } = useFuncionarioHorarios(funcionario?.id)
  const [dias, setDias] = useState<DiaConfig[]>(Array.from({ length: 7 }, () => ({ ...diaVazio })))
  const [salvando, setSalvando] = useState<number | null>(null)

  useEffect(() => {
    const novo = Array.from({ length: 7 }, (_, i) => {
      const existente = horarios.find((h) => h.dia_semana === i)
      return existente
        ? { ativo: true, inicio: existente.hora_inicio.slice(0, 5), fim: existente.hora_fim.slice(0, 5) }
        : { ...diaVazio }
    })
    setDias(novo)
  }, [horarios])

  if (!funcionario) return null

  function atualizarDia(indice: number, campo: keyof DiaConfig, valor: string | boolean) {
    setDias((atual) => atual.map((d, i) => (i === indice ? { ...d, [campo]: valor } : d)))
  }

  async function salvarDia(indice: number) {
    setSalvando(indice)
    const d = dias[indice]
    await definirDia(indice, d.ativo, `${d.inicio}:00`, `${d.fim}:00`)
    setSalvando(null)
  }

  return (
    <Dialog aberto={!!funcionario} onFechar={onFechar} titulo={`Horário de trabalho — ${funcionario.nome}`} largura="max-w-lg">
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-ink-400)]">
          Marque os dias em que {funcionario.nome.split(' ')[0]} atende e defina o horário. Isso controla quais
          horários aparecem na Agenda e no agendamento online.
        </p>

        {carregando ? (
          <p className="text-sm text-[var(--color-ink-400)]">Carregando…</p>
        ) : (
          <div className="space-y-2">
            {DIAS_SEMANA.map((nomeDia, i) => (
              <div
                key={nomeDia}
                className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2"
              >
                <label className="flex w-28 shrink-0 items-center gap-2 text-sm font-medium text-[var(--color-ink-900)]">
                  <input
                    type="checkbox"
                    checked={dias[i].ativo}
                    onChange={(e) => atualizarDia(i, 'ativo', e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border)] accent-brand-500"
                  />
                  {nomeDia}
                </label>

                {dias[i].ativo && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={dias[i].inicio}
                      onChange={(e) => atualizarDia(i, 'inicio', e.target.value)}
                      className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-[var(--color-ink-400)]">até</span>
                    <input
                      type="time"
                      value={dias[i].fim}
                      onChange={(e) => atualizarDia(i, 'fim', e.target.value)}
                      className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
                    />
                  </div>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  className="ml-auto"
                  onClick={() => salvarDia(i)}
                  disabled={salvando === i}
                >
                  {salvando === i ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onFechar}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
