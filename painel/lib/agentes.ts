import Anthropic from "@anthropic-ai/sdk";
import { metaCusto } from "./diagnostico";
import { carregarCriativos, carregarPainel, type Linha, type Painel } from "./meta";

export type Imagem = { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; base64: string };

export type ChaveAgente =
  | "analista" | "classificador" | "espiao" | "roteirista" | "whatsapp" | "orcamento" | "orquestrador";

type Definicao = {
  titulo: string;
  descricao: string;
  /** Rótulo do campo de texto extra; vazio = sem campo. */
  entrada?: { rotulo: string; dica: string; obrigatorio?: boolean };
  prompt: string;
};

const BASE = `Você atua para o dono de uma loja de bicicleta elétrica (SPEEDBIKE) que atende Vitória, Vila Velha, Serra, Cariacica e Guarapari (ES). Os anúncios rodam no Meta Ads com clique direto para o WhatsApp; o resultado medido é "conversa iniciada no WhatsApp", NÃO venda. Fale em português simples, sem jargão, para quem não é gestor de tráfego. Nunca invente números: use só os dados fornecidos e diga quando algo faltar ou a amostra for pequena. Você só analisa e propõe; nada é alterado na conta. Escreva em texto simples, SEM markdown (sem #, **, tabelas): títulos em MAIÚSCULAS e listas com hífen.`;

