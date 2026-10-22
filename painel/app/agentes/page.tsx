import Link from "next/link";
import { redirect } from "next/navigation";
import { CartaoAgente } from "@/components/CartaoAgente";
import { AGENTES, type ChaveAgente } from "@/lib/agentes";
import { autenticado } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ORDEM: ChaveAgente[] = ["orquestrador", "analista", "classificador", "espiao", "roteirista", "whatsapp", "orcamento"];

export default async function Agentes() {
  if (!(await autenticado())) redirect("/login");
  const semChave = !process.env.ANTHROPIC_API_KEY;
  return (
    <main className="pagina">
      <header className="topo">
        <div>
          <h1>Agentes</h1>
          <p className="suave">Cada agente lê os dados reais da conta, analisa e propõe. Nada é alterado no Meta.</p>
        </div>
        <nav className="abas"><Link href="/" className="aba">← Painel</Link></nav>
      </header>
      {semChave && (
        <section className="cartao"><p className="erro">Falta cadastrar a variável ANTHROPIC_API_KEY na Vercel (e fazer Redeploy) para os agentes funcionarem.</p></section>
      )}
      {ORDEM.map((k) => (
        <CartaoAgente key={k} chave={k} titulo={AGENTES[k].titulo} descricao={AGENTES[k].descricao} entrada={AGENTES[k].entrada} />
      ))}
    </main>
  );
}
