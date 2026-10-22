"use client";

import { mudarStatus } from "@/app/acoes";

export function BotaoStatus({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const novo = ativo ? "PAUSED" : "ACTIVE";
  const pergunta = ativo
    ? `Pausar "${nome}"?`
    : `ATIVAR "${nome}"? Isso volta a gastar o seu dinheiro de anúncio.`;
  return (
    <form action={mudarStatus} onSubmit={(e) => { if (!confirm(pergunta)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={novo} />
      <button className={ativo ? "btn" : "btn perigo"}>{ativo ? "Pausar" : "Ativar"}</button>
    </form>
  );
}
