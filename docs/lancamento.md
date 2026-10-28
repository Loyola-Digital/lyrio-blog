# Lançamento do blog do Lyrio

Checklist para colocar o blog no ar em `lyrioapp.com/{idioma}/blog/`. Tudo em **contas do Lyrio**, para não precisar migrar depois.

## 1. Contas e projeto

- [ ] Repositório no GitHub (privado, na organização do Lyrio) com este código.
- [ ] Projeto na **Vercel**, no plano gratuito (Hobby), importando o repositório. Os termos da Vercel reservam o Hobby para uso não comercial; se ela reclamar ou pausar o projeto, é só migrar para um time Pro. Tecnicamente o Hobby atende: as rotas de IA usam até 5 minutos, que é o máximo do plano.
- [ ] **Neon** pelo Marketplace da Vercel (Storage → Neon). A integração cria o `DATABASE_URL`.
  - Use a URL **pooled** (com `-pooler` no host).
- [ ] **Vercel Blob** (Storage → Blob). Ele cria o `BLOB_READ_WRITE_TOKEN`.
- [ ] Conta no **OpenRouter**, com crédito, para gerar o `OPENROUTER_API_KEY`.
- [ ] Variáveis de ambiente na Vercel (Production):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | vem da Neon |
| `BLOB_READ_WRITE_TOKEN` | vem do Blob |
| `OPENROUTER_API_KEY` | chave do OpenRouter |
| `ADMIN_PASSWORD` | senha do time, com 16 caracteres ou mais |
| `SESSION_SECRET` | `openssl rand -hex 32`. Trocar este valor desloga todo mundo do admin; é o jeito de derrubar sessões. |
| `SITE_URL` | não precisa: o padrão é `https://lyrioapp.com` |

## 2. Banco de produção

```bash
npx vercel link
npx vercel env pull .env.vercel-production --environment=production
node --env-file=.env.vercel-production --import tsx scripts/migrate.ts      # cria as tabelas
node --env-file=.env.vercel-production --import tsx scripts/seed-about.ts   # grava o "Sobre o Lyrio"
```

Não use `.env.production.local` nem sobrescreva o `.env.local`: o `next start` carrega esses arquivos sozinho, e o servidor de teste local passaria a mexer no banco de produção.

O build não precisa do banco: as páginas são geradas na primeira visita. Mas o site só funciona depois que o `DATABASE_URL` existir na Vercel e o `db:migrate` rodar. Sem isso, toda página dá erro 500 com a mensagem "DATABASE_URL não configurada" no log.

## 3. Domínio: o blog dentro do lyrioapp.com

O blog roda na Vercel (`lyrio-blog.vercel.app`) e aparece em `lyrioapp.com/pt-BR/blog/` por um **Worker do Cloudflare** (`cloudflare/blog-proxy.js`). Ele só pega estes caminhos; o resto do site principal nem passa por ele:

- `/{idioma}/blog/*` e `/blog-static/*` (JS, CSS e imagens do blog) vão para a Vercel;
- `/blog-sitemap.xml` é o sitemap do blog;
- no `/robots.txt` do site principal ele acrescenta `Sitemap: https://lyrioapp.com/blog-sitemap.xml`;
- `/llms.txt` sai do blog enquanto o site principal não tiver um.

Para publicar o Worker (uma vez, logado na conta do Cloudflare onde está o `lyrioapp.com`):

```bash
cd cloudflare
npx wrangler login
npx wrangler deploy
```

Idioma novo no blog precisa de rota nova em `cloudflare/wrangler.toml`. O admin continua em `https://lyrio-blog.vercel.app/admin/`.

## 4. Teste em produção

- [ ] `https://lyrioapp.com/pt-BR/blog/` abre o blog, com CSS e fontes (vêm de `/blog-static/`).
- [ ] `https://lyrioapp.com/blog-sitemap.xml` e `https://lyrioapp.com/llms.txt` abrem, e o `https://lyrioapp.com/robots.txt` termina com a linha do sitemap do blog.
- [ ] `/admin` pede a senha. Com a senha certa, entra.
- [ ] Teste real da IA: `node --env-file=.env.local --import tsx scripts/ai-smoke.ts`, depois leia `.superpowers/ai-smoke.json`. Confira se não há função inventada e se o japonês e o árabe vêm na escrita nativa.
- [ ] Criar um artigo de teste à mão, **subir uma imagem** no texto e uma capa, publicar e ver chegar a **41/41** traduções.
- [ ] Abrir as versões `/ar/…` (da direita para a esquerda) e `/ja/…`.
- [ ] Passar uma URL de artigo no [Rich Results Test](https://search.google.com/test/rich-results) e no [validador do schema.org](https://validator.schema.org/).
- [ ] Excluir o artigo de teste e confirmar que a URL dá 404.

## 5. Conteúdo de lançamento

1. O time revisa **Sobre o Lyrio** no admin. A IA só cita o que está lá, então tudo precisa ser verdade. Pontos a confirmar:
   - se os pontos de nível sobem com os dias limpos e com o uso das ferramentas;
   - se o ícone de gráfico da aba Apps é de estatísticas de uso;
   - o exemplo de regra de bloqueio (5 minutos liberados, depois 25 de bloqueio);
   - que dá para resetar a sequência e que o app mostra o tempo desde o último recomeço;
   - que o progresso dos jogos conta como dias limpos de sequência;
   - os selos ("Ativo na Comunidade", "Elite da Comunidade") e as conquistas citadas;
   - o que é a conquista "Usuário Desktop" (hoje fica de fora do texto).
2. `npm run launch:generate` gera os 20 rascunhos (`MODEL=...` troca o modelo). Se algum falhar, rode de novo: ele pula os que já existem.
3. O time **lê e publica** cada rascunho. As traduções saem sozinhas no clique.

## 6. Fora do código (necessário para o GEO funcionar)

- [ ] **Google Search Console**: propriedade de domínio `lyrioapp.com` e envio de `https://lyrioapp.com/blog-sitemap.xml`.
- [ ] **Bing Webmaster Tools**: importar do Search Console e enviar o mesmo sitemap. A busca do ChatGPT usa o Bing.
- [ ] **Site principal** (lyrioapp.com): colocar um link para o blog.
- [ ] **Site principal**: trocar o `author`/`creator` "Blessed Byte" por **Lyrio** nas meta tags.
- [ ] De tempos em tempos, conferir se a lista de robôs de IA em `app/robots.ts` continua atual.
