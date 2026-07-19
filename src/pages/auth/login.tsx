import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

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

    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-semibold text-white">
            W
          </div>
          <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
            Entrar no WD Smart Business
          </h1>
          <p className="text-sm text-[var(--color-ink-400)]">
            Gerencie clientes, agenda e vendas em um só lugar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-ink-900)]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="voce@empresa.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-[var(--color-ink-900)]">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
