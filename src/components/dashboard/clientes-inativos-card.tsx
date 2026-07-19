import { UserX, MessageCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { linkWhatsapp } from '@/hooks/use-notificacoes'
import type { RecorrenciaCliente } from '@/hooks/use-recorrencia-clientes'

function mensagemVoltaAqui(nome: string) {
  const primeiroNome = nome.split(' ')[0]
  return `Olá ${primeiroNome}! Faz um tempinho que a gente não te vê por aqui 💜 Que tal voltar essa semana? Preparamos um desconto especial pra você. Me chama que eu te explico!`
}

export function CardClientesInativos({ inativos }: { inativos: RecorrenciaCliente[] }) {
  const top5 = inativos.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Clientes que sumiram (30+ dias)</CardTitle>
        <span className="rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-500">
          {inativos.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        {top5.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <UserX className="h-5 w-5 text-[var(--color-ink-400)]" />
            <p className="text-sm text-[var(--color-ink-400)]">
              Nenhum cliente parado há mais de 30 dias. 🎉
            </p>
          </div>
        ) : (
          top5.map((c) => (
            <div
              key={c.cliente_id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-[var(--color-canvas)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-ink-900)]">{c.nome}</p>
                <p className="text-xs text-[var(--color-ink-400)]">
                  {c.dias_sem_aparecer} dias sem aparecer
                </p>
              </div>
              {c.whatsapp && (
                <a
                  href={linkWhatsapp(c.whatsapp, mensagemVoltaAqui(c.nome))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-success-50 px-2.5 py-1 text-xs font-medium text-success-500 hover:bg-success-500/20"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chamar
                </a>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
