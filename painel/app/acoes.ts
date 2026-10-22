"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { abrirSessao, autenticado, fecharSessao, senhaCorreta } from "@/lib/auth";
import { alterarStatus } from "@/lib/meta";

let falhas = 0;

export async function entrar(dados: FormData) {
  if (falhas > 0) await new Promise((r) => setTimeout(r, Math.min(falhas, 5) * 1000));
  if (!senhaCorreta(String(dados.get("senha") ?? ""))) {
    falhas++;
    redirect("/login?erro=1");
  }
  falhas = 0;
  await abrirSessao();
  redirect("/");
}

export async function sair() {
  await fecharSessao();
  redirect("/login");
}

export async function mudarStatus(dados: FormData) {
  if (!(await autenticado())) redirect("/login");
  const status = dados.get("status") === "ACTIVE" ? "ACTIVE" : "PAUSED";
  await alterarStatus(String(dados.get("id")), status);
  revalidatePath("/");
}
