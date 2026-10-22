"use server";

import { redirect } from "next/navigation";
import { autenticado } from "@/lib/auth";
import { AGENTES, executarAgente, type ChaveAgente } from "@/lib/agentes";

export type Estado = { agente?: string; resultado?: string; erro?: string; quando?: string };

export async function rodarAgente(_: Estado, dados: FormData): Promise<Estado> {
  if (!(await autenticado())) redirect("/login");
  const agente = String(dados.get("agente") ?? "");
  if (!(agente in AGENTES)) return { erro: "Agente desconhecido." };
  try {
    const resultado = await executarAgente(agente as ChaveAgente, String(dados.get("extra") ?? ""));
    return { agente, resultado, quando: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) };
  } catch (e) {
    return { agente, erro: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}
