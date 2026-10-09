// Classificação por regras, sem IA: regras do usuário primeiro, depois as padrão.
// O conteúdo do e-mail é só dado para comparar texto; nada nele é executado.

export type Categoria = 'acao' | 'informativo' | 'descartavel';

export interface Regra {
  tipo: 'remetente' | 'dominio' | 'palavra';
  valor: string;
  categoria: Categoria;
}

export interface Classificavel {
  remetente: string;
  assunto: string;
  previa: string;
  foco?: string;
  importancia?: string;
  sinalizado: boolean;
}

// Assunto que costuma pedir algo: dinheiro, documento, prazo, venda/compra pública.
// Multa, protesto e pendência entram mesmo vindo de remetente de massa: esconder um custa caro.
const PALAVRAS_ACAO =
  /\b(nf-?e|nota fiscal|boleto|fatura|vencimento|vence (hoje|amanh[aã])|vencid[oa]s?|cobran[cç]a|pagamento pendente|pend[eê]ncias?|pix|cota[cç][aã]o|pedido de compra|empenho|preg[aã]o|licita[cç][aã]o|edital|contrato|proposta|or[cç]amento|prazo|urgente|reuni[aã]o|convite|assinatura|certid[aã]o|intima[cç][aã]o|notifica[cç][aã]o extrajudicial|protestos?|cart[oó]rio|multas?|autua[cç](?:[aã]o|[oõ]es)|infra[cç](?:[aã]o|[oõ]es)|indica[cç][aã]o d[eo] condutor)\b/i;

// Remetentes automáticos e de massa
const REMETENTE_AUTOMATICO = /(no-?reply|nao-?responda|newsletter|news@|marketing|promo|ofertas|mailing|mailer|bounce|notifica)/i;

export function classificar(m: Classificavel, regras: Regra[]): { categoria: Categoria; motivo: string } {
  const remetente = m.remetente.toLowerCase();
  const dominio = remetente.split('@')[1] ?? '';
  const texto = `${m.assunto} ${m.previa}`.toLowerCase();

  const porRemetente = regras.find((r) => r.tipo === 'remetente' && r.valor.toLowerCase() === remetente);
  if (porRemetente) return { categoria: porRemetente.categoria, motivo: `sua regra: remetente ${porRemetente.valor}` };
  const porDominio = regras.find((r) => r.tipo === 'dominio' && dominio.endsWith(r.valor.toLowerCase().replace(/^@/, '')));
  if (porDominio) return { categoria: porDominio.categoria, motivo: `sua regra: domínio ${porDominio.valor}` };
  const porPalavra = regras.find((r) => r.tipo === 'palavra' && texto.includes(r.valor.toLowerCase()));
  if (porPalavra) return { categoria: porPalavra.categoria, motivo: `sua regra: palavra "${porPalavra.valor}"` };

  if (m.sinalizado) return { categoria: 'acao', motivo: 'sinalizado no Outlook' };
  if (m.importancia === 'high') return { categoria: 'acao', motivo: 'marcado como importante' };

  const noAssunto = m.assunto.match(PALAVRAS_ACAO);
  if (noAssunto) return { categoria: 'acao', motivo: `assunto fala de "${noAssunto[0].toLowerCase()}"` };

  if (m.foco === 'other') return { categoria: 'descartavel', motivo: 'Outlook colocou em "Outros"' };
  if (REMETENTE_AUTOMATICO.test(remetente)) return { categoria: 'descartavel', motivo: 'remetente automático' };

  const naPrevia = m.previa.match(PALAVRAS_ACAO);
  if (naPrevia) return { categoria: 'acao', motivo: `texto fala de "${naPrevia[0].toLowerCase()}"` };

  return { categoria: 'informativo', motivo: 'sem sinal de ação' };
}