export const AGENTES: Record<ChaveAgente, Definicao> = {
  analista: {
    titulo: "Analista de campanhas",
    descricao: "Diagnostica o que está dando certo e errado, com a causa provável e evidência.",
    prompt: `${BASE}
TAREFA: para cada campanha e anúncio com dados suficientes, classifique como ESCALAR, MANTER, AJUSTAR ou PAUSAR e explique a causa provável: criativo fraco (CTR baixo), público saturado (frequência alta), oferta sem força (clica mas não chama no WhatsApp), plataforma ou posicionamento. Compare Instagram x Facebook e recomende se o Facebook faz sentido. Compare 7 dias com 30 dias para ver tendência. Diga quando é cedo demais para concluir. Termine com as 3 ações mais importantes da semana.`,
  },
  classificador: {
    titulo: "Classificador de ofertas",
    descricao: "Rotula o ângulo de cada anúncio (preço, brinde, garantia...) e cruza com o resultado.",
    prompt: `${BASE}
TAREFA: leia os textos dos anúncios e atribua rótulos: oferta agressiva (desconto/preço), brinde, garantia, financiamento/parcela, prova social, urgência/escassez, autoridade/assistência técnica, estilo de vida/economia (fim da gasolina, trânsito). Cruze cada rótulo com o custo por conversa dos anúncios que o usam e diga quais ângulos funcionam na conta e quais não. Aponte ângulos que a loja ainda não testou. Se faltar texto de anúncio, diga.`,
  },
  espiao: {
    titulo: "Espião de concorrentes",
    descricao: "Compara com os concorrentes e aponta o que eles provavelmente fazem de melhor.",
    entrada: {
      rotulo: "Anúncios dos concorrentes (opcional, mas melhora muito)",
      dica: "Cole aqui textos, ganchos e ofertas que você viu na Biblioteca de Anúncios da Meta, com o nome da loja e há quanto tempo o anúncio está no ar.",
    },
    prompt: `${BASE}
TAREFA: você NÃO tem acesso automático aos anúncios dos concorrentes (a Meta não libera isso por API no Brasil), e gasto ou resultado deles nunca é visível. Trabalhe com a lista de concorrentes e com o material que o dono colar. Sinais de performance: tempo no ar, repetição e variações do mesmo criativo, quantidade de anúncios ativos; deixe claro que isso é estimativa. Entregue: (1) o que o material mostra de ganchos, ofertas, formatos e chamadas para ação; (2) o que a SPEEDBIKE ainda não explora em comparação; (3) o que o dono deve procurar e copiar de print na Biblioteca de Anúncios da Meta nos próximos dias. Se não houver material colado, diga isso no início e não invente anúncios de ninguém.`,
  },
  roteirista: {
    titulo: "Roteirista",
    descricao: "Cria roteiros prontos para você gravar, com base no que mais performa.",
    entrada: {
      rotulo: "Contexto extra (opcional)",
      dica: "Ex.: resultado do Espião, promoção do mês, modelo que quer vender, objeção que os clientes mais levantam.",
    },
    prompt: `${BASE}
TAREFA: crie de 3 a 5 roteiros de anúncio (reels/vídeo curto ou imagem) para o dono gravar com celular. Baseie-se nos anúncios com melhor custo por conversa e no contexto extra. Para cada roteiro: gancho nos 3 primeiros segundos, desenvolvimento, oferta, chamada para clicar no botão do WhatsApp, legenda e o que filmar cena a cena. Adapte ao público de Vitória, Vila Velha, Serra, Cariacica e Guarapari. Inclua a hipótese do teste (o que queremos aprender) e como medir. NÃO prometa preço, prazo, brinde ou condição que o dono não informou: use [PREÇO], [BRINDE] etc. como lacunas.`,
  },
  whatsapp: {
    titulo: "Qualidade do WhatsApp",
    descricao: "Analisa conversas: onde se perde venda, objeções, respostas rápidas e roteiro de robô.",
    entrada: {
      rotulo: "Conversas exportadas do WhatsApp (obrigatório)",
      dica: "Cole o texto de várias conversas exportadas (sem mídia). Telefones e e-mails no texto são ocultados, mas troque os nomes. Se anexar prints de conversa, cubra nomes e telefones antes: nas imagens não dá para ocultar automaticamente.",
      obrigatorio: true,
    },
    prompt: `${BASE}
TAREFA: analise as conversas coladas. Classifique cada uma como: Venda fechada, Em negociação, Visita/test ride, Perdida por preço, Perdida por falta de resposta, Perdida por outro motivo ou Curioso (só "venda fechada" conta como convertida; se o desfecho não estiver claro, diga "indefinido"). Calcule o que o texto permitir: tempo da primeira resposta, quantidade de mensagens até a decisão e % por desfecho. Entregue: (1) onde o atendimento perde venda; (2) as objeções e perguntas mais repetidas; (3) 10 respostas rápidas prontas; (4) roteiro de robô de primeiras respostas, com o que ele pode responder e quando passar para humano; (5) objeções para os anúncios já tratarem. Nunca repita nome ou telefone de cliente.`,
  },
  orcamento: {
    titulo: "Orçamento e escala",
    descricao: "Propõe pausar, escalar ou testar, como lista de ações para você aprovar.",
    prompt: `${BASE}
TAREFA: com base nos dados e na meta de custo por conversa, proponha ações concretas em formato de checklist: pausar X, subir o orçamento de Y em no máximo 20% por vez, testar Z. Para cada ação: motivo, impacto esperado, risco e como desfazer. Considere que mudanças muito frequentes reiniciam o aprendizado das campanhas. Lembre que o resultado é conversa, não venda. Não execute nada: o dono aprova.`,
  },
  orquestrador: {
    titulo: "Orquestrador (relatório completo)",
    descricao: "Roda Analista, Classificador, Roteirista e Orçamento juntos e entrega um relatório único.",
    prompt: `${BASE}
TAREFA: você recebe os relatórios dos outros agentes. Entregue um relatório único e curto: (1) RESUMO em 5 linhas; (2) O QUE ESTÁ DANDO CERTO; (3) O QUE ESTÁ DANDO ERRADO; (4) AÇÕES PARA APROVAR (checklist, da mais importante para a menos); (5) ROTEIROS NOVOS (só os títulos e o gancho de cada um). Resolva contradições entre os relatórios e avise quando houver. Não repita tudo: priorize.`,
  },
};

