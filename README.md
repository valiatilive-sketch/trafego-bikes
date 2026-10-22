# trafego-bikes

Time de agentes (Claude Code) que cuida da análise de tráfego pago da loja de bicicleta elétrica:
Meta Ads, Instagram, conversão direta para WhatsApp. **Os agentes só analisam e propõem; você aprova.**

## Agentes (`.claude/agents/`)
| Agente | Função |
|---|---|
| orquestrador | Roda tudo e gera `relatorios/AAAA-MM-DD.md` |
| coletor-meta | Puxa dados do Meta Ads (somente leitura) |
| analista-campanhas | O que funciona, o que não, e por quê |
| classificador-ofertas | Rotula oferta/brinde/garantia/etc. e cruza com resultado |
| espiao-concorrentes | Analisa anúncios de concorrentes e aponta prováveis vencedores |
| roteirista | Roteiros para você gravar |
| orcamento-escala | Propõe pausar/escalar/testar (checklist de aprovação) |
| qualidade-whatsapp | Analisa atendimento e conversão no WhatsApp; roteiro de robô |

## Como usar
1. `cp .env.example .env` e preencha (token **somente leitura** `ads_read` + ID da conta).
2. Preencha `config/negocio.yaml` (ticket, margem, meta de custo por conversa, concorrentes).
3. No Claude Code, dentro desta pasta: peça "use o orquestrador para o relatório da semana".
4. Conversas do WhatsApp: exporte para `conversas/` (pasta ignorada pelo git). Etiquetas em `docs/classificacao-whatsapp.md`.
5. Concorrentes: coloque prints/links da Biblioteca de Anúncios em `dados/concorrentes/`.

## Atenção
- Este repositório é **público**: nunca suba `.env`, conversas ou dados de clientes (o `.gitignore` já bloqueia). Considere torná-lo privado.
- A Biblioteca de Anúncios da Meta não expõe anúncios comerciais por API no Brasil, nem gasto/resultado de concorrentes: a análise é por sinais (tempo no ar, repetição).
- Rodar sozinho todo dia (agendamento) é o próximo passo, depois que o fluxo manual estiver validado.
