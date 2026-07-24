import { useState } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { AbaFluxoCaixa } from '@/components/financeiro/aba-fluxo-caixa'
import { AbaContasReceber } from '@/components/financeiro/aba-contas-receber'
import { AbaContasPagar } from '@/components/financeiro/aba-contas-pagar'
import { AbaConsumoInterno } from '@/components/financeiro/aba-consumo-interno'

type AbaFinanceiro = 'fluxo' | 'receber' | 'pagar' | 'consumo'

export function FinanceiroPage() {
  const [aba, setAba] = useState<AbaFinanceiro>('fluxo')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink-900)]">Financeiro</h1>
        <p className="text-sm text-[var(--color-ink-400)]">Fluxo de caixa, contas a receber e a pagar.</p>
      </div>

      <Tabs
        abas={[
          { valor: 'fluxo', rotulo: 'Fluxo de Caixa' },
          { valor: 'receber', rotulo: 'A Receber' },
          { valor: 'pagar', rotulo: 'A Pagar' },
          { valor: 'consumo', rotulo: 'Consumo Interno' },
        ]}
        ativa={aba}
        onChange={setAba}
      />

      {aba === 'fluxo' && <AbaFluxoCaixa />}
      {aba === 'receber' && <AbaContasReceber />}
      {aba === 'pagar' && <AbaContasPagar />}
      {aba === 'consumo' && <AbaConsumoInterno />}
    </div>
  )
}
