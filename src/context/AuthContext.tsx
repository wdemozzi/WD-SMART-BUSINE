import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Perfil, Empresa } from '@/types/database'

interface AuthContextValue {
  session: Session | null
  perfil: Perfil | null
  empresa: Empresa | null
  carregando: boolean
  signOut: () => Promise<void>
  recarregarPerfil: (userId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [carregando, setCarregando] = useState(true)

  async function carregarPerfil(userId: string) {
    // maybeSingle() não estoura exceção quando não encontra linha — retorna
    // { data: null } normalmente. Tratamos aqui para evitar race condition.
    try {
      const { data: perfilData, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Erro ao carregar perfil:', error.message)
        setPerfil(null)
        return
      }

      setPerfil(perfilData as Perfil | null)

      if (perfilData?.empresa_id) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', perfilData.empresa_id)
          .maybeSingle()
        setEmpresa(empresaData as Empresa | null)
      } else {
        setEmpresa(null)
      }
    } catch (err: any) {
      console.warn('Falha inesperada ao carregar perfil:', err?.message ?? err)
      setPerfil(null)
      setEmpresa(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        carregarPerfil(session.user.id).finally(() => setCarregando(false))
      } else {
        setCarregando(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCarregando(true)
      setSession(session)
      if (session?.user) {
        carregarPerfil(session.user.id).finally(() => setCarregando(false))
      } else {
        setPerfil(null)
        setEmpresa(null)
        setCarregando(false)
      }
    })

    // Quando o usuário volta pra aba com o botão voltar do navegador,
    // força verificação da sessão ativa. Se deslogou, o estado já reflete.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setSession(null)
            setPerfil(null)
            setEmpresa(null)
            setCarregando(false)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      listener.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, perfil, empresa, carregando, signOut, recarregarPerfil: carregarPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
