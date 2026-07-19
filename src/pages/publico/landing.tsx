import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  Wallet,
  ShoppingCart,
  Award,
  Ticket,
  HandCoins,
  Package,
  Globe,
  FileBarChart,
  Building2,
  Check,
  ArrowRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface PlanoPublico {
  id: string
  nome: string
  descricao: string | null
  valor_mensal: number
  ia_incluida: boolean
  limite_usuarios: number | null
  limite_clientes: number | null
}

const recursos = [
  { icone: CalendarDays, titulo: 'Agenda inteligente', texto: 'Dia, semana e mês, com horários realmente livres calculados na hora.' },
  { icone: Users, titulo: 'CRM completo', texto: 'Histórico, recorrência e alerta automático de clientes que sumiram.' },
  { icone: Wallet, titulo: 'Financeiro', texto: 'Fluxo de caixa, contas a pagar/receber e faturamento por forma de pagamento.' },
  { icone: ShoppingCart, titulo: 'PDV com estoque', texto: 'Venda produtos com baixa de estoque automática, direto no balcão.' },
  { icone: Award, titulo: 'Cartão fidelidade', texto: 'Pontos automáticos por atendimento e resgate de recompensas.' },
  { icone: Ticket, titulo: 'Cupons de desconto', texto: 'Por valor ou percentual, com limite total e por cliente.' },
  { icone: Package, titulo: 'Pacotes de sessões', texto: 'Venda combos (ex: 10 cortes) e controle o saldo automaticamente.' },
  { icone: HandCoins, titulo: 'Comissões', texto: 'Cálculo automático por profissional, com pagamento em lote.' },
  { icone: Globe, titulo: 'Agendamento online', texto: 'Seus clientes marcam sozinhos, 24h, sem precisar de login.' },
  { icone: FileBarChart, titulo: 'Relatórios', texto: 'Exporte clientes, agenda e financeiro com um clique.' },
  { icone: Building2, titulo: 'Multi-unidade', texto: 'Gerencie equipe, permissões e dados isolados por empresa.' },
]

const segmentosAlvo = [
  'Clínicas médicas', 'Clínicas veterinárias', 'Psicólogos', 'Advogados',
  'Salões de beleza', 'Barbearias', 'Consultores', 'Oficinas', 'Prestadores de serviço',
]

export function LandingPage() {
  const [planos, setPlanos] = useState<PlanoPublico[]>([])

  useEffect(() => {
    supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('valor_mensal')
      .then(({ data }) => setPlanos((data ?? []) as PlanoPublico[]))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 font-display text-sm font-semibold text-white">
              W
            </div>
            <span className="font-display text-base font-semibold text-gray-900">WD Smart Business</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pt-24">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
          7 dias grátis · sem cartão de crédito
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
          Gestão completa para o seu negócio de agendamento
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
          Agenda, clientes, financeiro, estoque e fidelidade em um só lugar — sem planilha, sem caderno, sem
          esquecimento.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/cadastro"
            className="flex items-center gap-2 rounded-md bg-brand-500 px-6 py-3 text-sm font-medium text-white hover:bg-brand-600"
          >
            Começar teste grátis de 7 dias
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mx-auto mt-14 max-w-4xl rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-left sm:p-6">
            <div className="mb-4 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: 'Clientes ativos', v: '128' },
                { l: 'Agendamentos hoje', v: '14' },
                { l: 'Receita do mês', v: 'R$ 8.240' },
                { l: 'Comparecimento', v: '92%' },
              ].map((c) => (
                <div key={c.l} className="rounded-md border border-gray-100 p-3">
                  <p className="text-xs text-gray-400">{c.l}</p>
                  <p className="font-data text-lg font-semibold text-gray-900">{c.v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 h-28 rounded-md bg-gradient-to-t from-brand-50 to-transparent" />
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="mb-4 text-sm font-medium text-gray-500">Feito para negócios como o seu</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {segmentosAlvo.map((s) => (
              <span key={s} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold text-gray-900">Tudo que você precisa, junto</h2>
          <p className="mt-2 text-gray-500">Sem precisar assinar 5 ferramentas diferentes.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map((r) => (
            <div key={r.titulo} className="rounded-lg border border-gray-100 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-500">
                <r.icone className="h-4 w-4" />
              </div>
              <p className="font-medium text-gray-900">{r.titulo}</p>
              <p className="mt-1 text-sm text-gray-500">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {planos.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-semibold text-gray-900">Planos simples e diretos</h2>
              <p className="mt-2 text-gray-500">Comece grátis, faça upgrade quando quiser.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {planos.map((p) => (
                <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-6">
                  <p className="font-display text-lg font-semibold text-gray-900">{p.nome}</p>
                  {p.descricao && <p className="mt-1 text-sm text-gray-500">{p.descricao}</p>}
                  <p className="mt-4 font-data text-3xl font-semibold text-gray-900">
                    {formatCurrency(p.valor_mensal)}
                    <span className="text-sm font-normal text-gray-400">/mês</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success-500" />
                      {p.limite_usuarios ? `Até ${p.limite_usuarios} usuários` : 'Usuários ilimitados'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success-500" />
                      {p.limite_clientes ? `Até ${p.limite_clientes} clientes` : 'Clientes ilimitados'}
                    </li>
                    {p.ia_incluida && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success-500" />
                        Assistente de IA incluído
                      </li>
                    )}
                  </ul>
                  <Link
                    to="/cadastro"
                    className="mt-6 block rounded-md bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Começar grátis
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="font-display text-3xl font-semibold text-gray-900">Pronto para organizar seu negócio?</h2>
        <p className="mt-2 text-gray-500">Teste grátis por 7 dias. Sem cartão de crédito, sem compromisso.</p>
        <Link
          to="/cadastro"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-500 px-6 py-3 text-sm font-medium text-white hover:bg-brand-600"
        >
          Começar agora
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} WD Smart Business. Todos os direitos reservados.
      </footer>
    </div>
  )
}
