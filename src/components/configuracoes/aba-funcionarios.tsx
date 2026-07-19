import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFuncionarios } from '@/hooks/use-funcionarios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FuncionarioFormModal } from '@/components/configuracoes/funcionario-form-modal'
import { HorarioTrabalhoModal } from '@/components/configuracoes/horario-trabalho-modal'
import type { Funcionario } from '@/types/database'

export function AbaFuncionarios() {
  const { empresa } = useAuth()
  const { funcionarios, carregando, erro, criar, atualizar, excluir } = useFuncionarios(empresa?.id)
  const [modalAberto, setModalAberto] = useState(false)
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState<Funcionario | null>(null)
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState<Funcionario | null>(null)
  const [funcionarioHorario, setFuncionarioHorario] = useState<Funcionario | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function confirmarExclusao() {
    if (!funcionarioParaExcluir) return
    setExcluindo(true)
    await excluir(funcionarioParaExcluir.id)
    setExcluindo(false)
    setFuncionarioParaExcluir(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-400)]">
          Profissionais que realizam os atendimentos e aparecem na agenda.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setFuncionarioEmEdicao(null)
            setModalAberto(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo profissional
        </Button>
      </div>

      {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-ink-600)]">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-ink-400)]">
                  Carregando…
                </td>
              </tr>
            ) : funcionarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--color-ink-400)]">
                  Nenhum profissional cadastrado ainda.
                </td>
              </tr>
            ) : (
              funcionarios.map((f) => (
                <tr key={f.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-canvas)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink-900)]">{f.nome}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-600)]">{f.cargo ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={f.ativo ? 'text-success-500' : 'text-[var(--color-ink-400)]'}>
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Horário de trabalho"
                        onClick={() => setFuncionarioHorario(f)}
                      >
                        <Clock className="h-4 w-4 text-brand-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        onClick={() => {
                          setFuncionarioEmEdicao(f)
                          setModalAberto(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir"
                        onClick={() => setFuncionarioParaExcluir(f)}
                      >
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <FuncionarioFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        funcionarioEmEdicao={funcionarioEmEdicao}
        aoSalvar={(valores) =>
          funcionarioEmEdicao ? atualizar(funcionarioEmEdicao.id, valores) : criar(valores)
        }
      />

      <ConfirmDialog
        aberto={!!funcionarioParaExcluir}
        onFechar={() => setFuncionarioParaExcluir(null)}
        titulo="Excluir profissional"
        mensagem={`Tem certeza que deseja excluir "${funcionarioParaExcluir?.nome}"?`}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluindo}
      />

      <HorarioTrabalhoModal funcionario={funcionarioHorario} onFechar={() => setFuncionarioHorario(null)} />
    </div>
  )
}
