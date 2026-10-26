# Melhorias contínuas

Uma melhoria por rodada, a de maior valor primeiro. Cada uma entra com teste, lint e build passando.

## Feitas

1. **Guarda central do admin** (`proxy.ts` + `lib/admin-gate.ts`): toda rota `/admin/*` e `/api/*` passa pela checagem de sessão antes de rodar. Uma página ou API nova não fica aberta por esquecimento. As checagens de cada página e ação continuam valendo.

## Próximas (por valor)

2. Cabeçalhos de segurança: admin sem iframe, `nosniff` e `Referrer-Policy`.
3. Página 404 com a cara do blog, no idioma certo.
4. CI no GitHub Actions: testes (inclusive contra Postgres de verdade), lint e tipos a cada push.
5. JSON-LD da página inicial (lista dos artigos) para as IAs entenderem o índice.
6. Breadcrumb visível no artigo (Artigos › tipo).
7. Acessibilidade do blog: "pular para o conteúdo" e foco visível.
8. Tela de erro do admin, em vez da página genérica do Next.
