import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const NOME = "painel_sessao";
const DURACAO_S = 60 * 60 * 24 * 7;

function segredo() {
  const s = process.env.PAINEL_SEGREDO;
  if (!s || s.length < 16) throw new Error("PAINEL_SEGREDO ausente ou curto (mín. 16 caracteres)");
  return s;
}

const assinar = (valor: string) => createHmac("sha256", segredo()).update(valor).digest("hex");

function iguais(a: string, b: string) {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function senhaCorreta(tentativa: string) {
  const senha = process.env.PAINEL_SENHA?.trim();
  if (!senha) throw new Error("PAINEL_SENHA não definida");
  return iguais(tentativa.trim(), senha);
}

export async function abrirSessao() {
  const exp = String(Math.floor(Date.now() / 1000) + DURACAO_S);
  (await cookies()).set(NOME, `${exp}.${assinar(exp)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", maxAge: DURACAO_S,
  });
}

export async function fecharSessao() {
  (await cookies()).delete(NOME);
}

export async function autenticado() {
  const valor = (await cookies()).get(NOME)?.value;
  if (!valor) return false;
  const [exp, assinatura] = valor.split(".");
  if (!exp || !assinatura || Number(exp) < Date.now() / 1000) return false;
  return iguais(assinatura, assinar(exp));
}
