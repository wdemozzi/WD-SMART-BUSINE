// Gera e baixa um CSV a partir de um array de objetos.
// Não depende de nenhuma biblioteca externa — mais seguro e leve que
// pacotes de parsing de planilhas, que não precisamos aqui (só exportamos).

function escaparCelula(valor: unknown): string {
  const texto = valor == null ? '' : String(valor)
  if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

export function exportarCsv(nomeArquivo: string, colunas: { chave: string; rotulo: string }[], linhas: Record<string, unknown>[]) {
  const cabecalho = colunas.map((c) => escaparCelula(c.rotulo)).join(',')
  const corpo = linhas.map((linha) => colunas.map((c) => escaparCelula(linha[c.chave])).join(',')).join('\n')

  // BOM (\ufeff) garante que o Excel abra acentos corretamente
  const conteudo = '\ufeff' + cabecalho + '\n' + corpo

  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
