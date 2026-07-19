import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { segmentos } from '@/hooks/use-empresa-atual'
import { Button } from '@/components/ui/button'
import { Label, Input, Select } from '@/components/ui/form'

function gerarSlug(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function CompletarCadastroPage() {
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [segmento, setSegmento] = useState('salao_beleza')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { data, error } = await supabase.rpc('criar_empresa_trial', {
      p_nome_empresa: nomeEmpresa,
      p_slug: gerarSlug(nomeEmpresa),
      p_segmento: segmento,
      p_nome_admin: nomeAdmin,
    })

    setEnviando(false)

    if (error || !data || data.length === 0 || data[0].mensagem_erro) {
      setErro('Não foi possível concluir seu cadastro. Tente novamente.')
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">Só mais um passo</h1>
          <p className="text-sm text-[var(--color-ink-400)]">
            Seu e-mail foi confirmado! Agora vamos configurar sua empresa.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div>
            <Label htmlFor="nome_empresa">Nome da sua empresa</Label>
            <Input id="nome_empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="segmento">Segmento</Label>
            <Select id="segmento" value={segmento} onChange={(e) => setSegmento(e.target.value)}>
              {segmentos.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="nome_admin">Seu nome</Label>
            <Input id="nome_admin" value={nomeAdmin} onChange={(e) => setNomeAdmin(e.target.value)} required />
          </div>

          {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Configurando…' : 'Concluir e entrar no sistema'}
          </Button>
        </form>
      </div>
    </div>
  )
}
