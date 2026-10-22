import Link from "next/link";
import { redirect } from "next/navigation";
import { sair } from "./acoes";
import { BotaoStatus } from "@/components/BotaoStatus";
import { autenticado } from "@/lib/auth";
import { diagnosticar, metaCusto, type Acao } from "@/lib/diagnostico";
import { carregarPainel, type Linha } from "@/lib/meta";

export const dynamic = "force-dynamic";

const brl = (v: number | null) => (v === null ? "—" : `R$ ${v.toFixed(2).replace(".", ",")}`);
const inteiro = (v: number) => v.toLocaleString("pt-BR");
const PERIODOS = [7, 14, 30];
const COR: Record<Acao, string> = { ESCALAR: "ok", MANTER: "neutro", AJUSTAR: "aviso", PAUSAR: "ruim", AGUARDAR: "neutro" };

function Tabela({ titulo, linhas, meta }: { titulo: string; linhas: Linha[]; meta: number }) {
  return (
    <section className="cartao">
      <h2>{titulo}</h2>
      <div className="rolagem">
        <table>
          <thead>
            <tr><th>Nome</th><th>Status</th><th>Gasto</th><th>Conversas</th><th>Custo/conv.</th><th>Freq.</th><th>CTR</th><th>Sugestão</th><th></th></tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const d = diagnosticar(l, meta);
              const ativo = l.status === "ACTIVE";
              return (
                <tr key={l.id}>
                  <td className="nome">{l.nome}</td>
                  <td>{ativo ? "Ativo" : l.status === "PAUSED" ? "Pausado" : l.status}</td>
                  <td>{brl(l.gasto)}</td>
                  <td>{inteiro(l.conversas)}</td>
                  <td>{brl(l.custoPorConversa)}</td>
                  <td>{l.frequencia.toFixed(1)}</td>
                  <td>{l.ctr.toFixed(1)}%</td>
                  <td><span className={`etiqueta ${COR[d.acao]}`} title={d.motivo}>{d.acao}</span></td>
                  <td>{(ativo || l.status === "PAUSED") && <BotaoStatus id={l.id} nome={l.nome} ativo={ativo} />}</td>
                </tr>
              );
            })}
            {linhas.length === 0 && <tr><td colSpan={9}>Sem dados no período.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  if (!(await autenticado())) redirect("/login");
  const { dias: d } = await searchParams;
  const dias = PERIODOS.includes(Number(d)) ? Number(d) : 7;
  const meta = metaCusto();

  let painel;
  try {
    painel = await carregarPainel(dias);
  } catch (e) {
    return (
      <main className="pagina">
        <section className="cartao"><h1>Não consegui falar com o Meta</h1>
          <p className="erro">{e instanceof Error ? e.message : "Erro desconhecido"}</p>
          <p>Confira o token e o ID da conta nas variáveis de ambiente da Vercel.</p></section>
      </main>
    );
  }

  const atencao = painel.anuncios
    .map((l) => ({ l, d: diagnosticar(l, meta) }))
    .filter((x) => x.d.acao !== "MANTER" && x.d.acao !== "AGUARDAR");

  return (
    <main className="pagina">
      <header className="topo">
        <div>
          <h1>{painel.conta}</h1>
          <p className="suave">{painel.periodo} · meta: {brl(meta)} por conversa</p>
        </div>
        <nav className="abas">
          {PERIODOS.map((p) => (
            <Link key={p} href={`/?dias=${p}`} className={p === dias ? "aba ativa" : "aba"}>{p} dias</Link>
          ))}
          <form action={sair}><button className="aba">Sair</button></form>
        </nav>
      </header>

      <section className="kpis">
        <div className="cartao kpi"><span>Gasto</span><strong>{brl(painel.totais.gasto)}</strong></div>
        <div className="cartao kpi"><span>Conversas no WhatsApp</span><strong>{inteiro(painel.totais.conversas)}</strong></div>
        <div className="cartao kpi"><span>Custo por conversa</span><strong>{brl(painel.totais.custoPorConversa)}</strong></div>
        <div className="cartao kpi"><span>Impressões</span><strong>{inteiro(painel.totais.impressoes)}</strong></div>
      </section>

      <section className="cartao">
        <h2>O que fazer agora</h2>
        {atencao.length === 0 ? <p className="suave">Nada urgente. Nenhum anúncio fora da meta com dados suficientes.</p> : (
          <ul className="lista">
            {atencao.map(({ l, d: dx }) => (
              <li key={l.id}><span className={`etiqueta ${COR[dx.acao]}`}>{dx.acao}</span> <strong>{l.nome}</strong> — {dx.motivo}</li>
            ))}
          </ul>
        )}
        <p className="suave pequeno">Sugestões automáticas por custo por conversa. Elas não sabem quantas conversas viram venda.</p>
      </section>

      <section className="cartao">
        <h2>Por plataforma</h2>
        <div className="plats">
          {painel.plataformas.map((p) => (
            <div key={p.nome} className="plat">
              <strong>{p.nome}</strong>
              <span>{brl(p.gasto)} · {inteiro(p.conversas)} conversas</span>
              <span>{brl(p.custoPorConversa)} por conversa</span>
            </div>
          ))}
        </div>
      </section>

      <Tabela titulo="Campanhas" linhas={painel.campanhas} meta={meta} />
      <Tabela titulo="Anúncios" linhas={painel.anuncios} meta={meta} />
    </main>
  );
}
