# Blog do Lyrio

`blog.lyrioapp.com`: artigos, perguntas e guias sobre sair do vício em pornografia, otimizados para buscadores e IAs (GEO), em 42 idiomas. O painel `/admin` escreve com IA (OpenRouter), revisa, publica e traduz.

- Spec: `docs/superpowers/specs/2026-10-26-lyrio-blog-geo-design.md`
- Lançamento: `docs/lancamento.md`

## Rodar localmente

```bash
docker run -d --name lyrio-pg -e POSTGRES_PASSWORD=dev -p 54329:5432 postgres:17
cp .env.example .env.local   # DATABASE_URL=postgres://postgres:dev@localhost:54329/postgres, senha e segredo do admin
npm install
npm run db:migrate
npm run seed:about
npm run dev                  # http://localhost:3000/admin
```

## Testes

```bash
npm test                     # unitários (PGlite em memória)
TEST_DATABASE_URL=postgres://postgres:dev@localhost:54329/postgres npm test   # inclui o teste contra Postgres de verdade
```
