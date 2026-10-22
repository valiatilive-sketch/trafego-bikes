# Painel de Tráfego (Next.js, Vercel)

Painel privado da conta Meta Ads: gasto, conversas no WhatsApp, custo por conversa, plataformas,
sugestões (ESCALAR / MANTER / AJUSTAR / PAUSAR) e botões para **pausar/ativar** campanhas e anúncios
(com confirmação). Protegido por senha.

## Publicar na Vercel
1. Em vercel.com, **Add New → Project** e importe este repositório.
2. Em **Root Directory**, escolha `painel`.
3. Em **Environment Variables**, cadastre (veja `.env.example`):
   `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_API_VERSION`, `PAINEL_SENHA`, `PAINEL_SEGREDO`, `META_CUSTO_CONVERSA`.
4. **Deploy**. O endereço `*.vercel.app` gerado é o seu link.

## Agentes (aba /agentes)
Orquestrador, Analista, Classificador de ofertas, Espião de concorrentes, Roteirista, Qualidade do WhatsApp e Orçamento.
Cada um lê os dados reais da conta (7 e 30 dias + textos dos anúncios), chama a API da Anthropic e mostra o resultado na tela.
Precisam de `ANTHROPIC_API_KEY` na Vercel (modelo padrão `claude-opus-5-5`; para gastar menos, `ANTHROPIC_MODEL=claude-sonnet-5-5`).
Todos aceitam até 5 imagens anexadas (prints de anúncios, criativos, quadros de vídeo); elas são reduzidas no navegador antes do envio.
Nada é alterado no Meta por eles. Os resultados não ficam salvos: copie o que precisar.
Conversas do WhatsApp coladas têm telefones e e-mails ocultados antes do envio. Troque os nomes dos clientes antes de colar.

## Segurança
- Um link "escondido" **não é proteção**. Quem protege é a senha (`PAINEL_SENHA`) + sessão assinada (`PAINEL_SEGREDO`).
- Use senha longa e `PAINEL_SEGREDO` aleatório (32+ caracteres).
- O token do Meta vive só nas variáveis da Vercel. Nunca no código. Se vazar, revogue e gere outro.
- O painel envia `noindex` e `robots.txt` bloqueando buscadores.
- O token tem `ads_management`: quem entrar no painel consegue pausar/ativar anúncios. Ativar volta a gastar verba.

## Local
`cp .env.example .env.local`, preencha, `npm install`, `npm run dev`.

## Limites
- As sugestões usam custo por **conversa**, não por venda. Elas não sabem quais conversas fecharam.
- O período vai de hoje para trás (inclui o dia atual, ainda parcial), por isso pode diferir um pouco do Gerenciador de Anúncios.
