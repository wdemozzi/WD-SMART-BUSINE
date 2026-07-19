import { useEffect, useRef, useState } from 'react'
import { Bell, MessageCircle, Gift, Clock3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useNotificacoes, linkWhatsapp, type Notificacao } from '@/hooks/use-notificacoes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function tempoRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.floor(diffMs / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `${minutos}min atrás`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas}h atrás`
  return `${Math.floor(horas / 24)}d atrás`
}

export function NotificacoesDropdown() {
  const { empresa, perfil } = useAuth()
  const { notificacoes, naoLidas, marcarComoLida } = useNotificacoes(empresa?.id, perfil?.id)
  const [aberto, setAberto] = useState(false)
  const [whatsappPorCliente, setWhatsappPorCliente] = useState<Record<string, string | null>>({})
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  useEffect(() => {
    const idsAniversario = notificacoes
      .filter((n) => n.tipo === 'aniversario_cliente' && n.referencia_id && !(n.referencia_id in whatsappPorCliente))
      .map((n) => n.referencia_id as string)

    if (idsAniversario.length === 0) return

    supabase
      .from('clientes')
      .select('id, whatsapp')
      .in('id', idsAniversario)
      .then(({ data }) => {
        const mapa: Record<string, string | null> = {}
        for (const c of (data ?? []) as { id: string; whatsapp: string | null }[]) {
          mapa[c.id] = c.whatsapp
        }
        setWhatsappPorCliente((atual) => ({ ...atual, ...mapa }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificacoes])

  function renderAcao(n: Notificacao) {
    if (n.tipo !== 'aniversario_cliente' || !n.referencia_id) return null
    const numero = whatsappPorCliente[n.referencia_id]
    if (!numero) return null

    return (
      <a
        href={linkWhatsapp(numero, n.mensagem ?? '')}
        target="_blank"
        rel="noreferrer"
        onClick={() => marcarComoLida(n.id)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-success-50 px-2.5 py-1 text-xs font-medium text-success-500 hover:bg-success-500/20"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Enviar parabéns pelo WhatsApp
      </a>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => setAberto((v) => !v)}>
        <span className="relative">
          <Bell className="h-4 w-4" />
          {naoLidas > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger-500 text-[9px] font-semibold text-white">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </span>
      </Button>

      {aberto && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <p className="font-display text-sm font-semibold text-[var(--color-ink-900)]">Notificações</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-400)]">Nenhuma notificação por aqui.</p>
            ) : (
              notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => marcarComoLida(n.id)}
                  className={cn(
                    'block w-full border-b border-[var(--color-border)] px-4 py-3 text-left last:border-0 hover:bg-[var(--color-canvas)]',
                    !n.lida && 'bg-brand-50/50 dark:bg-brand-500/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {n.tipo === 'aniversario_cliente' ? (
                      <Gift className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    ) : n.tipo === 'vaga_lista_espera' ? (
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                    ) : (
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-400)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink-900)]">{n.titulo}</p>
                      {n.mensagem && <p className="mt-0.5 text-xs text-[var(--color-ink-600)]">{n.mensagem}</p>}
                      <p className="mt-1 text-xs text-[var(--color-ink-400)]">{tempoRelativo(n.criado_em)}</p>
                      {renderAcao(n)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
