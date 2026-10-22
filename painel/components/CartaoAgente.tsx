"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { rodarAgente, type Estado } from "@/app/agentes/acoes";

const MAX_IMAGENS = 5;

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button className="btn cheio" disabled={pending}>
      {pending ? "Rodando… pode levar até 1–2 minutos" : "Rodar agente"}
    </button>
  );
}

/** Reduz a imagem no navegador (lado maior 1568px, JPEG) para caber no limite de envio da Vercel. */
async function comprimir(arquivo: File): Promise<File> {
  const bmp = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(bmp.width * escala);
  tela.height = Math.round(bmp.height * escala);
  tela.getContext("2d")!.drawImage(bmp, 0, 0, tela.width, tela.height);
  const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, "image/jpeg", 0.8));
  if (!blob) throw new Error("Não consegui ler a imagem.");
  return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function CartaoAgente(props: {
  chave: string; titulo: string; descricao: string;
  entrada?: { rotulo: string; dica: string; obrigatorio?: boolean };
}) {
  const [estado, acao] = useActionState<Estado, FormData>(rodarAgente, {});
  const [imagens, setImagens] = useState<{ arquivo: File; url: string }[]>([]);
  const [aviso, setAviso] = useState("");
  const seletor = useRef<HTMLInputElement>(null);

  const atuais = useRef(imagens);
  atuais.current = imagens;
  useEffect(() => () => atuais.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  function remover(alvo: { arquivo: File; url: string }) {
    URL.revokeObjectURL(alvo.url);
    setImagens((a) => a.filter((x) => x !== alvo));
  }

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    setAviso("");
    try {
      const vaga = MAX_IMAGENS - imagens.length;
      if (novos.length > vaga) setAviso(`Máximo de ${MAX_IMAGENS} imagens por vez.`);
      const prontas = await Promise.all(novos.slice(0, Math.max(vaga, 0)).map(comprimir));
      setImagens((atual) => [...atual, ...prontas.map((arquivo) => ({ arquivo, url: URL.createObjectURL(arquivo) }))]);
    } catch {
      setAviso("Não consegui ler uma das imagens. Tente JPG ou PNG.");
    }
  }

  const aoEnviar = (dados: FormData) => {
    dados.delete("imagens");
    imagens.forEach((i) => dados.append("imagens", i.arquivo));
    acao(dados);
  };

  return (
    <section className="cartao agente">
      <h2>{props.titulo}</h2>
      <p className="suave">{props.descricao}</p>
      <form action={aoEnviar} className="form">
        <input type="hidden" name="agente" value={props.chave} />
        {props.entrada && (
          <>
            <label htmlFor={`e-${props.chave}`}>{props.entrada.rotulo}</label>
            <textarea id={`e-${props.chave}`} name="extra" rows={6} placeholder={props.entrada.dica}
              required={props.entrada.obrigatorio && imagens.length === 0} />
          </>
        )}
        <div className="anexos">
          <input ref={seletor} type="file" accept="image/*" multiple hidden onChange={aoEscolher} />
          <button type="button" className="btn" onClick={() => seletor.current?.click()} disabled={imagens.length >= MAX_IMAGENS}>
            📎 Anexar imagens ({imagens.length}/{MAX_IMAGENS})
          </button>
          <span className="suave pequeno">Prints de anúncios, criativos, quadros de vídeo, concorrentes.</span>
        </div>
        {aviso && <p className="erro">{aviso}</p>}
        {imagens.length > 0 && (
          <div className="miniaturas">
            {imagens.map((i, n) => (
              <div key={i.url} className="mini">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt={`Anexo ${n + 1}`} />
                <button type="button" aria-label="Remover imagem"
                  onClick={() => remover(i)}>×</button>
              </div>
            ))}
          </div>
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
