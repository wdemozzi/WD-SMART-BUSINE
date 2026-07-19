import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Upload, Copy, Check, AtSign, ImageIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useEmpresaAtual, segmentos } from '@/hooks/use-empresa-atual'
import { supabase } from '@/lib/supabase'
import { Label, Input, Select, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { EmpresaFormValues } from '@/hooks/use-empresa-atual'

type CampoImagem = 'logo_url' | 'banner_url'

export function AbaDadosEmpresa() {
  const { empresa } = useAuth()
  const { valores, carregando, erro, salvar } = useEmpresaAtual(empresa?.id)
  const [form, setForm] = useState<EmpresaFormValues | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState<CampoImagem | null>(null)
  const [erroImagem, setErroImagem] = useState<string | null>(null)
  const inputLogoRef = useRef<HTMLInputElement>(null)
  const inputBannerRef = useRef<HTMLInputElement>(null)

  const linkAgendamento = empresa?.slug ? `${window.location.origin}/agendar/${empresa.slug}` : null

  function copiarLink() {
    if (!linkAgendamento) return
    navigator.clipboard.writeText(linkAgendamento)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  useEffect(() => {
    if (valores) setForm(valores)
  }, [valores])

  function atualizarCampo<K extends keyof EmpresaFormValues>(campo: K, valor: EmpresaFormValues[K]) {
    setForm((f) => (f ? { ...f, [campo]: valor } : f))
    setSucesso(false)
  }

  async function handleUploadImagem(campo: CampoImagem, nomeArquivoBase: string, e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !empresa?.id || !form) return

    if (arquivo.size > 3 * 1024 * 1024) {
      setErroImagem('A imagem precisa ter no máximo 3MB.')
      return
    }

    setEnviandoImagem(campo)
    setErroImagem(null)

    const extensao = arquivo.name.split('.').pop()
    const caminho = `${empresa.id}/${nomeArquivoBase}.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from('logos')
      .upload(caminho, arquivo, { upsert: true, cacheControl: '3600' })

    if (erroUpload) {
      setErroImagem('Não foi possível enviar a imagem. Tente novamente.')
      setEnviandoImagem(null)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(caminho)
    atualizarCampo(campo, `${data.publicUrl}?v=${Date.now()}`)
    setEnviandoImagem(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSalvando(true)
    setErroSalvar(null)
    const resultado = await salvar(form)
    setSalvando(false)
    if (!resultado) {
      setSucesso(true)
      document.documentElement.style.setProperty('--color-brand-500', form.cor_primaria)
    } else {
      setSucesso(false)
      setErroSalvar(resultado.message ?? 'Não foi possível salvar. Verifique se todas as migrações do banco foram aplicadas.')
    }
  }

  if (carregando || !form) {
    return <div className="h-64 animate-pulse rounded-lg bg-[var(--color-border)]/30" />
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome da empresa</Label>
                <Input id="nome" value={form.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={form.cnpj} onChange={(e) => atualizarCampo('cnpj', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="segmento">Segmento</Label>
                <Select id="segmento" value={form.segmento} onChange={(e) => atualizarCampo('segmento', e.target.value)}>
                  {segmentos.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">E-mail de contato</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => atualizarCampo('email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={form.telefone} onChange={(e) => atualizarCampo('telefone', e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" value={form.endereco} onChange={(e) => atualizarCampo('endereco', e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" value={form.cidade} onChange={(e) => atualizarCampo('cidade', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  maxLength={2}
                  value={form.estado}
                  onChange={(e) => atualizarCampo('estado', e.target.value.toUpperCase())}
                  placeholder="UF"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cor_primaria">Cor da marca</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cor_primaria"
                  type="color"
                  value={form.cor_primaria}
                  onChange={(e) => atualizarCampo('cor_primaria', e.target.value)}
                  className="h-9 w-11 rounded-md border border-[var(--color-border)] bg-transparent"
                />
                <Input value={form.cor_primaria} onChange={(e) => atualizarCampo('cor_primaria', e.target.value)} className="max-w-40" />
              </div>
            </div>

            {erro && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erro}</p>}
            {erroSalvar && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erroSalvar}</p>}
            {sucesso && <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">Dados salvos com sucesso.</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Personalização da página pública de agendamento */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-4">
            <h3 className="font-display text-base font-semibold text-[var(--color-ink-900)]">Página pública de agendamento</h3>
            <p className="text-sm text-[var(--color-ink-400)]">O que seus clientes veem ao acessar seu link de agendamento.</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
            <div>
              <Label>Imagem de capa (banner)</Label>
              <div className="mb-2 flex items-center gap-3">
                {form.banner_url ? (
                  <img src={form.banner_url} alt="Banner" className="h-16 w-32 rounded-md border border-[var(--color-border)] object-cover" />
                ) : (
                  <div className="flex h-16 w-32 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-[var(--color-ink-400)]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <input
                  ref={inputBannerRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleUploadImagem('banner_url', 'banner', e)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputBannerRef.current?.click()}
                  disabled={enviandoImagem === 'banner_url'}
                >
                  {enviandoImagem === 'banner_url' ? 'Enviando…' : 'Escolher imagem'}
                </Button>
              </div>
              <p className="text-xs text-[var(--color-ink-400)]">Recomendado: imagem larga (ex: 1200x400px), até 3MB.</p>
            </div>

            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-12 w-12 rounded-md border border-[var(--color-border)] object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-[var(--color-ink-400)]">
                    <Upload className="h-4 w-4" />
                  </div>
                )}
                <input
                  ref={inputLogoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleUploadImagem('logo_url', 'logo', e)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputLogoRef.current?.click()}
                  disabled={enviandoImagem === 'logo_url'}
                >
                  {enviandoImagem === 'logo_url' ? 'Enviando…' : 'Escolher imagem'}
                </Button>
              </div>
              {erroImagem && <p className="mt-1 text-xs text-danger-500">{erroImagem}</p>}
            </div>

            <div>
              <Label htmlFor="descricao_publica">Sobre a empresa (aparece na página pública)</Label>
              <Textarea
                id="descricao_publica"
                value={form.descricao_publica}
                onChange={(e) => atualizarCampo('descricao_publica', e.target.value)}
                placeholder="Ex: Cortes modernos e atendimento premium há 10 anos no bairro."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="instagram">
                  <span className="flex items-center gap-1">
                    <AtSign className="h-3.5 w-3.5" /> Instagram
                  </span>
                </Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => atualizarCampo('instagram', e.target.value.replace('@', ''))}
                  placeholder="seu.usuario (sem @)"
                />
              </div>
              <div>
                <Label htmlFor="horario_funcionamento">Horário de funcionamento</Label>
                <Input
                  id="horario_funcionamento"
                  value={form.horario_funcionamento}
                  onChange={(e) => atualizarCampo('horario_funcionamento', e.target.value)}
                  placeholder="Ex: Seg a Sáb, 9h às 19h"
                />
              </div>
            </div>

            {linkAgendamento && (
              <div>
                <Label>Link de agendamento online</Label>
                <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2">
                  <span className="flex-1 truncate font-data text-sm text-[var(--color-ink-600)]">{linkAgendamento}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={copiarLink} aria-label="Copiar link">
                    {linkCopiado ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-400)]">
                  Compartilhe este link com seus clientes para que agendem sozinhos, sem precisar de login.
                </p>
              </div>
            )}

            {erroSalvar && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">{erroSalvar}</p>}
            {sucesso && <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">Dados salvos com sucesso.</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
