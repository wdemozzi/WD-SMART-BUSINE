import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { LandingPage } from '@/pages/publico/landing'
import { CadastroPage } from '@/pages/publico/cadastro'
import { CompletarCadastroPage } from '@/pages/publico/completar-cadastro'
import { LoginPage } from '@/pages/auth/login'
import { AgendamentoPublicoPage } from '@/pages/publico/agendar'
import { DashboardPage } from '@/pages/dashboard'
import { ClientesPage } from '@/pages/clientes'
import { AgendamentosPage } from '@/pages/agendamentos'
import { FinanceiroPage } from '@/pages/financeiro'
import { RelatoriosPage } from '@/pages/relatorios'
import { ComissoesPage } from '@/pages/comissoes'
import { ListaEsperaPage } from '@/pages/lista-espera'
import { WhatsappPage } from '@/pages/whatsapp'
import { IaPage } from '@/pages/ia'
import { ConfiguracoesPage } from '@/pages/configuracoes'
import { PdvPage } from '@/pages/pdv'
import { SuperAdminEmpresasPage } from '@/pages/super-admin/empresas'

// Exige apenas que exista uma sessão ativa — usado para a etapa de
// "completar cadastro", que roda justamente para quem AINDA não tem perfil.
function RequireSession({ children }: { children: React.ReactNode }) {
  const { session, carregando } = useAuth()
  if (carregando) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route
            path="/completar-cadastro"
            element={
              <RequireSession>
                <CompletarCadastroPage />
              </RequireSession>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/agendar/:slug" element={<AgendamentoPublicoPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/agendamentos" element={<AgendamentosPage />} />
            <Route path="/pdv" element={<PdvPage />} />
            <Route path="/lista-espera" element={<ListaEsperaPage />} />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute papeisPermitidos={['admin_empresa', 'super_admin']}>
                  <FinanceiroPage />
                </ProtectedRoute>
              }
            />
            <Route path="/whatsapp" element={<WhatsappPage />} />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute papeisPermitidos={['admin_empresa', 'super_admin']}>
                  <RelatoriosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissoes"
              element={
                <ProtectedRoute papeisPermitidos={['admin_empresa', 'super_admin']}>
                  <ComissoesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ia"
              element={
                <ProtectedRoute papeisPermitidos={['admin_empresa', 'super_admin']}>
                  <IaPage />
                </ProtectedRoute>
              }
            />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route
              path="/super-admin/empresas"
              element={
                <ProtectedRoute papeisPermitidos={['super_admin']}>
                  <SuperAdminEmpresasPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
