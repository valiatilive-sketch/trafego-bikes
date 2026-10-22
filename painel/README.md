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
