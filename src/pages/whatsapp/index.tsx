import { MessageCircle } from 'lucide-react'
import { ModulePlaceholder } from '@/components/layout/module-placeholder'

export function WhatsappPage() {
  return (
    <ModulePlaceholder
      icon={MessageCircle}
      titulo="WhatsApp"
      descricao="Conecte seu número, converse com clientes e dispare campanhas."
    />
  )
}
