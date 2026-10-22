import type { Linha } from "./meta";

export type Acao = "ESCALAR" | "MANTER" | "AJUSTAR" | "PAUSAR" | "AGUARDAR";

export const metaCusto = () => Number(process.env.META_CUSTO_CONVERSA) || 3;

/** Regras simples sobre custo por CONVERSA (não por venda). Não substitui análise humana. */
export function diagnosticar(l: Linha, meta = metaCusto()): { acao: Acao; motivo: string } {
  const c = l.custoPorConversa;
  const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  if (l.gasto < meta * 2 && l.conversas < 3) return { acao: "AGUARDAR", motivo: "Ainda pouco dado para decidir." };
  if (l.conversas === 0 && l.gasto >= meta * 3)
    return { acao: "PAUSAR", motivo: `Gastou ${brl(l.gasto)} sem nenhuma conversa.` };
  if (c !== null && c > meta * 1.5)
    return l.gasto >= meta * 5
      ? { acao: "PAUSAR", motivo: `Custo por conversa ${brl(c)}, bem acima da meta de ${brl(meta)}.` }
      : { acao: "AJUSTAR", motivo: `Custo por conversa ${brl(c)} acima da meta de ${brl(meta)}. Teste outro criativo.` };
  if (l.frequencia > 3.5)
    return { acao: "AJUSTAR", motivo: `Frequência ${l.frequencia.toFixed(1)}: o público está vendo demais. Troque criativo ou público.` };
  if (c !== null && c <= meta * 0.8 && l.conversas >= 5)
    return { acao: "ESCALAR", motivo: `Custo por conversa ${brl(c)}, abaixo da meta. Suba o orçamento aos poucos (até 20%).` };
  return { acao: "MANTER", motivo: "Dentro da meta." };
}
