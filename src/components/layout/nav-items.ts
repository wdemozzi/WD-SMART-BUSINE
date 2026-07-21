import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  MessageCircle,
  Bot,
  Settings,
  Building2,
  ShoppingCart,
  FileBarChart,
  HandCoins,
  Clock3,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export const navItems: NavItem[] = [
  { label: 'Visão geral', href: '/dashboard', icon: LayoutDashboard, roles: ['admin_empresa', 'funcionario'] },
  { label: 'Clientes', href: '/clientes', icon: Users, roles: ['admin_empresa', 'funcionario'] },
  { label: 'Agenda', href: '/agendamentos', icon: CalendarDays, roles: ['admin_empresa', 'funcionario'] },
  { label: 'Lista de Espera', href: '/lista-espera', icon: Clock3, roles: ['admin_empresa', 'funcionario'] },
  { label: 'PDV', href: '/pdv', icon: ShoppingCart, roles: ['admin_empresa', 'funcionario'] },
  { label: 'Financeiro', href: '/financeiro', icon: Wallet, roles: ['admin_empresa'] },
  { label: 'Comissões', href: '/comissoes', icon: HandCoins, roles: ['admin_empresa'] },
  { label: 'Planos', href: '/planos', icon: CreditCard, roles: ['admin_empresa'] },
  { label: 'Relatórios', href: '/relatorios', icon: FileBarChart, roles: ['admin_empresa'] },
  { label: 'WhatsApp', href: '/whatsapp', icon: MessageCircle, roles: ['admin_empresa', 'funcionario'] },
  { label: 'Assistente IA', href: '/ia', icon: Bot, roles: ['admin_empresa'] },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, roles: ['admin_empresa'] },
  { label: 'Empresas', href: '/super-admin/empresas', icon: Building2, roles: ['super_admin'] },
]
