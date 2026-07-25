import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { session, carregando } = useAuth()

  // Se já estiver logado, redireciona direto pro dashboard
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-canvas)]">
      {/* Gradiente ambiente — mancha sutil no fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(200,164,78,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(99,102,241,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 80% 20%, rgba(168,85,247,0.03) 0%, transparent 70%)',
        }}
      />

      {/* Grid decorativo sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Marca */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <span className="font-display text-xl font-bold tracking-tight text-white">
              W
            </span>
          </div>
          <div className="text-center">
            <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-[var(--color-ink-900)]">
              WD Smart Business
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-400)]">
              Gerencie clientes, agenda e vendas em um só lugar
            </p>
          </div>
        </div>

        {/* Card do formulário */}
        <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-black/5">
          {/* Linha decorativa no topo */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(200,164,78,0.5) 25%, rgba(200,164,78,0.7) 50%, rgba(200,164,78,0.5) 75%, transparent 100%)',
            }}
          />

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

            <Button
              type="submit"
              className="w-full"
              disabled={enviando}
            >
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
  )
}
