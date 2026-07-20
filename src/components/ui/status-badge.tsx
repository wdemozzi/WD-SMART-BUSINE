import { cn } from '@/lib/utils'

type Tom = 'neutro' | 'sucesso' | 'atencao' | 'erro' | 'info'

const tons: Record<Tom, { texto: string; ponto: string; fundo: string }> = {
  neutro: { texto: 'text-[var(--color-ink-600)]', ponto: 'bg-[var(--color-ink-400)]', fundo: 'bg-[var(--color-canvas)]' },
  sucesso: { texto: 'text-success-500', ponto: 'bg-success-500', fundo: 'bg-success-50' },
  atencao: { texto: 'text-warning-500', ponto: 'bg-warning-500', fundo: 'bg-warning-50' },
  erro: { texto: 'text-danger-500', ponto: 'bg-danger-500', fundo: 'bg-danger-50' },
  info: { texto: 'text-info-500', ponto: 'bg-info-500', fundo: 'bg-info-50' },
}

// Mapeamento centralizado: todo status do sistema aponta para um único tom,
// garantindo que "confirmado" tenha sempre a mesma cor em Agenda, CRM e Financeiro.
const statusParaTom: Record<string, Tom> = {
  agendado: 'info',
  confirmado: 'sucesso',
  em_andamento: 'atencao',
  concluido: 'sucesso',
  cancelado: 'erro',
  nao_compareceu: 'erro',
  pendente: 'atencao',
  pago: 'sucesso',
  atrasado: 'erro',
  estornado: 'neutro',
}

const rotulos: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  estornado: 'Estornado',
}

const explicacoes: Record<string, string> = {
  agendado: 'O horário foi reservado, mas ainda não foi confirmado pelo cliente.',
  confirmado: 'O cliente confirmou presença para este horário.',
  em_andamento: 'O atendimento está acontecendo agora.',
  concluido: 'O atendimento foi finalizado.',
  cancelado: 'Este agendamento foi cancelado.',
  nao_compareceu: 'O cliente não compareceu a este horário.',
  pendente: 'Pagamento ainda não foi realizado.',
  pago: 'Pagamento confirmado.',
  atrasado: 'O pagamento está com o prazo vencido.',
  estornado: 'O valor foi devolvido ao cliente.',
}

export function StatusBadge({ status }: { status: string }) {
  const tom = tons[statusParaTom[status] ?? 'neutro']
  const rotulo = rotulos[status] ?? status

  return (
    <span
      title={explicacoes[status]}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tom.texto,
        tom.fundo
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tom.ponto)} />
      {rotulo}
    </span>
  )
}
