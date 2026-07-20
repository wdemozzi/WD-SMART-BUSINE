// Tipos manuais alinhados ao schema SQL (database/00*.sql).
// Em produção, substitua por: `supabase gen types typescript --project-id SEU_PROJETO`

export type UserRole = 'super_admin' | 'admin_empresa' | 'funcionario' | 'cliente_final'

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'nao_compareceu'

export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado' | 'estornado'

export interface Empresa {
  id: string
  nome: string
  slug: string
  segmento: string
  logo_url: string | null
  cor_primaria: string
  status: 'ativa' | 'inadimplente' | 'suspensa' | 'cancelada' | 'trial'
  trial_expira_em: string | null
}

export interface Perfil {
  id: string
  empresa_id: string | null
  role: UserRole
  nome_completo: string
  avatar_url: string | null
}

export interface Cliente {
  id: string
  empresa_id: string
  nome: string
  telefone: string | null
  whatsapp: string | null
  email: string | null
  cidade: string | null
  criado_em: string
}

export interface Servico {
  id: string
  empresa_id: string
  nome: string
  valor: number
  duracao_minutos: number
  categoria: string | null
  ativo: boolean
}

export interface Funcionario {
  id: string
  empresa_id: string
  nome: string
  cargo: string | null
  ativo: boolean
  percentual_comissao: number | null
}

export interface Agendamento {
  id: string
  empresa_id: string
  cliente_id: string
  funcionario_id: string | null
  servico_id: string
  data_hora_inicio: string
  data_hora_fim: string
  status: StatusAgendamento
  valor: number | null
  origem?: string
}

export type TipoDesconto = 'percentual' | 'valor_fixo'

export interface Cupom {
  id: string
  empresa_id: string
  codigo: string
  descricao: string | null
  tipo: TipoDesconto
  valor: number
  validade: string | null
  limite_uso: number | null
  limite_uso_por_cliente: number | null
  quantidade_usada: number
  ativo: boolean
  criado_em: string
}

export interface FidelidadeConfig {
  empresa_id: string
  ativo: boolean
  pontos_por_real: number
  descricao: string | null
}

export interface FidelidadeRecompensa {
  id: string
  empresa_id: string
  nome: string
  pontos_necessarios: number
  ativo: boolean
}

export interface FidelidadeMovimento {
  id: string
  cliente_id: string
  tipo: 'ganho' | 'resgate' | 'ajuste'
  pontos: number
  origem: string | null
  descricao: string | null
  criado_em: string
}

export interface Pacote {
  id: string
  empresa_id: string
  nome: string
  descricao: string | null
  valor_total: number
  validade_dias: number | null
  ativo: boolean
}

export interface PacoteItem {
  id: string
  pacote_id: string
  servico_id: string
  quantidade: number
  servico_nome?: string
}

export interface VendaPacote {
  id: string
  empresa_id: string
  cliente_id: string
  pacote_id: string
  valor_pago: number
  status: 'ativo' | 'finalizado' | 'cancelado'
  criado_em: string
  pacote_nome?: string
}

export interface SaldoPacote {
  id: string
  venda_pacote_id: string
  servico_id: string
  quantidade_total: number
  quantidade_usada: number
}

export interface ListaEspera {
  id: string
  empresa_id: string
  cliente_id: string
  servico_id: string
  funcionario_id: string | null
  data_desejada: string | null
  horario_desejado: string
  observacoes: string | null
  status: 'aguardando' | 'notificado' | 'atendido' | 'cancelado'
  criado_em: string
  cliente_nome?: string
  servico_nome?: string
  funcionario_nome?: string | null
}

export interface Produto {
  id: string
  empresa_id: string
  nome: string
  descricao: string | null
  categoria: string | null
  codigo_barras: string | null
  preco_custo: number
  preco_venda: number
  quantidade_estoque: number
  estoque_minimo: number
  ativo: boolean
  criado_em: string
}

export interface AgendamentoCompleto extends Agendamento {
  cliente_nome: string
  cliente_whatsapp: string | null
  servico_nome: string
  funcionario_nome: string | null
}

export interface ContaReceber {
  id: string
  empresa_id: string
  cliente_id: string | null
  agendamento_id: string | null
  descricao: string
  valor: number
  vencimento: string
  status: StatusPagamento
  metodo: string | null
  pago_em: string | null
  criado_em: string
}

export interface ContaPagar {
  id: string
  empresa_id: string
  descricao: string
  categoria: string | null
  valor: number
  vencimento: string
  status: StatusPagamento
  pago_em: string | null
  criado_em: string
}

export interface DashboardResumo {
  empresa_id: string
  total_clientes: number
  agendamentos_hoje: number
  agendamentos_semana: number
  novos_leads_mes: number
  receita_mensal: number
  receita_anual: number
  ticket_medio: number
  taxa_comparecimento_pct: number
  taxa_cancelamento_pct: number
}

// Placeholder genérico — a tipagem completa de tabelas/views/functions
// deve ser gerada automaticamente a partir do banco real.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any
