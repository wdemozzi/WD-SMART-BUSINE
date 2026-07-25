import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

const frases = [
  {
    titulo: 'Seu negócio, no controle.',
    texto: 'Agenda, clientes, vendas e comissões em um só lugar. Tudo pensado para o seu salão ou barbearia.',
  },
  {
    titulo: 'Menos planilha, mais resultado.',
    texto: 'Automatize o que toma seu tempo e foque no que realmente importa: atender bem seus clientes.',
  },
  {
    titulo: 'Do agendamento ao caixa.',
    texto: 'Controle completo do fluxo do seu negócio. Do primeiro contato até o pagamento final.',
  },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { session, carregando } = useAuth()

  const frase = frases[Math.floor(Math.random() * frases.length)]

  if (!carregando && session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    setEnviando(false)

    if (error) {
      setErro('E-mail ou senha incorretos. Confira os dados e tente novamente.')
      return
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Painel esquerdo ─── */}
      <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950 lg:flex lg:flex-col">
        {/* Textura sutil de grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Mancha âmbar no centro-esquerdo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-1/3 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
              <span className="font-display text-lg font-bold tracking-tight text-white">W</span>
            </div>
            <span className="font-display text-base font-semibold tracking-tight text-white/90">
              WD Smart Business
            </span>
          </div>

          {/* Frase motivacional */}
          <div className="max-w-sm">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white">
              {frase.titulo}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/60">
              {frase.texto}
            </p>
          </div>

          {/* Rodapé discreto */}
          <p className="text-[13px] text-white/25">
            © {new Date().getFullYear()} WD Smart Business — Tecnologia para quem empreende
          </p>
        </div>
      </div>

      {/* ─── Painel direito (formulário) ─── */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-canvas)] px-4">
        <div className="w-full max-w-[380px]">
          {/* Logo mobile */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
              <span className="font-display text-xl font-bold tracking-tight text-white">W</span>
            </div>
            <h1 className="font-display text-[22px] font-semibold tracking-tight text-[var(--color-ink-900)]">
              WD Smart Business
            </h1>
          </div>

          {/* Título (só desktop — mobile já tem o logo) */}
          <div className="mb-8 hidden lg:block">
            <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-[var(--color-ink-900)]">
              Entrar na sua conta
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-400)]">
              Bem-vindo de volta. Informe seus dados para continuar.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-black/5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-[13px] font-medium tracking-wide text-[var(--color-ink-600)] uppercase"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className="block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] outline-none transition-all duration-200 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="senha"
                  className="text-[13px] font-medium tracking-wide text-[var(--color-ink-600)] uppercase"
                >
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-[15px] text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] outline-none transition-all duration-200 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
                  <p className="text-[13px] leading-relaxed text-red-600">{erro}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-[13px] text-[var(--color-ink-300)]">
            Ainda não tem conta?{' '}
            <a href="/cadastro" className="font-medium text-amber-600 transition-colors hover:text-amber-500">
              Criar conta grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
