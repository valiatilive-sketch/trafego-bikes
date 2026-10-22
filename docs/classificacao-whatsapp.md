# Classificação das conversas de WhatsApp

Uma etiqueta de **resultado** por conversa (use as etiquetas do WhatsApp Business com estes nomes):

| Etiqueta | Significa | Conta como convertida? |
|---|---|---|
| Venda fechada | Pagou/assinou/sinal pago | **Sim (única)** |
| Em negociação | Ativa, pediu preço/financiamento | Não |
| Visita/Test ride | Agendou ir à loja | Etapa avançada |
| Perdida - preço | Achou caro / comparou | Não |
| Perdida - sem resposta | Loja demorou ou sumiu | Não |
| Perdida - outro | Modelo, prazo, região, estoque | Não |
| Curioso | Sem intenção real de compra | Não |

Medidas: tempo da 1ª resposta, mensagens até decidir, objeção mais citada, origem (anúncio/criativo).

## Robô de primeiras respostas
Faz: saudação, horário, preço/autonomia/garantia/entrega/assistência, coleta nome+bairro+modelo.
Humano assume: financiamento, negociação, visita/test ride, fechamento, cliente irritado.
Comece com recursos grátis do WhatsApp Business (saudação, ausência, respostas rápidas, catálogo).

## Privacidade (LGPD)
Conversas ficam na pasta `conversas/` (ignorada pelo git) e são mascaradas (nome/telefone) antes da análise.
