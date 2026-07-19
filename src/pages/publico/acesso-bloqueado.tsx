import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

const mensagens: Record<string, { titulo: string; texto: string }> = {
  trial_expirado: {
    titulo: 'Seu teste grátis terminou',
    texto: 'Os 7 dias de teste chegaram ao fim. Assine um plano para continuar usando o sistema sem interrupções.',
  },
  inadimplente: {
    titulo: 'Pagamento pendente',
    texto: 'Identificamos uma pendência no pagamento da sua assinatura. Regularize para voltar a acessar o sistema.',
  },
  suspensa: {
    titulo: 'Acesso suspenso',
    texto: 'Sua conta está temporariamente suspensa. Entre em contato com o suporte para mais informações.',
  },
  cancelada: {
    titulo: 'Assinatura cancelada',
    texto: 'Sua assinatura foi cancelada. Entre em contato caso queira reativar sua conta.',
  },
}

export function AcessoBloqueadoPage({ motivo }: { motivo: keyof typeof mensagens }) {
  const { signOut } = useAuth()
  const conteudo = mensagens[motivo]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-canvas)] px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-50 text-warning-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">{conteudo.titulo}</h1>
        <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-400)]">{conteudo.texto}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => signOut()}>
          Sair
        </Button>
        <Button
          onClick={() => {
            window.location.href = 'mailto:contato@wdsmartbusiness.com'
          }}
        >
          Falar com o suporte
        </Button>
      </div>
    </div>
  )
}
