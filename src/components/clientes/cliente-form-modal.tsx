import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Label, Input, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Cliente } from '@/types/database'
import type { ClienteFormValues } from '@/hooks/use-clientes'

const valoresVazios: ClienteFormValues = {
  nome: '',
  telefone: '',
  whatsapp: '',
  email: '',
  cpf_cnpj: '',
  cidade: '',
  estado: '',
  data_nascimento: '',
  observacoes: '',
}

export function ClienteFormModal({
  aberto,
  onFechar,
  clienteEmEdicao,
  aoSalvar,
}: {
  aberto: boolean
  onFechar: () => void
  clienteEmEdicao: Cliente | null
  aoSalvar: (valores: ClienteFormValues) => Promise<unknown>
}) {
  const [valores, setValores] = useState<ClienteFormValues>(valoresVazios)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    if (clienteEmEdicao) {
      setValores({
        nome: clienteEmEdicao.nome ?? '',
        telefone: clienteEmEdicao.telefone ?? '',
        whatsapp: clienteEmEdicao.whatsapp ?? '',
        email: clienteEmEdicao.email ?? '',
        cpf_cnpj: (clienteEmEdicao as unknown as { cpf_cnpj?: string }).cpf_cnpj ?? '',
        cidade: clienteEmEdicao.cidade ?? '',
        estado: (clienteEmEdicao as unknown as { estado?: string }).estado ?? '',
        data_nascimento: (clienteEmEdicao as unknown as { data_nascimento?: string }).data_nascimento ?? '',
        observacoes: (clienteEmEdicao as unknown as { observacoes?: string }).observacoes ?? '',
      })
    } else {
      setValores(valoresVazios)
    }
    setErro(null)
  }, [aberto, clienteEmEdicao])

  function atualizarCampo<K extends keyof ClienteFormValues>(campo: K, valor: ClienteFormValues[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!valores.nome.trim()) {
      setErro('O nome do cliente é obrigatório.')
      return
    }

    setEnviando(true)
    const resultado = await aoSalvar(valores)
    setEnviando(false)

    if (resultado) {
      setErro('Não foi possível salvar o cliente. Tente novamente.')
      return
    }

    onFechar()
  }

  return (
    <Dialog
      aberto={aberto}
      onFechar={onFechar}
      titulo={clienteEmEdicao ? 'Editar cliente' : 'Novo cliente'}
      largura="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome completo</Label>
          <Input
            id="nome"
            value={valores.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            placeholder="Ex: Maria da Silva"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={valores.telefone} onChange={(e) => atualizarCampo('telefone', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={valores.whatsapp}
              onChange={(e) => atualizarCampo('whatsapp', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={valores.email} onChange={(e) => atualizarCampo('email', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
            <Input id="cpf_cnpj" value={valores.cpf_cnpj} onChange={(e) => atualizarCampo('cpf_cnpj', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={valores.cidade} onChange={(e) => atualizarCampo('cidade', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Input id="estado" maxLength={2} value={valores.estado} onChange={(e) => atualizarCampo('estado', e.target.value.toUpperCase())} placeholder="UF" />
          </div>
        </div>

        <div>
          <Label htmlFor="data_nascimento">Data de nascimento</Label>
          <Input
            id="data_nascimento"
            type="date"
            value={valores.data_nascimento}
            onChange={(e) => atualizarCampo('data_nascimento', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea id="observacoes" value={valores.observacoes} onChange={(e) => atualizarCampo('observacoes', e.target.value)} />
        </div>

        {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : clienteEmEdicao ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