// ---------------------------------------------------------------- contexto
const r2 = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);
const resumo = (l: Linha) => ({
  id: l.id, nome: l.nome, status: l.status, gasto: r2(l.gasto), conversas: l.conversas,
  custo_por_conversa: r2(l.custoPorConversa), frequencia: r2(l.frequencia),
  ctr_link_pct: r2(l.ctr), impressoes: l.impressoes,
});
const periodo = (p: Painel) => ({
  datas: p.periodo, totais: p.totais, plataformas: p.plataformas,
  campanhas: p.campanhas.map(resumo), anuncios: p.anuncios.map(resumo),
});

async function contexto() {
  const [p7, p30, criativos] = await Promise.all([carregarPainel(7), carregarPainel(30), carregarCriativos()]);
  return JSON.stringify({
    conta: p30.conta, meta_custo_por_conversa_reais: metaCusto(),
    ultimos_7_dias: periodo(p7), ultimos_30_dias: periodo(p30),
    textos_dos_anuncios: criativos,
  });
}

/** Esconde telefones e e-mails antes de enviar conversas ao modelo. */
export function mascarar(texto: string) {
  return texto
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[telefone]");
}

// --------------------------------------------------------------- execução
function conteudo(texto: string, imagens: Imagem[]): Anthropic.ContentBlockParam[] {
  const blocos: Anthropic.ContentBlockParam[] = imagens.map((i) => ({
    type: "image", source: { type: "base64", media_type: i.mediaType, data: i.base64 },
  }));
  const aviso = imagens.length ? `O dono anexou ${imagens.length} imagem(ns) acima. Analise-as junto com os dados.\n\n` : "";
  return [...blocos, { type: "text", text: aviso + texto }];
}

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

async function perguntar(system: string, usuario: string, imagens: Imagem[] = []) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não definida na Vercel");
  const cliente = new Anthropic();
  const mensagem = await cliente.messages
    .stream({ model: MODELO, max_tokens: 12000, system, messages: [{ role: "user", content: conteudo(usuario, imagens) }] })
    .finalMessage();
  if (mensagem.stop_reason === "refusal") throw new Error("O modelo recusou este pedido. Reformule ou remova trechos sensíveis.");
  const texto = mensagem.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  if (!texto) throw new Error("O modelo não devolveu texto.");
  return texto + (mensagem.stop_reason === "max_tokens" ? "\n\n[Resposta cortada pelo limite de tamanho.]" : "");
}

function concorrentes() {
  const lista = (process.env.CONCORRENTES ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return lista.length ? lista.join(", ") : "(nenhum informado)";
}

async function rodarUm(chave: Exclude<ChaveAgente, "orquestrador">, extra: string, ctx: string, imagens: Imagem[]) {
  const def = AGENTES[chave];
  let usuario = `DADOS DA CONTA (JSON):\n${ctx}`;
  if (chave === "espiao") usuario += `\n\nCONCORRENTES DA LISTA: ${concorrentes()}`;
  if (extra) usuario += `\n\n${chave === "whatsapp" ? "CONVERSAS" : "MATERIAL DO DONO"}:\n${chave === "whatsapp" ? mascarar(extra) : extra}`;
  return perguntar(def.prompt, usuario, imagens);
}

export async function executarAgente(chave: ChaveAgente, extra: string, imagens: Imagem[] = []) {
  const texto = extra.trim().slice(0, 60000);
  if (AGENTES[chave].entrada?.obrigatorio && !texto && !imagens.length) throw new Error("Este agente precisa do texto pedido no campo acima (ou de imagens anexadas).");
  const ctx = await contexto();

  if (chave !== "orquestrador") return rodarUm(chave, texto, ctx, imagens);

  const partes: Exclude<ChaveAgente, "orquestrador">[] = ["analista", "classificador", "roteirista", "orcamento"];
  const saidas = await Promise.all(partes.map((p) => rodarUm(p, "", ctx, imagens)));
  const juntos = partes.map((p, i) => `=== ${AGENTES[p].titulo.toUpperCase()} ===\n${saidas[i]}`).join("\n\n");
  const final = await perguntar(AGENTES.orquestrador.prompt, `RELATÓRIOS DOS AGENTES:\n${juntos}`);
  return `${final}\n\n----- DETALHE POR AGENTE -----\n\n${juntos}`;
}
