import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notificacao {
  id: string
  empresa_id: string
  perfil_id: string | null
  tipo: string
  titulo: string
  mensagem: string | null
  referencia_id: string | null
  lida: boolean
  criado_em: string
}

interface ClienteAniversario {
  id: string
  nome: string
  whatsapp: string | null
  data_nascimento: string
}

function mensagemAniversario(nome: string) {
  const primeiroNome = nome.split(' ')[0]
  return `Olá ${primeiroNome}! 🎉 Hoje é seu dia e queremos comemorar com você: aproveite 15% de desconto em qualquer serviço esta semana. Conte com a gente!`
}

export function useNotificacoes(empresaId: string | undefined, perfilId: string | undefined) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })
      .limit(30)

    setNotificacoes((data ?? []) as Notificacao[])
    setCarregando(false)
  }, [empresaId])

  // Verifica aniversariantes do dia e cria notificação (uma vez por cliente por dia)
  const verificarAniversariantes = useCallback(async () => {
    if (!empresaId) return

    const hoje = new Date()
    const mes = hoje.getMonth() + 1
    const dia = hoje.getDate()

    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome, whatsapp, data_nascimento')
      .eq('empresa_id', empresaId)
      .not('data_nascimento', 'is', null)

    const aniversariantesHoje = ((clientes ?? []) as ClienteAniversario[]).filter((c) => {
      const nascimento = new Date(c.data_nascimento)
      return nascimento.getMonth() + 1 === mes && nascimento.getDate() === dia
    })

    if (aniversariantesHoje.length === 0) return

    const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()

    const { data: jaNotificados } = await supabase
      .from('notificacoes')
      .select('referencia_id')
      .eq('empresa_id', empresaId)
      .eq('tipo', 'aniversario_cliente')
      .gte('criado_em', inicioDoDia)

    const idsJaNotificados = new Set((jaNotificados ?? []).map((n: { referencia_id: string }) => n.referencia_id))
    const novos = aniversariantesHoje.filter((c) => !idsJaNotificados.has(c.id))

    if (novos.length === 0) return

    await supabase.from('notificacoes').insert(
      novos.map((c) => ({
        empresa_id: empresaId,
        perfil_id: perfilId ?? null,
        tipo: 'aniversario_cliente',
        titulo: `🎂 ${c.nome} faz aniversário hoje!`,
        mensagem: mensagemAniversario(c.nome),
        referencia_id: c.id,
      }))
    )

    await carregar()
  }, [empresaId, perfilId, carregar])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    verificarAniversariantes()
  }, [verificarAniversariantes])

  async function marcarComoLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes((atuais) => atuais.map((n) => (n.id === id ? { ...n, lida: true } : n)))
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  return { notificacoes, carregando, naoLidas, marcarComoLida, recarregar: carregar }
}

export function linkWhatsapp(numero: string | null, mensagem: string) {
  const digitos = (numero ?? '').replace(/\D/g, '')
  const numeroComPais = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`
}
