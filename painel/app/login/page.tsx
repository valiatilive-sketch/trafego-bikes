import { redirect } from "next/navigation";
import { entrar } from "../acoes";
import { autenticado } from "@/lib/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (await autenticado()) redirect("/");
  const { erro } = await searchParams;
  return (
    <main className="centro">
      <form action={entrar} className="cartao login">
        <h1>Painel de Tráfego</h1>
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required autoFocus />
        {erro && <p className="erro">Senha incorreta.</p>}
        <button className="btn cheio">Entrar</button>
      </form>
    </main>
  );
}
