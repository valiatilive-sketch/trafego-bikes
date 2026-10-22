"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { rodarAgente, type Estado } from "@/app/agentes/acoes";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn cheio" disabled={pending}>
      {pending ? "Rodando… pode levar até 1–2 minutos" : "Rodar agente"}
    </button>
  );
}

export function CartaoAgente(props: {
  chave: string; titulo: string; descricao: string;
  entrada?: { rotulo: string; dica: string; obrigatorio?: boolean };
}) {
  const [estado, acao] = useActionState<Estado, FormData>(rodarAgente, {});
  return (
    <section className="cartao agente">
      <h2>{props.titulo}</h2>
      <p className="suave">{props.descricao}</p>
      <form action={acao} className="form">
        <input type="hidden" name="agente" value={props.chave} />
        {props.entrada && (
          <>
            <label htmlFor={`e-${props.chave}`}>{props.entrada.rotulo}</label>
            <textarea id={`e-${props.chave}`} name="extra" rows={6} placeholder={props.entrada.dica}
              required={props.entrada.obrigatorio} />
          </>
        )}
        <Botao />
      </form>
      {estado.erro && <p className="erro">{estado.erro}</p>}
      {estado.resultado && (
        <div className="resultado">
          <p className="suave pequeno">Gerado em {estado.quando}. Copie o que precisar: o resultado não fica salvo.</p>
          <pre>{estado.resultado}</pre>
        </div>
      )}
    </section>
  );
}
