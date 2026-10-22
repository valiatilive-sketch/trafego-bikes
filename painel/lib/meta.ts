const VERSAO = process.env.META_API_VERSION || "v22.0";
const BASE = `https://graph.facebook.com/${VERSAO}`;
const CONVERSA = "onsite_conversion.messaging_conversation_started_7d";

type Json = Record<string, any>;

function cabecalho() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN não definido");
  return { Authorization: `Bearer ${token}` };
}

async function lerResposta(res: Response): Promise<Json> {
  const corpo = (await res.json()) as Json;
  if (!res.ok || corpo.error) throw new Error(corpo.error?.message ?? `Meta API ${res.status}`);
  return corpo;
}

async function graph(caminho: string, params: Record<string, string> = {}, post?: Record<string, string>) {
  const url = new URL(`${BASE}/${caminho}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: post ? "POST" : "GET",
    headers: post ? { ...cabecalho(), "Content-Type": "application/x-www-form-urlencoded" } : cabecalho(),
    body: post ? new URLSearchParams(post) : undefined,
    cache: "no-store",
  });
  return lerResposta(res);
}

async function paginar(caminho: string, params: Record<string, string>) {
  let corpo = await graph(caminho, params);
  const itens: Json[] = [...(corpo.data ?? [])];
  while (corpo.paging?.next) {
    corpo = await lerResposta(await fetch(corpo.paging.next, { headers: cabecalho(), cache: "no-store" }));
    itens.push(...(corpo.data ?? []));
  }
  return itens;
}

const conta = () => {
  const id = (process.env.META_AD_ACCOUNT_ID ?? "").replace("act_", "").trim();
  if (!id) throw new Error("META_AD_ACCOUNT_ID não definido");
  return `act_${id}`;
};

const num = (v: unknown) => Number(v ?? 0) || 0;
const conversas = (acoes?: Json[]) => num(acoes?.find((a) => a.action_type === CONVERSA)?.value);

export type Linha = {
  id: string; nome: string; status: string; gasto: number; impressoes: number;
  conversas: number; frequencia: number; ctr: number; custoPorConversa: number | null;
};
export type Plataforma = { nome: string; gasto: number; conversas: number; custoPorConversa: number | null };
export type Painel = {
  conta: string; periodo: string; campanhas: Linha[]; anuncios: Linha[]; plataformas: Plataforma[];
  totais: { gasto: number; conversas: number; impressoes: number; custoPorConversa: number | null };
};

const custo = (gasto: number, conv: number) => (conv > 0 ? gasto / conv : null);

function periodo(dias: number) {
  const fim = new Date();
  const inicio = new Date(Date.now() - (dias - 1) * 86400000);
  const f = (d: Date) => d.toISOString().slice(0, 10);
  return { texto: `${f(inicio)} a ${f(fim)}`, intervalo: JSON.stringify({ since: f(inicio), until: f(fim) }) };
}

export async function carregarPainel(dias: number): Promise<Painel> {
  const c = conta();
  const { texto, intervalo } = periodo(dias);
  const campos = "spend,impressions,reach,frequency,inline_link_click_ctr,actions";

  const [info, campanhasCad, anunciosCad, insCamp, insAnuncio] = await Promise.all([
    graph(c, { fields: "name" }),
    paginar(`${c}/campaigns`, { fields: "id,name,effective_status", limit: "200" }),
    paginar(`${c}/ads`, { fields: "id,name,effective_status", limit: "500" }),
    paginar(`${c}/insights`, { level: "campaign", time_range: intervalo, fields: `campaign_id,campaign_name,${campos}`, limit: "200" }),
    paginar(`${c}/insights`, { level: "ad", breakdowns: "publisher_platform", time_range: intervalo, fields: `ad_id,ad_name,${campos}`, limit: "500" }),
  ]);

  const monta = (cad: Json[], ins: Json[], chaveId: string, chaveNome: string): Linha[] => {
    const acc = new Map<string, Linha & { pesoFreq: number; cliques: number }>();
    for (const x of ins) {
      const id = x[chaveId] as string;
      const base = cad.find((k) => k.id === id);
      const l = acc.get(id) ?? {
        id, nome: x[chaveNome], status: base?.effective_status ?? "—", gasto: 0, impressoes: 0,
        conversas: 0, frequencia: 0, ctr: 0, custoPorConversa: null, pesoFreq: 0, cliques: 0,
      };
      const imp = num(x.impressions);
      l.gasto += num(x.spend); l.impressoes += imp; l.conversas += conversas(x.actions);
      l.pesoFreq += num(x.frequency) * imp; l.cliques += (num(x.inline_link_click_ctr) / 100) * imp;
      acc.set(id, l);
    }
    return [...acc.values()].map((l) => ({
      id: l.id, nome: l.nome, status: l.status, gasto: l.gasto, impressoes: l.impressoes, conversas: l.conversas,
      frequencia: l.impressoes ? l.pesoFreq / l.impressoes : 0,
      ctr: l.impressoes ? (l.cliques / l.impressoes) * 100 : 0,
      custoPorConversa: custo(l.gasto, l.conversas),
    })).sort((a, b) => b.gasto - a.gasto);
  };

  const campanhas = monta(campanhasCad, insCamp, "campaign_id", "campaign_name");
  const anuncios = monta(anunciosCad, insAnuncio, "ad_id", "ad_name");

  const porPlat = new Map<string, { gasto: number; conv: number }>();
  for (const x of insAnuncio) {
    const p = (x.publisher_platform as string) ?? "outros";
    const a = porPlat.get(p) ?? { gasto: 0, conv: 0 };
    a.gasto += num(x.spend); a.conv += conversas(x.actions);
    porPlat.set(p, a);
  }
  const plataformas = [...porPlat.entries()]
    .map(([nome, a]) => ({ nome, gasto: a.gasto, conversas: a.conv, custoPorConversa: custo(a.gasto, a.conv) }))
    .sort((a, b) => b.gasto - a.gasto);

  const gasto = campanhas.reduce((s, l) => s + l.gasto, 0);
  const conv = campanhas.reduce((s, l) => s + l.conversas, 0);
  return {
    conta: info.name, periodo: texto, campanhas, anuncios, plataformas,
    totais: { gasto, conversas: conv, impressoes: campanhas.reduce((s, l) => s + l.impressoes, 0), custoPorConversa: custo(gasto, conv) },
  };
}

export async function alterarStatus(id: string, status: "ACTIVE" | "PAUSED") {
  if (!/^\d+$/.test(id)) throw new Error("ID inválido");
  await graph(id, {}, { status });
}
