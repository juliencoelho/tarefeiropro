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

// Graves: entram como ação mesmo vindo de remetente de massa, porque esconder um custa caro.
const PALAVRAS_GRAVES =
  /\b(protestos?|cart[oó]rio|intima[cç][aã]o|notifica[cç][aã]o extrajudicial|multas?|autua[cç](?:[aã]o|[oõ]es)|infra[cç](?:[aã]o|[oõ]es)|indica[cç][aã]o d[eo] condutor|fatura atrasada|vencid[oa]s?)\b/i;

// Dinheiro, documento e compra pública: ação, a não ser que o texto tenha cara de propaganda.
const PALAVRAS_DINHEIRO =
  /\b(nf-?e|nota fiscal|boleto|fatura|vencimento|vence (hoje|amanh[aã])|cobran[cç]a|pagamento pendente|pend[eê]ncias?|pix|cota[cç][aã]o|pedido de compra|ordem de compra|empenho|preg[aã]o|licita[cç][aã]o|edital|certid[aã]o)\b/i;

// Conversa: só é ação quando vem de uma pessoa. "Convite" e "proposta" de remetente de massa
// eram quase sempre webinar e plano de saúde (revisão com o Julien em 23/11/2026).
const PALAVRAS_CONVERSA =
  /\b(contrato|proposta|or[cç]amento|prazo|urgente|reuni[aã]o|convite|assinatura|assinar|desvio de qualidade|queixa|reclama[cç][aã]o|devolu[cç][aã]o|diverg[eê]ncia|troca)\b/i;

// Linguagem de anúncio. As fortes valem para qualquer remetente; as fracas só para envio em massa,
// porque um cliente pode escrever "desconto" ou "garanta" num e-mail de verdade.
const PROPAGANDA_FORTE =
  /(\d+\s*%\s*off|black\s*(friday|novem)|cupom|webinar|masterclass|aula gratuita|live gratuita|inscreva-se|inscri[cç][oõ]es abertas|matr[ií]culas abertas|vagas limitadas|imperd[ií]vel)/i;
const PROPAGANDA_FRACA =
  /(desconto|promo[cç][aã]o|\bofertas?\b|frete gr[aá]tis|gr[aá]tis|liberamos|condi[cç][oõ]es especiais|economiz|aproveite|garanta|[uú]ltimas? (vagas|horas|chance|unidades)|matr[ií]culas|ao vivo|n[aã]o perca)/i;

// Remetentes automáticos e de massa: pelo endereço ou por subdomínio típico de disparo
const REMETENTE_AUTOMATICO = /(no-?reply|nao-?responda|newsletter|news@|marketing|mkt@|promo|ofertas|mailing|mailer|bounce|notifica)/i;
const SUBDOMINIO_MASSA = /@(?:e|em\d*|mail\d*|email|news|novidades|marketing|engage|comunica(?:cao|dos)|updates|trx|click|info)\./i;

export function classificar(m: Classificavel, regras: Regra[]): { categoria: Categoria; motivo: string } {
  const remetente = m.remetente.toLowerCase();
  const dominio = remetente.split('@')[1] ?? '';
  // "Cotação_AGULHA": o sublinhado conta como letra no \b do regex, então vira espaço
  const assunto = m.assunto.replace(/_/g, ' ');
  const texto = `${assunto} ${m.previa}`.toLowerCase();

  const porRemetente = regras.find((r) => r.tipo === 'remetente' && r.valor.toLowerCase() === remetente);
  if (porRemetente) return { categoria: porRemetente.categoria, motivo: `sua regra: remetente ${porRemetente.valor}` };
  const porDominio = regras.find((r) => r.tipo === 'dominio' && dominio.endsWith(r.valor.toLowerCase().replace(/^@/, '')));
  if (porDominio) return { categoria: porDominio.categoria, motivo: `sua regra: domínio ${porDominio.valor}` };
  const porPalavra = regras.find((r) => r.tipo === 'palavra' && texto.includes(r.valor.toLowerCase()));
  if (porPalavra) return { categoria: porPalavra.categoria, motivo: `sua regra: palavra "${porPalavra.valor}"` };

  if (m.sinalizado) return { categoria: 'acao', motivo: 'sinalizado no Outlook' };
  if (m.importancia === 'high') return { categoria: 'acao', motivo: 'marcado como importante' };

  const massa = REMETENTE_AUTOMATICO.test(remetente) || SUBDOMINIO_MASSA.test(remetente);

  const grave = assunto.match(PALAVRAS_GRAVES);
  if (grave) return { categoria: 'acao', motivo: `assunto fala de "${grave[0].toLowerCase()}"` };

  const propaganda = texto.match(PROPAGANDA_FORTE) ?? ((massa || m.foco === 'other') ? texto.match(PROPAGANDA_FRACA) : null);
  if (propaganda) {
    return { categoria: 'descartavel', motivo: `parece propaganda ("${propaganda[0].toLowerCase()}")` };
  }

  const dinheiro = assunto.match(PALAVRAS_DINHEIRO);
  if (dinheiro) return { categoria: 'acao', motivo: `assunto fala de "${dinheiro[0].toLowerCase()}"` };

  const conversa = assunto.match(PALAVRAS_CONVERSA);
  if (conversa && !massa) return { categoria: 'acao', motivo: `assunto fala de "${conversa[0].toLowerCase()}"` };

  if (m.foco === 'other') return { categoria: 'descartavel', motivo: 'Outlook colocou em "Outros"' };
  if (massa) return { categoria: 'descartavel', motivo: 'remetente automático' };

  const naPrevia = m.previa.match(PALAVRAS_GRAVES) ?? m.previa.match(PALAVRAS_DINHEIRO) ?? m.previa.match(PALAVRAS_CONVERSA);
  if (naPrevia) return { categoria: 'acao', motivo: `texto fala de "${naPrevia[0].toLowerCase()}"` };

  return { categoria: 'informativo', motivo: 'sem sinal de ação' };
}
