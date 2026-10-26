# Lançamento do blog do Lyrio

Checklist para colocar `blog.lyrioapp.com` no ar. Tudo em **contas do Lyrio**, para não precisar migrar depois.

## 1. Contas e projeto

- [ ] Repositório no GitHub (privado, na organização do Lyrio) com este código.
- [ ] Projeto na **Vercel**, plano **Pro** (o Hobby não permite uso comercial). Importar o repositório.
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
| `SITE_URL` | `https://blog.lyrioapp.com` |

## 2. Banco de produção

```bash
vercel env pull .env.local     # baixa as variáveis de produção
npm run db:migrate             # cria as tabelas (pode rodar de novo sem problema)
npm run seed:about             # grava o primeiro "Sobre o Lyrio"
```

Faça o deploy **depois** de migrar, porque o build gera as páginas iniciais lendo o banco.

## 3. Domínio

- [ ] Na Vercel: Settings → Domains → adicionar `blog.lyrioapp.com`.
- [ ] No Cloudflare: registro **CNAME** `blog` apontando para `cname.vercel-dns.com`, com o proxy **desligado** (nuvem cinza).
- [ ] Esperar o HTTPS ficar verde na Vercel.

## 4. Teste em produção

- [ ] `https://blog.lyrioapp.com/` redireciona para `/pt-BR` (ou para o idioma do navegador).
- [ ] `/robots.txt`, `/sitemap.xml` e `/llms.txt` abrem.
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

- [ ] **Google Search Console**: propriedade de domínio `lyrioapp.com` (cobre o subdomínio) e envio de `https://blog.lyrioapp.com/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: importar do Search Console e enviar o mesmo sitemap. A busca do ChatGPT usa o Bing.
- [ ] **Site principal** (lyrioapp.com): colocar um link para o blog.
- [ ] **Site principal**: trocar o `author`/`creator` "Blessed Byte" por **Lyrio** nas meta tags.
- [ ] De tempos em tempos, conferir se a lista de robôs de IA em `app/robots.ts` continua atual.
