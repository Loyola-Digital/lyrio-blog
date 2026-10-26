# Melhorias contínuas

Uma melhoria por rodada, a de maior valor primeiro. Cada uma entra com teste, lint e build passando.

## Feitas

1. **Guarda central do admin** (`proxy.ts` + `lib/admin-gate.ts`): toda rota `/admin/*` e `/api/*` passa pela checagem de sessão antes de rodar. Uma página ou API nova não fica aberta por esquecimento. As checagens de cada página e ação continuam valendo.

2. **Cabeçalhos de segurança** (`lib/security-headers.ts`): todas as páginas com `nosniff` e `Referrer-Policy`; o admin não abre dentro de iframe (proteção contra clickjacking) e não fica em cache.

3. **Página 404 do blog**:
   - artigo inexistente mostra "Página não encontrada" no idioma da URL, com o cabeçalho do blog (`[locale]/not-found.tsx`; textos nos 41 idiomas);
   - endereços fora de qualquer rota caem num 404 próprio (`app/global-not-found.tsx`);
   - limite: um idioma inválido (`/xx`) ainda mostra o 404 padrão do Next, com status 404. Fechar isso via `dynamicParams` quebraria os artigos gerados sob demanda.

4. **CI no GitHub Actions** (`.github/workflows/ci.yml`): a cada push rodam os testes (inclusive contra um Postgres de verdade), o lint, os tipos e o build. **Parado por cobrança:** o GitHub não iniciou o job porque o pagamento da organização Loyola-Digital falhou ou o limite de gastos do Actions precisa subir (Settings → Billing & plans). Resolvido isso, roda sozinho.

5. **JSON-LD da página inicial** (`homeJsonLd`): cada idioma descreve a home como `CollectionPage` com a `ItemList` dos artigos, um índice que as IAs leem direto.

6. **Acessibilidade do blog**: link "pular para o conteúdo" (traduzido nos 42 idiomas) e foco visível dourado para quem navega pelo teclado.

7. **Tela de erro do admin** (`admin/error.tsx`): se o banco ou a rede falharem, aparece "Algo deu errado" com o código do erro e um botão "Tentar de novo" que recarrega os dados. Testado desligando o banco local e religando.

## Descartadas

- Trilha "Artigos › tipo" visível no artigo: o JSON-LD já tem o breadcrumb e o tipo já aparece acima do título. Não vale o custo.
- Limite de tentativas de login: em servidor sem estado (Vercel) só funcionaria com um banco ou Redis extra. Com senha forte e o atraso de 800 ms, não compensa por enquanto.
