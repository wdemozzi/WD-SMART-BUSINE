import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

export function CadastroPage() {
  const navigate = useNavigate()
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [segmento, setSegmento] = useState('salao_beleza')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [precisaConfirmarEmail, setPrecisaConfirmarEmail] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setEnviando(true)

    const { data: authData, error: erroAuth } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (erroAuth || !authData.user) {
      setEnviando(false)
      setErro(
        erroAuth?.message.includes('already registered')
          ? 'Já existe uma conta com este e-mail. Tente fazer login.'
          : 'Não foi possível criar sua conta. Verifique os dados e tente novamente.'
      )
      return
    }

    // Sem confirmação de e-mail habilitada, já vem uma sessão ativa —
    // criamos a empresa na hora. Com confirmação obrigatória, pedimos para
    // confirmar o e-mail e completar o cadastro no primeiro login.
    if (!authData.session) {
      setPrecisaConfirmarEmail(true)
      setEnviando(false)
      return
    }

    const { data: empresaData, error: erroEmpresa } = await supabase.rpc('criar_empresa_trial', {
      p_nome_empresa: nomeEmpresa,
      p_slug: gerarSlug(nomeEmpresa),
      p_segmento: segmento,
      p_nome_admin: nomeAdmin,
    })

    setEnviando(false)

    if (erroEmpresa || !empresaData || empresaData.length === 0 || empresaData[0].mensagem_erro) {
      setErro('Sua conta foi criada, mas houve um problema ao configurar a empresa. Tente fazer login.')
      return
    }

    navigate('/dashboard')
  }

  if (precisaConfirmarEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            ✉️
          </div>
          <h1 className="font-display text-xl font-semibold text-gray-900">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, faça login que
            terminamos de configurar sua empresa automaticamente.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand-600 underline">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-semibold text-white">
            W
          </div>
          <h1 className="font-display text-xl font-semibold text-gray-900">Comece seu teste grátis</h1>
          <p className="text-sm text-gray-500">7 dias grátis, sem cartão de crédito.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <Label htmlFor="nome_empresa">Nome da sua empresa</Label>
            <Input
              id="nome_empresa"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Ex: Barbearia do João"
              required
            />
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

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Criando sua conta…' : 'Começar teste grátis de 7 dias'}
          </Button>

          <p className="text-center text-xs text-gray-400">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-brand-600 underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
