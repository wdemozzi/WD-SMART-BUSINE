import { useState } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { AbaDadosEmpresa } from '@/components/configuracoes/aba-dados-empresa'
import { AbaServicos } from '@/components/configuracoes/aba-servicos'
import { AbaFuncionarios } from '@/components/configuracoes/aba-funcionarios'
import { AbaCupons } from '@/components/configuracoes/aba-cupons'
import { AbaProdutos } from '@/components/configuracoes/aba-produtos'
import { AbaFidelidade } from '@/components/configuracoes/aba-fidelidade'
import { AbaPacotes } from '@/components/configuracoes/aba-pacotes'

type AbaConfig = 'empresa' | 'servicos' | 'produtos' | 'pacotes' | 'funcionarios' | 'cupons' | 'fidelidade'

export function ConfiguracoesPage() {
  const [aba, setAba] = useState<AbaConfig>('empresa')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Configurações</h1>
        <p className="text-sm text-[var(--color-ink-400)]">Dados da empresa, serviços, produtos, pacotes, equipe, cupons e fidelidade.</p>
      </div>

      <Tabs
        abas={[
          { valor: 'empresa', rotulo: 'Dados da Empresa' },
          { valor: 'servicos', rotulo: 'Serviços' },
          { valor: 'produtos', rotulo: 'Produtos' },
          { valor: 'pacotes', rotulo: 'Pacotes' },
          { valor: 'funcionarios', rotulo: 'Funcionários' },
          { valor: 'cupons', rotulo: 'Cupons' },
          { valor: 'fidelidade', rotulo: 'Fidelidade' },
        ]}
        ativa={aba}
        onChange={setAba}
      />

      {aba === 'empresa' && <AbaDadosEmpresa />}
      {aba === 'servicos' && <AbaServicos />}
      {aba === 'produtos' && <AbaProdutos />}
      {aba === 'pacotes' && <AbaPacotes />}
      {aba === 'funcionarios' && <AbaFuncionarios />}
      {aba === 'cupons' && <AbaCupons />}
      {aba === 'fidelidade' && <AbaFidelidade />}
    </div>
  )
}
