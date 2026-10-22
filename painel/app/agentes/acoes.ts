"use server";

import { redirect } from "next/navigation";
import { autenticado } from "@/lib/auth";
import { AGENTES, executarAgente, type ChaveAgente, type Imagem } from "@/lib/agentes";

export type Estado = { agente?: string; resultado?: string; erro?: string; quando?: string };

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_IMAGENS = 5;
const MAX_TOTAL = 4 * 1024 * 1024;

async function lerImagens(dados: FormData): Promise<Imagem[]> {
  const arquivos = dados.getAll("imagens").filter((f): f is File => f instanceof File && f.size > 0);
  if (arquivos.length > MAX_IMAGENS) throw new Error(`Anexe no máximo ${MAX_IMAGENS} imagens.`);
  if (arquivos.reduce((s, f) => s + f.size, 0) > MAX_TOTAL) throw new Error("As imagens passam de 4 MB no total. Anexe menos imagens.");
  return Promise.all(arquivos.map(async (f) => {
    const tipo = TIPOS.find((t) => t === f.type);
    if (!tipo) throw new Error(`Formato não aceito: ${f.type || "desconhecido"}. Use JPG, PNG, WebP ou GIF.`);
    return { mediaType: tipo, base64: Buffer.from(await f.arrayBuffer()).toString("base64") };
  }));
}

export async function rodarAgente(_: Estado, dados: FormData): Promise<Estado> {
  if (!(await autenticado())) redirect("/login");
  const agente = String(dados.get("agente") ?? "");
  if (!(agente in AGENTES)) return { erro: "Agente desconhecido." };
  try {
    const resultado = await executarAgente(agente as ChaveAgente, String(dados.get("extra") ?? ""), await lerImagens(dados));
    return { agente, resultado, quando: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) };
  } catch (e) {
    return { agente, erro: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}
