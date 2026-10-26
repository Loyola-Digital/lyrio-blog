# Blog do Lyrio para GEO: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** blog público multilíngue em `blog.lyrioapp.com`, otimizado para IAs, com um painel admin onde o time do Lyrio escreve artigos (à mão ou com IA), revisa, publica e recebe as traduções automáticas para 41 idiomas.

**Arquitetura:** um único app Next.js na Vercel, com dois root layouts (blog público e admin). Os artigos ficam no Postgres da Neon. Cada artigo tem uma versão por idioma e um `rev` que diz quais traduções estão atualizadas. As páginas públicas são estáticas sob demanda e revalidadas a cada publicação. A tradução é disparada pelo navegador do admin, uma chamada por idioma, para não estourar o tempo das funções.

**Stack:**
- Next.js 16.4 (App Router) e React 19.3, em TypeScript.
- `postgres` (postgres.js): Neon em produção, Postgres no Docker no desenvolvimento. `@vercel/blob` 2.8.
- OpenRouter via `fetch` (API compatível com OpenAI), `zod` 4.6 e `markdown-it` 15.
- Testes com `vitest` 5 e `@electric-sql/pglite` 0.5 (Postgres em memória). `tsx` para os scripts.
- Node 24.

**Spec:** `docs/superpowers/specs/2026-10-26-lyrio-blog-geo-design.md`. Os mockups aprovados estão em `docs/superpowers/specs/2026-10-26-lyrio-blog-geo-mockup/` (`artigo.html` é o visual do blog).

## Restrições globais

- Domínio: `https://blog.lyrioapp.com` (env `SITE_URL`). Site principal: `https://lyrioapp.com`.
- Idiomas, exatamente nesta ordem e grafia: `pt-BR en es zh-Hans zh-Hant hi ar fr bn ru id ur de ja mr te bg hr cs da nl et fi el hu it lv lt pl ro sk sl sv pt-PT nb is uk sr mk sq tr ca` (42 no total). A origem é sempre `pt-BR`. `ar` e `ur` usam `dir="rtl"`.
- URL pública: `/{locale}/{slug}`. Na raiz `/`, redireciona pelo idioma do navegador, com `pt-BR` como padrão.
- Autor e publisher: Organization "Lyrio". Byline: "Equipe Lyrio". A string "Blessed Byte" nunca aparece.
- Lojas:
  - `https://apps.apple.com/app/lyrio/id6760236148`
  - `https://play.google.com/store/apps/details?id=app.rork.lyrio&referrer=utm_source%3Dblog`
- Cores: fundo `#f4f2eb`, azul-marinho `#1b2847`, dourado `#b89346`. Fontes: Newsreader (serifa) e Montserrat (rótulos e menus).
- Visual: sem emoji, sem gradiente decorativo, linhas finas em vez de cards. É o visual de `artigo.html`.
- Tipos de artigo: `artigo`, `faq`, `tutorial`. No menu, aparecem como Artigos · Guias (tutorial) · Perguntas (faq).
- **A IA nunca publica.** Publicar é só por clique humano. As traduções vão ao ar sozinhas depois desse clique.
- Admin: uma senha (`ADMIN_PASSWORD`), cookie assinado (`SESSION_SECRET`) e `noindex`.
- IA: **OpenRouter**, com o modelo escolhido pela pessoa na hora (`OPENROUTER_API_KEY`).
  - Padrões: escrita `anthropic/claude-opus-5.5`; tradução e glossário `anthropic/claude-sonnet-5.5`.
  - Saída estruturada: `response_format: json_schema` em modo strict, com `provider.require_parameters: true` e validação zod da resposta.
- Corpo em Markdown, renderizado com HTML cru **desligado**.
- Antes de usar uma API do Next, confira a documentação da versão instalada (16.4). `params` é uma `Promise`.

## Foco de revisão

1. **`ADMIN_PASSWORD` ou `SESSION_SECRET` vazios** no deploy: ninguém consegue entrar. Isso não pode virar "qualquer senha entra". Teste na Task 3.
2. **Dois artigos com o mesmo slug no mesmo idioma** (títulos parecidos, ou a IA devolvendo o mesmo slug): o segundo vira `-2`, sem erro de banco. Uma nova tradução mantém o slug que já estava no ar. Teste na Task 2.
3. **Tradução de um artigo despublicado ou republicado no meio do processo:** a API recusa um artigo que não está publicado. Uma tradução feita a partir de um `rev` antigo continua contando como faltante. Testes nas Tasks 2 e 7.
4. **Idiomas de escrita não latina e RTL** (`ja`, `zh-Hans`, `hi`, `ar`, `ur`, `ru`):
   - o slug não pode sair vazio nem perder sinais (matras do devanágari, й do russo);
   - a URL com slug codificado precisa encontrar o artigo;
   - a página sai com `dir` e fonte corretos.

   Testes nas Tasks 1 e 8.
5. **A IA recusa, corta a resposta ou o modelo escolhido não suporta saída estruturada** (`content_filter`, `length`, JSON fora do schema, erro do OpenRouter): o admin mostra uma mensagem legível em português, nada é salvo e o tema digitado continua no formulário. Teste das mensagens na Task 5; a manutenção do tema no formulário é verificada à mão na Task 6.

---

### Task 1: Projeto, idiomas e slugs

**Files:**
- Create: projeto Next na raiz (`package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`), `vitest.config.ts`, `.env.example`
- Create: `lib/locales.ts`, `lib/slug.ts`, `lib/site.ts`, `lib/types.ts`
- Test: `tests/locales.test.ts`, `tests/slug.test.ts`

**Interfaces:**
- Produces:
  - `lib/locales.ts`:
    - `LOCALES` (as const, 42 itens) e `type Locale`;
    - `SOURCE_LOCALE: 'pt-BR'` e `TARGET_LOCALES: Locale[]` (41 itens);
    - `isLocale(x: string): x is Locale`, `dirFor(l: Locale): 'rtl' | 'ltr'`;
    - `matchLocale(acceptLanguage: string | null): Locale`;
    - `ENGLISH_NAME` e `NATIVE_NAME`, ambos `Record<Locale, string>`.
  - `lib/slug.ts`: `slugify(s: string): string` e `normalizeSlugParam(raw: string): string`.
  - `lib/site.ts`: `SITE_URL`, `MAIN_SITE = 'https://lyrioapp.com'`, `APP_STORE_URL`, `PLAY_STORE_URL` (valores das restrições globais).
  - `lib/types.ts`:
    ```ts
    export type PostType = 'artigo' | 'faq' | 'tutorial'
    export type FaqItem = { q: string; a: string }
    export type VersionFields = { slug: string; title: string; headline: string; summary: string; bodyMd: string; faq: FaqItem[]; metaDescription: string }
    export type Post = { id: string; type: PostType; topic: string | null; coverUrl: string | null; status: 'draft' | 'published'; rev: number; createdAt: Date; updatedAt: Date; publishedAt: Date | null }
    export type Version = VersionFields & { postId: string; locale: Locale; rev: number; updatedAt: Date }
    ```

- [ ] **Step 1: Criar o projeto e o repositório**
  - `git init`.
  - `npx create-next-app@16.4 . --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm`. Se reclamar da pasta `.superpowers/`, mova-a para fora temporariamente.
  - Instale as dependências: `npm i zod markdown-it postgres @vercel/blob` e `npm i -D vitest @electric-sql/pglite tsx @types/markdown-it`.
  - Em `.gitignore`, adicione `.superpowers/` e `.env*.local`.
  - Em `.env.example`, liste: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `OPENROUTER_API_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SITE_URL`.
  - Banco local: `docker run -d --name lyrio-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:17`, com `DATABASE_URL=postgres://postgres:dev@localhost:5432/postgres`.
  - Em `vitest.config.ts`: alias `@` apontando para a raiz e `environment: 'node'`.
  - Scripts do `package.json`: `"test": "vitest run"`, `"db:migrate": "node --env-file=.env.local --import tsx scripts/migrate.ts"` e o mesmo padrão para `seed:about`, `ui:translate` e `launch:generate`.

- [ ] **Step 2: Escrever os testes que falham**

```ts
// tests/locales.test.ts
expect(LOCALES).toHaveLength(42); expect(TARGET_LOCALES).toHaveLength(41)
expect(TARGET_LOCALES).not.toContain('pt-BR')
expect(dirFor('ar')).toBe('rtl'); expect(dirFor('ur')).toBe('rtl'); expect(dirFor('he' as any)).toBe('ltr')
expect(matchLocale('pt-BR,pt;q=0.9')).toBe('pt-BR')
expect(matchLocale('pt-PT')).toBe('pt-PT')
expect(matchLocale('pt')).toBe('pt-BR')
expect(matchLocale('zh-TW')).toBe('zh-Hant'); expect(matchLocale('zh-HK')).toBe('zh-Hant')
expect(matchLocale('zh-CN')).toBe('zh-Hans'); expect(matchLocale('zh')).toBe('zh-Hans')
expect(matchLocale('no')).toBe('nb'); expect(matchLocale('nn')).toBe('nb')
expect(matchLocale('en-US,en;q=0.8')).toBe('en')
expect(matchLocale('de;q=0.5, fr;q=0.8')).toBe('fr')
expect(matchLocale(null)).toBe('pt-BR'); expect(matchLocale('xx-YY')).toBe('pt-BR')
for (const l of LOCALES) { expect(ENGLISH_NAME[l]).toBeTruthy(); expect(NATIVE_NAME[l]).toBeTruthy() }
```

```ts
// tests/slug.test.ts
expect(slugify('Como parar de ver pornografia?')).toBe('como-parar-de-ver-pornografia')
expect(slugify('Ação & Reação: o Botão Socorro')).toBe('acao-reacao-o-botao-socorro')
expect(slugify('如何停止观看色情内容')).toBe('如何停止观看色情内容')
expect(slugify('कैसे रोकें')).toBe('कैसे-रोकें')          // matras preservados
expect(slugify('Ядерный вариант')).toBe('ядерный-вариант') // й preservado
expect(slugify('كيف أتوقف')).toBe('كيف-أتوقف')
expect(slugify('  --Olá--  ')).toBe('ola')
expect(Array.from(slugify('palavra '.repeat(40))).length).toBeLessThanOrEqual(80)
expect(slugify('palavra '.repeat(40))).not.toMatch(/-$/)
expect(normalizeSlugParam('%E5%A6%82%E4%BD%95')).toBe('如何')
expect(normalizeSlugParam('%E0%A4')).toBe('%E0%A4')       // decode inválido devolve o original
```

- [ ] **Step 3: Rodar `npm test` e confirmar que falha** porque os módulos não existem.

- [ ] **Step 4: Implementar `lib/locales.ts`, `lib/slug.ts`, `lib/site.ts` e `lib/types.ts`**

O `slugify` remove acento **só de letra latina**, para não estragar outras escritas:

```ts
s.normalize('NFD').replace(/([A-Za-z])[̀-ͯ]+/g, '$1').normalize('NFC').toLowerCase()
 .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-+|-+$/g, '')
// depois: corta em 80 code points (Array.from) e remove o hífen final
```

O `matchLocale` funciona assim:
1. Ordena as entradas por `q`.
2. Para cada uma, tenta o casamento exato.
3. Depois tenta os apelidos: `zh-TW` e `zh-HK` viram `zh-Hant`; `zh` e `zh-CN` viram `zh-Hans`; `pt` vira `pt-BR`; `no` e `nn` viram `nb`.
4. Por fim tenta o idioma base (`en-US` vira `en`).
5. Se nada casar, devolve `pt-BR`.

- [ ] **Step 5: Rodar `npm test`.** Esperado: PASS.
- [ ] **Step 6: Commit:** `git add -A && git commit -m "chore: projeto Next, idiomas e slugs"`

---

### Task 2: Banco e camada de dados

**Files:**
- Create: `db/schema.sql`, `lib/db.ts`, `lib/posts.ts`, `lib/settings.ts`, `scripts/migrate.ts`
- Test: `tests/helpers/db.ts`, `tests/posts.test.ts`, `tests/settings.test.ts`

**Interfaces:**
- Consumes: `Locale`, `LOCALES`, `SOURCE_LOCALE`, `TARGET_LOCALES` e os tipos da Task 1.
- Produces:
  - `lib/db.ts`: `type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, any>[]>` e `getSql(): Sql`, que memoiza `postgres(process.env.DATABASE_URL!, { prepare: false })`. O `prepare: false` é para o pooler da Neon. Toda contagem leva `::int`.
  - `lib/posts.ts`, onde todas as funções recebem `sql: Sql` como primeiro argumento:
    - `createPost(sql, { type, topic?, coverUrl?, source: VersionFields }): Promise<string>` cria um rascunho com a versão pt-BR e devolve o id.
    - `updateSource(sql, id, { type, coverUrl, source }): Promise<void>`
    - `publish(sql, id): Promise<{ rev: number }>`, `unpublish(sql, id)`, `deletePost(sql, id)`
    - `saveTranslation(sql, postId, locale, rev, fields: VersionFields): Promise<{ slug: string }>`
    - `missingLocales(sql, id): Promise<Locale[]>`
    - `getPostForEdit(sql, id): Promise<{ post: Post; source: Version } | null>`, numa query só (o `rev` e a origem vêm juntos; a Task 7 depende disso).
    - `listAdminPosts(sql): Promise<{ id: string; type: PostType; status: Post['status']; title: string; translated: number; updatedAt: Date }[]>`
    - `getPublishedVersion(sql, locale, slug): Promise<{ post: Post; version: Version; alternates: { locale: Locale; slug: string }[] } | null>`
    - `listPublished(sql, locale): Promise<(Version & { type: PostType; coverUrl: string | null; publishedAt: Date })[]>`, do mais novo para o mais antigo.
    - `listVersionsOf(sql, postId): Promise<{ locale: Locale; slug: string }[]>`
    - `listAllPublishedVersions(sql): Promise<{ postId: string; locale: Locale; slug: string; title: string; summary: string; updatedAt: Date }[]>`
  - `lib/settings.ts`:
    - `getAbout(sql): Promise<string>` (devolve `''` quando não existe) e `setAbout(sql, text)`;
    - `getGlossary(sql, locale): Promise<Record<string, string> | null>` e `setGlossary(sql, locale, map)`.

- [ ] **Step 1: Escrever `db/schema.sql`** (idempotente)

```sql
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('artigo','faq','tutorial')),
  topic text, cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  rev int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  published_at timestamptz
);
create table if not exists post_versions (
  post_id uuid not null references posts(id) on delete cascade,
  locale text not null, rev int not null default 0,
  slug text not null, title text not null,
  headline text not null default '', summary text not null default '', body_md text not null default '',
  faq jsonb not null default '[]', meta_description text not null default '',
  updated_at timestamptz not null default now(),
  primary key (post_id, locale), unique (locale, slug)
);
create table if not exists settings (key text primary key, value text not null);
create table if not exists glossary (locale text primary key, terms jsonb not null);
```

`scripts/migrate.ts` executa esse arquivo com `getSql()`. Os comandos são separados por `;`, um por chamada.

- [ ] **Step 2: Escrever o helper e os testes que falham**

`tests/helpers/db.ts` exporta duas coisas, usadas também nas Tasks 5, 7 e 10:
- `testSql(): Promise<Sql>`: cria um `new PGlite()`, executa `schema.sql` com `pg.exec` e adapta a template para `pg.query(text, values)`, montando o texto com `$1..$n`. Retorna `res.rows`.
- A fixture `src`: `export const src = (o: Partial<VersionFields> = {}): VersionFields => ({ slug: 'como-parar', title: 'Como parar', headline: '', summary: 's', bodyMd: 'b', faq: [], metaDescription: '', ...o })`.

```ts
// tests/posts.test.ts — cada teste com um testSql() novo

it('cria rascunho com versão pt-BR', async () => {
  const id = await createPost(sql, { type: 'faq', topic: 't', source: src() })
  const e = await getPostForEdit(sql, id)
  expect(e!.post).toMatchObject({ status: 'draft', rev: 0, type: 'faq', topic: 't' })
  expect(e!.source).toMatchObject({ locale: 'pt-BR', slug: 'como-parar', faq: [] })
})
it('slug repetido no mesmo idioma ganha -2; re-salvar o mesmo post mantém', async () => {
  const a = await createPost(sql, { type: 'artigo', source: src() })
  const b = await createPost(sql, { type: 'artigo', source: src() })
  expect((await getPostForEdit(sql, b))!.source.slug).toBe('como-parar-2')
  await updateSource(sql, a, { type: 'artigo', coverUrl: null, source: src({ title: 'Novo' }) })
  expect((await getPostForEdit(sql, a))!.source.slug).toBe('como-parar')
})
it('publish incrementa rev e fixa published_at só na primeira vez', async () => {
  const id = await createPost(sql, { type: 'artigo', source: src() })
  expect(await publish(sql, id)).toEqual({ rev: 1 })
  const first = (await getPostForEdit(sql, id))!.post.publishedAt
  expect(await publish(sql, id)).toEqual({ rev: 2 })
  expect((await getPostForEdit(sql, id))!.post.publishedAt).toEqual(first)
})
it('traduções de rev antigo contam como faltantes; slug existente é mantido', async () => {
  const id = await createPost(sql, { type: 'artigo', source: src() }); await publish(sql, id)
  expect(await missingLocales(sql, id)).toHaveLength(41)
  expect(await saveTranslation(sql, id, 'de', 1, src({ slug: 'wie-aufhoeren' }))).toEqual({ slug: 'wie-aufhoeren' })
  expect(await missingLocales(sql, id)).not.toContain('de')
  await publish(sql, id)                                   // rev 2
  expect(await missingLocales(sql, id)).toContain('de')
  expect(await saveTranslation(sql, id, 'de', 2, src({ slug: 'outro-slug' }))).toEqual({ slug: 'wie-aufhoeren' })
  expect((await listAdminPosts(sql))[0].translated).toBe(1)
})
it('público só vê publicados, com alternates', async () => {
  const id = await createPost(sql, { type: 'artigo', source: src() })
  expect(await getPublishedVersion(sql, 'pt-BR', 'como-parar')).toBeNull()
  await publish(sql, id); await saveTranslation(sql, id, 'ja', 1, src({ slug: '如何' }))
  const r = await getPublishedVersion(sql, 'ja', '如何')
  expect(r!.alternates.map(a => a.locale).sort()).toEqual(['ja', 'pt-BR'])
  expect(await listPublished(sql, 'ja')).toHaveLength(1)
  await unpublish(sql, id); expect(await listPublished(sql, 'ja')).toHaveLength(0)
})
it('deletePost remove as versões', async () => {
  const id = await createPost(sql, { type: 'artigo', source: src() }); await deletePost(sql, id)
  expect(await getPostForEdit(sql, id)).toBeNull(); expect(await listVersionsOf(sql, id)).toEqual([])
})
```

```ts
// tests/settings.test.ts
expect(await getAbout(sql)).toBe(''); await setAbout(sql, 'x'); expect(await getAbout(sql)).toBe('x')
expect(await getGlossary(sql, 'de')).toBeNull()
await setGlossary(sql, 'de', { 'Opção Nuclear': 'Nuklearoption' }); await setGlossary(sql, 'ja', { Socorro: '救助' })
expect(await getGlossary(sql, 'de')).toEqual({ 'Opção Nuclear': 'Nuklearoption' })
```

- [ ] **Step 3: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 4: Implementar `lib/db.ts`, `lib/posts.ts`, `lib/settings.ts` e `scripts/migrate.ts`**

Regras:
- `jsonb` sempre como `${JSON.stringify(x)}::jsonb`.
- Os slugs passam por `uniqueSlug(sql, locale, base, postId)` interno, que tenta `base`, `base-2`, `base-3`…, ignorando o próprio post.
- `saveTranslation` mantém o slug existente para aquele `(post, locale)`.
- Cada escrita atualiza `updated_at`.
- `translated` conta as versões com `locale <> 'pt-BR'` e `rev = posts.rev`.
- `missingLocales` são os `TARGET_LOCALES` sem versão no `rev` atual.

- [ ] **Step 5: Rodar `npm test`.** Esperado: PASS.
- [ ] **Step 6: Commit:** `git commit -am "feat: schema e camada de dados"` (com `git add` dos arquivos novos)

---

### Task 3: Login do admin

**Files:**
- Create: `lib/auth.ts`, `app/(admin)/admin/guard.ts`, `app/(admin)/admin/layout.tsx`, `app/(admin)/admin/admin.css`, `app/(admin)/admin/login/page.tsx`, `app/(admin)/admin/actions.ts` (com `login` e `logout`)
- Test: `tests/auth.test.ts`

**Interfaces:**
- Produces:
  - `lib/auth.ts` (puro, `node:crypto`):
    - `SESSION_COOKIE = 'lyrio_admin'`, `SESSION_DAYS = 30`;
    - `checkPassword(input: string, expected = process.env.ADMIN_PASSWORD ?? ''): boolean`;
    - `signSession(secret: string, now = Date.now()): string`;
    - `verifySession(token: string | undefined, secret: string, now = Date.now()): boolean`.
  - `guard.ts`: `isAdmin(): Promise<boolean>` e `requireAdmin(): Promise<void>`, que redireciona para `/admin/login`.
  - `actions.ts`: `login(prev: { error?: string }, fd: FormData)` e `logout()`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
expect(checkPassword('', '')).toBe(false)
expect(checkPassword('qualquer', '')).toBe(false)      // senha não configurada não libera ninguém
expect(checkPassword('abc', 'abc')).toBe(true); expect(checkPassword('abd', 'abc')).toBe(false)
expect(() => signSession('')).toThrow()
const t = signSession('s', 0)
expect(verifySession(t, 's', 1000)).toBe(true)
expect(verifySession(t, 's', 31 * 86400_000)).toBe(false)   // expirado
expect(verifySession(t, 'outro', 1000)).toBe(false)
expect(verifySession(t.replace(/^\d+/, '9999999999999'), 's', 1000)).toBe(false)
expect(verifySession(undefined, 's')).toBe(false); expect(verifySession('lixo', 's')).toBe(false)
expect(verifySession(t, '', 1000)).toBe(false)
```

- [ ] **Step 2: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 3: Implementar**
  - **Token:** `${exp}.${hmacSha256Hex(secret, String(exp))}`.
  - **Comparação:** `timingSafeEqual` sobre os digests SHA-256, nos dois lugares.
  - **Login:** se a senha falhar, espera 800 ms e devolve `{ error: 'Senha incorreta.' }`. Se acertar, grava o cookie com `httpOnly`, `secure` em produção, `sameSite: 'lax'`, `path: '/'` e `maxAge` de 30 dias, e redireciona para `/admin`.
  - **Layout do admin:** `<html lang="pt-BR">`, `metadata.robots = { index: false, follow: false }` e o visual simples da marca (`admin.css`).
  - **Página de login:** campo de senha e botão "Entrar".

- [ ] **Step 4: Rodar `npm test`.** Esperado: PASS. Em seguida, `npm run dev`:
  - com `ADMIN_PASSWORD` e `SESSION_SECRET` no `.env.local`, `/admin/login` entra com a senha certa e recusa a errada;
  - sem cookie, `/admin` volta para o login.
- [ ] **Step 5: Commit:** `feat: login do admin`

---

### Task 4: Markdown, JSON-LD, llms.txt e caminhos de revalidação

**Files:**
- Create: `lib/markdown.ts`, `lib/jsonld.ts`, `lib/llms.ts`, `lib/revalidate.ts`
- Test: `tests/markdown.test.ts`, `tests/jsonld.test.ts`, `tests/llms.test.ts`

**Interfaces:**
- Consumes: os tipos da Task 1 e `MAIN_SITE`, `SITE_URL` e as URLs das lojas.
- Produces:
  - `lib/markdown.ts`:
    - `renderMarkdown(md: string): string` (markdown-it com `{ html: false, linkify: true, typographer: true }`);
    - `extractSteps(md: string): { name: string; text: string }[]`;
    - `readingMinutes(...parts: string[]): number`.
  - `lib/jsonld.ts`:
    - `articleJsonLd(a: { post: Post; version: Version; url: string; homeUrl: string; homeName: string }): object[]`;
    - `siteJsonLd(): object[]`;
    - `jsonLdString(x: unknown): string`.
  - `lib/llms.ts`: `buildLlmsTxt(about: string, sections: { heading: string; items: { title: string; url: string; summary: string }[] }[]): string`.
  - `lib/revalidate.ts`: `pathsFor(versions: { locale: Locale; slug: string }[]): string[]`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// markdown
expect(renderMarkdown('<script>alert(1)</script>')).toContain('&lt;script&gt;')
expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>')
expect(renderMarkdown('## Por quê?')).toContain('<h2>Por quê?</h2>')
expect(extractSteps('Intro\n\n1. **Saia do lugar.** Levante da cama.\n2. **Abra o Socorro.** Toque.\n')).toEqual([
  { name: 'Saia do lugar', text: 'Levante da cama.' }, { name: 'Abra o Socorro', text: 'Toque.' }])
expect(extractSteps('1. Sem negrito aqui. Resto.')).toEqual([{ name: 'Sem negrito aqui', text: 'Resto.' }])
expect(extractSteps('- item\n- item')).toEqual([])
expect(readingMinutes('palavra '.repeat(440))).toBe(2); expect(readingMinutes('')).toBe(1)
expect(readingMinutes('字'.repeat(880))).toBe(2)          // CJK: 2 caracteres contam como 1 palavra
```

```ts
// jsonld: post tutorial publicado, version com faq de 1 item e corpo com lista numerada
const [blog, crumbs, faq, howto] = articleJsonLd({ post, version, url: U, homeUrl: H, homeName: 'Artigos' })
expect(blog).toMatchObject({ '@type': 'BlogPosting', headline: version.title, inLanguage: version.locale,
  author: { '@type': 'Organization', name: 'Lyrio' }, publisher: { name: 'Lyrio' }, mainEntityOfPage: U,
  description: version.metaDescription, datePublished: post.publishedAt!.toISOString(), dateModified: version.updatedAt.toISOString() })
expect(crumbs['@type']).toBe('BreadcrumbList'); expect(crumbs.itemListElement).toHaveLength(2)
expect(faq).toMatchObject({ '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'q1', acceptedAnswer: { '@type': 'Answer', text: 'a1' } }] })
expect(howto).toMatchObject({ '@type': 'HowTo', step: [{ '@type': 'HowToStep', position: 1 }] })
expect(articleJsonLd({ ...semFaqNemTutorial }).map(x => x['@type'])).toEqual(['BlogPosting', 'BreadcrumbList'])
const site = siteJsonLd()
expect(site.find(x => x['@type'] === 'Organization')).toMatchObject({ name: 'Lyrio', url: 'https://lyrioapp.com' })
expect(JSON.stringify(site)).toContain('id6760236148'); expect(JSON.stringify(site)).toContain('app.rork.lyrio')
expect(site.find(x => x['@type'] === 'MobileApplication')).toMatchObject({ name: 'Lyrio', operatingSystem: 'iOS, Android' })
expect(JSON.stringify([site, blog])).not.toContain('Blessed Byte')
expect(jsonLdString({ a: '</script><b>' })).not.toContain('</script>')
```

```ts
// llms
const out = buildLlmsTxt('Lyrio ajuda a sair do vício.\n\nFunções: Socorro.', [
  { heading: 'Artigos (Português)', items: [{ title: 'T', url: 'https://blog.lyrioapp.com/pt-BR/t', summary: 'S' }] }])
expect(out).toBe('# Lyrio\n\n> Lyrio ajuda a sair do vício.\n\nFunções: Socorro.\n\n## Artigos (Português)\n\n- [T](https://blog.lyrioapp.com/pt-BR/t): S\n')
// revalidate
expect(pathsFor([{ locale: 'ja', slug: '如何' }, { locale: 'ja', slug: 'x' }])).toEqual(
  ['/ja', `/ja/${encodeURIComponent('如何')}`, '/ja/x', '/sitemap.xml', '/llms.txt'])
```

- [ ] **Step 2: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 3: Implementar**
  - **`extractSteps`:** usa os tokens da primeira lista ordenada do markdown-it. `name` é o negrito inicial sem `**` e sem o ponto final; sem negrito, é a primeira frase.
  - **`readingMinutes`:** `max(1, round(palavras / 220))`. As palavras são os tokens separados por espaço; cada 2 caracteres CJK (kana e ideogramas) contam como uma palavra.
  - **`jsonLdString`:** `JSON.stringify(x).replace(/</g, '\\u003c')`.
  - **Logo do publisher:** `${SITE_URL}/logo.png`.
  - **`MobileApplication`:** `applicationCategory: 'HealthApplication'` e `sameAs` com as duas lojas e `MAIN_SITE`. Sem `offers`, porque o preço é desconhecido.
- [ ] **Step 4: Rodar `npm test`.** Esperado: PASS.
- [ ] **Step 5: Commit:** `feat: markdown, json-ld e llms.txt`

---

### Task 5: IA via OpenRouter: escrever, traduzir e glossário

**Files:**
- Create: `lib/ai/openrouter.ts`, `lib/ai/schemas.ts`, `lib/ai/write.ts`, `lib/ai/translate.ts`, `scripts/ai-smoke.ts`
- Test: `tests/ai.test.ts`

**Interfaces:**
- Consumes: `VersionFields`, `PostType`, `Locale`, `ENGLISH_NAME` e `slugify`.
- Produces:
  - `openrouter.ts`:
    - `DEFAULT_WRITER_MODEL = 'anthropic/claude-opus-5.5'`, `DEFAULT_TRANSLATOR_MODEL = 'anthropic/claude-sonnet-5.5'`;
    - `class AiError extends Error`;
    - `isModelId(s: string): boolean`;
    - `jsonSchemaFor(schema: z.ZodType): Record<string, unknown>`;
    - `chatJson<T>(o: { model: string; system: string; user: string; schema: z.ZodType<T>; name: string }, fetchImpl: typeof fetch = fetch): Promise<T>`;
    - `listModels(): Promise<{ id: string; name: string; prompt: number; completion: number }[]>`, com preços em US$ por 1M tokens.
  - `schemas.ts`:
    - `DraftSchema = z.strictObject({ title, headline, summary, body_md, faq: z.array(z.strictObject({ q, a })), slug, meta_description })`, todos `z.string()`, e `type Draft`;
    - `GlossarySchema = z.strictObject({ terms: z.array(z.strictObject({ source: z.string(), target: z.string() })) })`.
  - `write.ts`:
    - `writerSystem(about: string): string`;
    - `toVersionFields(d: Draft): VersionFields`;
    - `writeArticle(input: { topic: string; type: PostType }, about: string, model: string): Promise<VersionFields>`.
  - `translate.ts`:
    - `TRANSLATOR_SYSTEM: string`, `FEATURE_TERMS: string[]`;
    - `translatorUser(source: VersionFields, locale: Locale, glossary: Record<string, string>): string`;
    - `translateVersion(source, locale, glossary, model: string): Promise<VersionFields>`;
    - `makeGlossary(locale: Locale, model: string): Promise<Record<string, string>>`;
    - `parseGlossaryText(text: string): Record<string, string>` e `formatGlossaryText(m: Record<string, string>): string`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
const ok = (content: string, finish = 'stop') => vi.fn(async () => new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { content } }] }), { status: 200 }))
const S = z.strictObject({ a: z.number() })
beforeEach(() => { process.env.OPENROUTER_API_KEY = 'k' })

it('monta o pedido para o OpenRouter', async () => {
  const f = ok('{"a":1}')
  expect(await chatJson({ model: 'anthropic/claude-opus-5.5', system: 'SYS', user: 'U', schema: S, name: 'x' }, f)).toEqual({ a: 1 })
  const [url, init] = f.mock.calls[0]; const body = JSON.parse(init.body)
  expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
  expect(init.headers.Authorization).toBe('Bearer k')
  expect(body).toMatchObject({ model: 'anthropic/claude-opus-5.5', provider: { require_parameters: true },
    messages: [{ role: 'system', content: 'SYS' }, { role: 'user', content: 'U' }],
    response_format: { type: 'json_schema', json_schema: { name: 'x', strict: true } } })
})
it('erros viram mensagens em português', async () => {
  const run = (f: any) => chatJson({ model: 'm/x', system: '', user: '', schema: S, name: 'x' }, f)
  await expect(run(ok('{"a":1}', 'length'))).rejects.toThrow('O texto ficou longo demais e foi cortado. Tente um tema mais específico.')
  await expect(run(ok('{"a":1}', 'content_filter'))).rejects.toThrow('A IA recusou este tema. Tente reformular ou escolher outro modelo.')
  await expect(run(ok('não é json'))).rejects.toThrow('A IA devolveu um formato inválido. Tente de novo ou escolha outro modelo.')
  await expect(run(ok('{"b":1}'))).rejects.toThrow('A IA devolveu um formato inválido. Tente de novo ou escolha outro modelo.')
  await expect(run(vi.fn(async () => new Response('{"error":{"message":"No endpoints found"}}', { status: 404 })))).rejects.toThrow('Erro do OpenRouter: No endpoints found')
  delete process.env.OPENROUTER_API_KEY
  await expect(run(ok('{"a":1}'))).rejects.toThrow('OPENROUTER_API_KEY não configurada.')
})
it('valida id de modelo e gera json schema strict', () => {
  expect(isModelId('anthropic/claude-opus-5.5')).toBe(true); expect(isModelId('~deepseek/deepseek-flash-latest')).toBe(true)
  expect(isModelId('openai/gpt-5.6-luna:batch')).toBe(true)
  expect(isModelId('foo')).toBe(false); expect(isModelId('a/b c')).toBe(false); expect(isModelId('')).toBe(false)
  const js = jsonSchemaFor(DraftSchema) as any
  expect(js.$schema).toBeUndefined(); expect(js.additionalProperties).toBe(false)
  expect(js.required.sort()).toEqual(['body_md', 'faq', 'headline', 'meta_description', 'slug', 'summary', 'title'])
})
it('converte o rascunho e monta os prompts', () => {
  expect(toVersionFields({ title: ' T ', headline: 'h', summary: 's', body_md: 'b', slug: '', meta_description: 'm',
    faq: [{ q: 'q', a: 'a' }, { q: ' ', a: 'x' }] })).toEqual(
    { title: 'T', headline: 'h', summary: 's', bodyMd: 'b', slug: 't', metaDescription: 'm', faq: [{ q: 'q', a: 'a' }] })
  const sys = writerSystem('SOBRE-XYZ')
  expect(sys).toContain('<sobre>\nSOBRE-XYZ\n</sobre>'); expect(sys).toContain('sem pregação'); expect(sys).toContain('Nunca prometa cura')
  const u = translatorUser(src(), 'de', { 'Opção Nuclear': 'Nuklearoption' })
  expect(u).toContain('German'); expect(u).toContain('Opção Nuclear → Nuklearoption'); expect(u).toContain('"body_md"')
  expect(parseGlossaryText('Socorro = Hilfe\n\n Opção Nuclear=Nuklearoption \nlixo')).toEqual({ Socorro: 'Hilfe', 'Opção Nuclear': 'Nuklearoption' })
  expect(parseGlossaryText(formatGlossaryText({ A: 'b' }))).toEqual({ A: 'b' })
  expect(FEATURE_TERMS).toContain('Opção Nuclear')
})
```

- [ ] **Step 2: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 3: Implementar**

**`chatJson`:**
1. Sem chave, lança `AiError`.
2. Faz `POST` para `https://openrouter.ai/api/v1/chat/completions` com:
   - headers `Authorization`, `Content-Type`, `HTTP-Referer: SITE_URL` e `X-Title: Lyrio Blog`;
   - corpo `{ model, messages: [system, user], response_format: { type: 'json_schema', json_schema: { name, strict: true, schema: jsonSchemaFor(schema) } }, provider: { require_parameters: true }, max_tokens: 16000 }`;
   - `signal: AbortSignal.timeout(280_000)`.
3. Se `!res.ok`, lança `AiError('Erro do OpenRouter: ' + (body.error?.message ?? res.status))`.
4. Trata o resultado:
   - `finish_reason === 'length'` → cortado;
   - `'content_filter'` ou `message.refusal` → recusa;
   - `JSON.parse` com `schema.safeParse` falhando → formato inválido.

**`jsonSchemaFor`:** `z.toJSONSchema(schema)` sem a chave `$schema`.

**`isModelId`:** `/^~?[\w.-]+\/[\w.:-]+$/`.

**`listModels`:**
- busca `https://openrouter.ai/api/v1/models` com `next: { revalidate: 3600 }`;
- fica só com quem tem `supported_parameters` incluindo `structured_outputs` e cujo id não termina em `:batch`;
- `prompt` e `completion` são `pricing × 1e6`;
- ordena por `name`.

**Chamadas:**
- `writeArticle` → `chatJson({ model, system: writerSystem(about), user: \`Tipo: ${type}\nTema: ${topic}\`, schema: DraftSchema, name: 'article' })` e depois `toVersionFields`.
- `translateVersion` → `chatJson` com `TRANSLATOR_SYSTEM`, `translatorUser(...)` e `DraftSchema`, depois `toVersionFields`.
- `makeGlossary` → `GlossarySchema`; devolve um `Record`.

**Copy de `writerSystem(about)`** (fixada pela spec, seção 5):

```
Você escreve para o blog do Lyrio (blog.lyrioapp.com), um app para iPhone e Android que ajuda pessoas a saírem do vício em pornografia. O blog quer ser a melhor resposta para quem pergunta sobre esse tema a um assistente de IA ou ao Google e, quando fizer sentido, mostrar como o Lyrio ajuda.

Sobre o Lyrio (única fonte de verdade sobre o app):
<sobre>
{about}
</sobre>

Conteúdo:
- Só cite funções do app que estejam em <sobre>. Se o tema pedir algo que o app não faz, diga o que ajuda sem atribuir ao Lyrio.
- Nunca prometa cura, não faça diagnóstico e não dê conselho médico. Se o tema tocar em sofrimento grave, recomende procurar um profissional.
- Não invente números, estatísticas, estudos ou citações. Afirmações gerais só se forem amplamente aceitas.
- Mencione o Lyrio onde ele de fato resolve o problema; nunca force.

Voz:
- Português do Brasil, acolhedor, direto, de igual para igual. Frases curtas, sem jargão.
- O Lyrio tem base de fé: ela aparece nos valores (virtudes, propósito, recomeço, "você não está sozinho"), sem pregação. Versículo ou oração só quando o tema pedir. Quem não é religioso deve se sentir bem-vindo.
- O vocabulário do app (Arsenal, batalha, guerreiro) pode aparecer com moderação.
- Evite marcas de texto genérico: "no mundo de hoje", "é importante ressaltar", "em suma", trios de adjetivos, perguntas retóricas em série.

Campos:
- title: como a pessoa pesquisaria, até 70 caracteres.
- headline: uma frase que apoia o título.
- summary: 2 a 3 frases que respondem sozinhas, citáveis fora do contexto. Inclua o Lyrio se ele fizer parte da resposta.
- body_md: Markdown. Subtítulos ## em forma de pergunta. Parágrafos curtos. Sem # (o título já existe). Não repita o summary nem as perguntas frequentes.
- faq: 3 a 6 perguntas que a pessoa faria em seguida, com respostas de 1 a 3 frases.
- slug: minúsculas, sem acento, palavras separadas por hífen.
- meta_description: até 155 caracteres.

Por tipo:
- tutorial: o corpo tem um passo a passo numerado (1. 2. 3.), cada passo começando com uma frase em **negrito**.
- faq: o título é a pergunta central; o primeiro parágrafo do corpo já responde, o resto aprofunda.
- artigo: explicação com subtítulos em forma de pergunta.
```

**Copy de `TRANSLATOR_SYSTEM`:**

```
You translate articles from the Lyrio blog (an app that helps people quit pornography) from Brazilian Portuguese into another language.
- Adapt, don't translate word by word: it must read as written by a native speaker, with the same warm, direct tone and the same quiet faith-based values.
- Use exactly the glossary names for the app's features.
- Keep the Markdown structure identical (headings, lists, bold, links, images). Never translate URLs.
- Do not add or remove information, promises or claims.
- slug: in the target language, lowercase, words joined by hyphens; for non-Latin scripts use the native script.
- meta_description: up to 155 characters.
Return the same fields as the source.
```

`translatorUser` monta três partes:
1. `Target language: ${ENGLISH_NAME[locale]} (${locale})`;
2. o glossário, uma linha `termo → tradução` por par;
3. o JSON da origem em snake_case, com `JSON.stringify(…, null, 2)`.

`makeGlossary(locale)` pede a tradução de `FEATURE_TERMS` como apareceriam numa interface de app localizada, mantendo inalterados os nomes próprios de jogos.

`FEATURE_TERMS` (da spec, seção 9): Socorro, Emergência, Dicas Rápidas, Opção Nuclear, Arsenal, Hábitos, Jornada, Jogos, Diário, Controle de Apps, Modo Foco, Comunidade, Sequência, Melhor sequência, Níveis, Conquistas, Fase de recuperação, Persistência, Escudeiro, Patrulheiro, Veterano, Cavaleiro, Guerreiro(a), Primeiros Passos, Dia perfeito, Elite da Comunidade, Contribuições Especiais, PornEscape, Snake Streak, Combine Virtudes, Bubble Streak, Memória dos Hábitos, Paciência.

- [ ] **Step 4: Rodar `npm test`.** Esperado: PASS.
- [ ] **Step 5: Smoke real, que gasta API (precisa de `OPENROUTER_API_KEY`).** `scripts/ai-smoke.ts`:
  1. escreve um tutorial sobre "como usar o botão Socorro numa crise de madrugada" com `DEFAULT_WRITER_MODEL`;
  2. traduz o resultado para `de`, `ja` e `ar` com `DEFAULT_TRANSLATOR_MODEL`;
  3. grava tudo em `.superpowers/ai-smoke.json`.

  Leia a saída e confira se:
  - o tutorial tem passos em negrito e nenhuma função inventada;
  - o japonês e o árabe vêm na escrita nativa, com slug não vazio.

  Sem chave, o passo fica pendente para a Task 11.
- [ ] **Step 6: Commit:** `feat: escrita e tradução via OpenRouter`

---

### Task 6: Painel admin

**Files:**
- Create:
  - `lib/editor-form.ts`, `lib/md-insert.ts`
  - `app/(admin)/admin/page.tsx` (lista), `app/(admin)/admin/novo/page.tsx`
  - `app/(admin)/admin/artigos/[id]/page.tsx`, `app/(admin)/admin/artigos/[id]/Editor.tsx` (client)
  - `app/(admin)/admin/sobre/page.tsx`, `app/(admin)/admin/ModelPicker.tsx`, `app/api/upload/route.ts`
- Modify: `app/(admin)/admin/actions.ts`
- Test: `tests/editor-form.test.ts`

**Interfaces:**
- Consumes: as Tasks 2, 3 e 5 (incluindo `listModels`, `isModelId` e os modelos padrão), mais `pathsFor` (Task 4).
- Produces:
  - `lib/editor-form.ts`: `parseEditorForm(fd: FormData): { ok: true; value: { type: PostType; coverUrl: string | null; source: VersionFields } } | { ok: false; error: string }`. Os nomes dos campos são `type`, `title`, `headline`, `summary`, `slug`, `metaDescription`, `bodyMd`, `faq` (JSON) e `coverUrl`.
  - `lib/md-insert.ts`: `wrapSelection(value: string, start: number, end: number, before: string, after = ''): { value: string; cursor: number }`.
  - `actions.ts`, onde todas começam com `await requireAdmin()`:
    - `generateDraft(prev: { error?: string; topic?: string; type?: PostType; model?: string }, fd)`:
      - lê `topic`, `type` e `model`;
      - se `!isModelId(model)`, devolve `{ error: 'Modelo inválido.' }`;
      - em caso de sucesso, chama `writeArticle(…, model)` e depois `createPost` com o `topic`, e redireciona para `/admin/artigos/${id}`;
      - em caso de `AiError`, devolve `{ error, topic, type, model }`;
    - `saveDraft(id: string | null, fd): Promise<{ error?: string }>`: quando `id` é `null`, cria o artigo e redireciona para o editor;
    - `publishPost(id: string | null, fd): Promise<{ error?: string; id?: string; missing?: Locale[] }>`;
    - `unpublishPost(id)` e `deletePostAction(id)`;
    - `getMissing(id): Promise<Locale[]>`;
  - `app/(admin)/admin/ModelPicker.tsx` (client): `<ModelPicker name storageKey defaultModel models />`.
    - É um `<input list>` com `<datalist>` vindo de `listModels()`. Cada opção mostra `nome · $entrada/$saída por 1M`.
    - Começa com o último valor salvo em `localStorage[storageKey]` (dentro de try/catch) ou com `defaultModel`, e salva a cada mudança.
    - `saveAbout(fd)` e `saveGlossary(fd)`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f }
const base = { type: 'faq', title: 'O Lyrio é anônimo?', headline: '', summary: 's', slug: '', metaDescription: '', bodyMd: 'b', faq: '[{"q":"a","a":"b"},{"q":"","a":"x"}]', coverUrl: '' }
expect(parseEditorForm(fd(base))).toEqual({ ok: true, value: { type: 'faq', coverUrl: null,
  source: { title: 'O Lyrio é anônimo?', headline: '', summary: 's', slug: 'o-lyrio-e-anonimo', metaDescription: '', bodyMd: 'b', faq: [{ q: 'a', a: 'b' }] } } })
expect(parseEditorForm(fd({ ...base, title: ' ' }))).toEqual({ ok: false, error: 'Preencha o título.' })
expect(parseEditorForm(fd({ ...base, bodyMd: '' }))).toEqual({ ok: false, error: 'Escreva o texto.' })
expect(parseEditorForm(fd({ ...base, type: 'x' }))).toEqual({ ok: false, error: 'Tipo inválido.' })
expect((parseEditorForm(fd({ ...base, faq: '{quebrado' })) as any).value.source.faq).toEqual([])
expect(wrapSelection('abc', 1, 2, '**', '**')).toEqual({ value: 'a**b**c', cursor: 6 })
```

- [ ] **Step 2: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 3: Implementar `lib/editor-form.ts` e `lib/md-insert.ts`, e rodar `npm test` até PASS.**
- [ ] **Step 4: Implementar as telas.** A estrutura segue `admin-fluxo-fragmento.html`, com o visual simples da marca e sem cards genéricos.
  - **`/admin` (lista):**
    - colunas Título · Tipo · Status · Idiomas (`translated/41`) · Atualizado;
    - botão "+ Novo artigo" e link "Sobre o Lyrio".
  - **`/admin/novo`:**
    - "Manual" leva a `/admin/artigos/novo`.
    - "Com IA" é um formulário com `topic` (textarea "Sobre o que vai falar?") e `type` (Artigo / Perguntas / Guia prático).
    - O formulário tem o campo `model`: `ModelPicker` com `storageKey 'lyrio.writerModel'` e padrão `DEFAULT_WRITER_MODEL`.
    - O botão "Gerar com IA", enquanto roda, mostra "Escrevendo… pode levar até 2 minutos".
    - Use `export const maxDuration = 300`.
    - Se a IA der erro, a mensagem aparece e o tema continua preenchido.
    - Se `getAbout` estiver vazio, aparece "Preencha 'Sobre o Lyrio' antes de gerar com IA."
  - **`/admin/artigos/[id]`** (`id` pode ser `novo`):
    - Campos: tipo, título, headline, "Em resumo", slug, meta description, texto e perguntas frequentes (pares com adicionar e remover) e capa.
    - Texto: textarea com barra (`##`, negrito, lista, link, imagem) usando `wrapSelection`, mais a aba "Pré-visualizar" com `renderMarkdown`.
    - Imagem: upload com `upload()` de `@vercel/blob/client` para `/api/upload`; o botão de imagem insere `![](url)` no texto.
    - Rascunho: "Salvar rascunho" e "Publicar". Publicado: "Salvar e republicar", "Despublicar" e "Ver no blog". Os dois: "Excluir", com `confirm()`.
  - **`/api/upload`:** `handleUpload` com `onBeforeGenerateToken`, que lança erro se `!(await isAdmin())`. Aceita `image/jpeg`, `image/png` e `image/webp`, até 8 MB. Siga a doc da versão instalada do `@vercel/blob`.
  - **`/admin/sobre`:** textarea "Sobre o Lyrio" com Salvar, e a seção Glossário: seletor de idioma e textarea no formato `termo = tradução`, salvo com `saveGlossary`.
  - **Revalidação:** `publishPost`, `unpublishPost` e `deletePostAction` chamam `revalidatePath` para cada item de `pathsFor(await listVersionsOf(...))`. No `delete`, a lista é lida antes de apagar.
  - **`publishPost`:** valida, chama `updateSource` (ou `createPost` quando `id` é `null`) e depois `publish`, e devolve `{ id, missing: TARGET_LOCALES }`.
- [ ] **Step 5: Verificar à mão** (`npm run dev` com um banco de desenvolvimento na Neon):
  1. criar um artigo manual, salvar o rascunho e confirmar que aparece na lista como rascunho;
  2. gerar um com IA e ver o editor preenchido;
  3. subir uma imagem;
  4. excluir.
- [ ] **Step 6: Commit:** `feat: painel admin`

---

### Task 7: Tradução ao publicar

**Files:**
- Create: `lib/pool.ts`, `lib/translate-one.ts`, `app/api/translate/route.ts`
- Modify: `app/(admin)/admin/artigos/[id]/Editor.tsx` (painel de progresso)
- Test: `tests/pool.test.ts`, `tests/translate-one.test.ts`

**Interfaces:**
- Consumes: `getPostForEdit`, `saveTranslation`, `getGlossary`/`setGlossary`, `translateVersion`, `makeGlossary`, `pathsFor` e `isAdmin`.
- Produces:
  - `lib/pool.ts`: `runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>, onDone?: (item: T, error: unknown | null) => void): Promise<{ failed: T[] }>`.
  - `lib/translate-one.ts`:
    - `class TranslateError extends Error { status: 400 | 404 | 409 }`;
    - `translateOne(sql: Sql, postId: string, locale: Locale, model: string, deps: { translate: typeof translateVersion; makeGlossary: typeof makeGlossary }): Promise<{ slug: string; paths: string[] }>`.
  - `POST /api/translate`, com corpo `{ postId, locale, model }`; responde 400 se `!isModelId(model)`. Respostas: 200 `{ locale, slug }`, 401 sem login, 400, 404 ou 409 vindos de `TranslateError`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// pool: nunca mais que `limit` em paralelo; falhas não param o resto
let live = 0, peak = 0
const r = await runPool([1, 2, 3, 4, 5, 6], 2, async n => { live++; peak = Math.max(peak, live); await new Promise(r => setTimeout(r, 5)); live--; if (n === 3) throw new Error('x') })
expect(peak).toBe(2); expect(r).toEqual({ failed: [3] })
expect(await runPool([], 4, async () => {})).toEqual({ failed: [] })
```

```ts
// translate-one (pglite + fakes)
const deps = { translate: vi.fn(async (s, l) => ({ ...s, slug: `${l}-slug`, title: `${l} title` })), makeGlossary: vi.fn(async () => ({ Socorro: 'Hilfe' })) }
await expect(translateOne(sql, draftId, 'de', 'm/x', deps)).rejects.toMatchObject({ status: 409 })
await expect(translateOne(sql, pubId, 'pt-BR', 'm/x', deps)).rejects.toMatchObject({ status: 400 })
await expect(translateOne(sql, crypto.randomUUID(), 'de', 'm/x', deps)).rejects.toMatchObject({ status: 404 })
const out = await translateOne(sql, pubId, 'de', 'm/x', deps)
expect(out.slug).toBe('de-slug'); expect(out.paths).toContain('/de')
expect(await missingLocales(sql, pubId)).not.toContain('de')
expect(deps.makeGlossary).toHaveBeenCalledTimes(1); expect(await getGlossary(sql, 'de')).toEqual({ Socorro: 'Hilfe' })
await translateOne(sql, pubId, 'de', 'm/x', deps); expect(deps.makeGlossary).toHaveBeenCalledTimes(1)
expect(deps.translate).toHaveBeenLastCalledWith(expect.objectContaining({ title: expect.any(String) }), 'de', { Socorro: 'Hilfe' }, 'm/x')
expect(deps.makeGlossary).toHaveBeenCalledWith('de', 'm/x')
```

- [ ] **Step 2: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 3: Implementar**
  - **`translateOne`:**
    1. Lê o post e a origem com `getPostForEdit`.
    2. Valida e lança `TranslateError` se algo estiver errado.
    3. Busca o glossário. Se não houver, gera com `makeGlossary` e grava.
    4. Chama `translate` e grava com `saveTranslation(sql, id, locale, post.rev, fields)`.
    5. Devolve `pathsFor` da nova versão.
  - **Rota:**
    - `export const maxDuration = 300`;
    - checa `isAdmin()` e `isLocale`;
    - chama `translateOne(getSql(), postId, locale, model, { translate: translateVersion, makeGlossary })`;
    - faz `revalidatePath` de cada caminho e responde em JSON.
  - **Editor:** o painel de tradução tem um `ModelPicker` (`storageKey 'lyrio.translatorModel'`, padrão `DEFAULT_TRANSLATOR_MODEL`). Depois que `publishPost` devolve `missing`, chama `runPool(missing, 4, locale => fetch('/api/translate', { body: { postId, locale, model } }))`. Uma resposta que não seja ok conta como falha.
    - Mostra "Traduzindo 12/41" e, no fim, "Traduções: 41/41" ou a lista dos idiomas que falharam.
    - O botão "Traduzir faltantes" chama `getMissing(id)` e roda de novo.
    - Ao abrir o editor de um artigo publicado com faltantes, o painel mostra o número e o mesmo botão.
- [ ] **Step 4: Rodar `npm test`.** Esperado: PASS. À mão: publicar um artigo de teste e ver chegar a "41/41"; a lista do admin mostra `41/41`.
- [ ] **Step 5: Commit:** `feat: tradução ao publicar`

---

### Task 8: Blog público

**Files:**
- Create:
  - `lib/i18n/pt-BR.ts`, `lib/i18n/ui.json` (gerado), `lib/i18n/index.ts`, `scripts/translate-ui.ts`
  - `lib/fonts-map.ts`, `app/(blog)/fonts.ts`
  - `app/(blog)/[locale]/layout.tsx`, `app/(blog)/[locale]/page.tsx`, `app/(blog)/[locale]/[slug]/page.tsx`
  - `app/(blog)/blog.css`, `app/(blog)/components/{Header,Footer,StoreBand,LangSelect}.tsx`
  - `public/logo.webp`, `public/logo.png`, `app/icon.png`
- Test: `tests/i18n.test.ts`, `tests/fonts.test.ts`

**Interfaces:**
- Consumes: as Tasks 1, 2 e 4 (`renderMarkdown`, `readingMinutes`, `articleJsonLd`, `siteJsonLd`, `jsonLdString`).
- Produces:
  - `lib/i18n/index.ts`: `t(locale: Locale): UiStrings` (com pt-BR como fallback por chave) e `fmt(template: string, vars: Record<string, string | number>): string`.
  - `lib/fonts-map.ts`: `serifFamilyFor(locale: Locale): string`.
  - `app/(blog)/fonts.ts`: `fontClassFor(locale: Locale): string`.

- [ ] **Step 1: Escrever `lib/i18n/pt-BR.ts`** (copy fixada pelo mockup):

```ts
export const ptBR = {
  blog_name: 'Artigos', nav_artigo: 'Artigos', nav_tutorial: 'Guias', nav_faq: 'Perguntas',
  kicker_artigo: 'Artigo', kicker_tutorial: 'Guia prático', kicker_faq: 'Perguntas',
  reading: '{n} min de leitura', updated: 'Atualizado em {date}', team: 'Equipe Lyrio',
  in_short: 'Em resumo', faq_title: 'Perguntas frequentes', read_also: 'Leia também', get_app: 'Baixar o app',
  band_title: 'Você não está sozinho nessa luta.', band_text: 'Bloqueio de apps, comunidade e um botão de socorro para as piores horas.',
  appstore_small: 'Baixar na', play_small: 'Disponível no', language: 'Idioma',
  home_title: 'Artigos do Lyrio', home_description: 'Guias, perguntas e artigos para sair do vício em pornografia, com o apoio do Lyrio.',
  empty: 'Ainda não há artigos neste idioma.',
}
export type UiStrings = typeof ptBR
```

- [ ] **Step 2: Escrever os testes que falham**

```ts
// i18n
import ui from '@/lib/i18n/ui.json'
for (const l of TARGET_LOCALES) expect(Object.keys((ui as any)[l]).sort()).toEqual(Object.keys(ptBR).sort())
expect(fmt('{n} min de leitura', { n: 6 })).toBe('6 min de leitura')
// fonts
for (const l of LOCALES) expect(serifFamilyFor(l)).toBeTruthy()
expect(serifFamilyFor('pt-BR')).toBe('Newsreader'); expect(serifFamilyFor('ru')).toBe('Noto Serif')
expect(serifFamilyFor('ar')).toBe('Noto Naskh Arabic'); expect(serifFamilyFor('ur')).toBe('Noto Nastaliq Urdu')
expect(serifFamilyFor('ja')).toBe('Noto Serif JP'); expect(serifFamilyFor('hi')).toBe('Noto Serif Devanagari')
```

Mapa das fontes:
- `Noto Serif`: ru, uk, bg, sr, mk e el.
- Específicas: zh-Hans → `Noto Serif SC`; zh-Hant → `Noto Serif TC`; ja → `Noto Serif JP`; bn → `Noto Serif Bengali`; te → `Noto Serif Telugu`.
- Devanágari: hi e mr → `Noto Serif Devanagari`.
- Árabe: ar → `Noto Naskh Arabic`; ur → `Noto Nastaliq Urdu`.
- Os demais idiomas usam `Newsreader`.

- [ ] **Step 3: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 4: Gerar as traduções da interface e implementar os mapas.**
  - `scripts/translate-ui.ts` traduz `ptBR` para cada idioma de `TARGET_LOCALES` com `process.env.MODEL ?? DEFAULT_TRANSLATOR_MODEL` via `chatJson`, usando um schema zod com as mesmas chaves. Preserva `{n}` e `{date}`, e grava `lib/i18n/ui.json` como `{ [locale]: UiStrings }`.
  - Rode `npm run ui:translate` e implemente `index.ts` e `fonts-map.ts`. Rode `npm test` até PASS.
  - Faça commit do `ui.json`.
- [ ] **Step 5: Implementar as páginas.** O CSS vem de `artigo.html`, convertido para `blog.css`, trocando `left`/`right` por propriedades lógicas (`inset-inline-start`, `margin-inline`, `padding-inline`) para o RTL funcionar. Os numerais dos passos ficam em `ol li::before` do corpo renderizado.
  - **`[locale]/layout.tsx`:**
    - É o root layout: `notFound()` se `!isLocale`.
    - `<html lang={locale} dir={dirFor(locale)} className={fontClassFor(locale)}>`, com `generateStaticParams` sobre `LOCALES`.
    - Header: logo, "Lyrio" e `t.blog_name`; menu com âncoras `/${locale}#guias`, `#perguntas` e `#artigos`; `LangSelect`; e `t.get_app`, uma âncora para a faixa das lojas (`#app`).
    - Também: Footer e `<script type="application/ld+json">` com `jsonLdString(siteJsonLd())`.
  - **`[locale]/page.tsx`:** título `t.home_title` e três seções (`#guias` tutorial, `#perguntas` faq, `#artigos` artigo). Cada item segue o padrão "Leia também" do mockup (kicker, título em serifa e summary). Sem artigos, mostra `t.empty`. O `generateMetadata` devolve title, description e alternates de todos os idiomas (`x-default` vai para `/`).
  - **`[locale]/[slug]/page.tsx`:**
    - Busca com `normalizeSlugParam(slug)` e faz `notFound()` se não achar.
    - A ordem da página segue a spec, seção 6: kicker, h1, headline, byline com a data por `Intl.DateTimeFormat(locale, { dateStyle: 'long' })`, capa (se houver), lede "Em resumo", corpo, FAQ em `<details>` (o primeiro aberto), StoreBand (`id="app"`), "Leia também" (3 artigos mais recentes do mesmo idioma, menos este) e o JSON-LD do artigo.
    - O `generateMetadata` monta:
      - `title` e `description` (`metaDescription`);
      - `canonical`;
      - `languages` a partir de `alternates`, com `x-default` na versão pt-BR;
      - `openGraph` do tipo `article`.
    - Configure ISR sob demanda conforme a doc do Next 16.4: estático na primeira visita, invalidado por `revalidatePath`.
  - **`LangSelect`:** `<details>` com links por `NATIVE_NAME`. No artigo, só os idiomas que existem em `alternates`; na home, todos. Não usa JavaScript.
  - **Imagens:** capa e imagens do corpo vêm do domínio do Blob; configure `images.remotePatterns` para `*.public.blob.vercel-storage.com` se usar `next/image`.
  - **Logo:** copie `docs/superpowers/specs/2026-10-26-lyrio-blog-geo-mockup/logo.webp` para `public/` e gere `public/logo.png` e `app/icon.png` com `sharp`.
- [ ] **Step 6: Verificar o visual.**
  - `npm run build` passa.
  - Com um artigo de teste publicado e traduzido, gere screenshots em headless Chrome de `/pt-BR/<slug>` nas larguras 1440 e 390 e compare com `artigo.html`. Devem bater: hierarquia, serifa, dourado, linhas finas e o "Em resumo" como primeiro parágrafo.
  - Abra `/ar/<slug>` (espelhado, fonte árabe) e `/ja/<slug>` (fonte japonesa, URL com slug em japonês funcionando).
- [ ] **Step 7: Commit:** `feat: blog público`

---

### Task 9: Endpoints de GEO e redirecionamento da raiz

**Files:**
- Create: `app/route.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`, `app/(blog)/[locale]/[slug]/opengraph-image.tsx`, `lib/og-font.ts`

**Interfaces:**
- Consumes: `matchLocale`, `listAllPublishedVersions`, `getAbout`, `buildLlmsTxt`, `serifFamilyFor` e `getPublishedVersion`.
- Produces: `loadGoogleFont(family: string, text: string): Promise<ArrayBuffer>`.

- [ ] **Step 1: Implementar**
  - **`app/route.ts`:** `GET` com redirect 307 para `/${matchLocale(req.headers.get('accept-language'))}`. A lógica já está testada na Task 1.
  - **`sitemap.ts`:**
    - home de cada idioma, com `alternates.languages` de todos;
    - cada versão publicada, com `alternates.languages` das versões do mesmo post e `lastModified = updatedAt`.
  - **`robots.ts`:**
    - regra `*` com `allow: '/'` e `disallow: ['/admin', '/api']`;
    - regra explícita com a mesma permissão para `['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot']`. Confira os nomes atuais na documentação de cada empresa;
    - `sitemap: ${SITE_URL}/sitemap.xml`.
  - **`llms.txt/route.ts`:** `buildLlmsTxt(await getAbout(sql), [...])` com duas seções, "Artigos (Português)" (pt-BR) e "Articles (English)" (en). Responde com `content-type: text/plain; charset=utf-8`, e o arquivo é revalidado no publish (já está em `pathsFor`).
  - **`opengraph-image.tsx`:**
    - 1200×630, fundo `#1b2847`, logo dourado de `public/logo.png` no topo e título em serifa (`serifFamilyFor(locale)`);
    - rodapé "blog.lyrioapp.com" em `#b89346`;
    - `loadGoogleFont` busca `https://fonts.googleapis.com/css2?family=${family}:wght@500&text=${encodeURIComponent(text)}`, extrai a URL de `src: url(...)` e baixa o arquivo.
- [ ] **Step 2: Verificar** com `npm run build && npm start`:
  - `curl -sI localhost:3000/ -H 'Accept-Language: ja'` → 307 para `/ja`;
  - `curl -s localhost:3000/robots.txt` contém `GPTBot` e `Disallow: /admin`;
  - `curl -s localhost:3000/sitemap.xml` contém `hreflang="ja"`;
  - `curl -s localhost:3000/llms.txt` começa com `# Lyrio`;
  - abrir `/pt-BR/<slug>/opengraph-image` e `/ja/<slug>/opengraph-image`: o título aparece sem quadradinhos;
  - no HTML do artigo, o JSON-LD passa no validador `https://validator.schema.org`.
- [ ] **Step 3: Commit:** `feat: sitemap, robots, llms.txt, og e redirect`

---

### Task 10: "Sobre o Lyrio" e lote de lançamento

**Files:**
- Create: `content/sobre-o-lyrio.md`, `scripts/seed-about.ts`, `scripts/launch-topics.json`, `lib/launch.ts`, `scripts/generate-launch.ts`
- Test: `tests/launch.test.ts`

**Interfaces:**
- Consumes: `getAbout`/`setAbout`, `writeArticle` e `createPost`.
- Produces:
  - `lib/launch.ts`: `type LaunchTopic = { topic: string; type: PostType }` e `pendingTopics(sql: Sql, topics: LaunchTopic[]): Promise<LaunchTopic[]>` (remove os temas que já existem em `posts.topic`).
  - `npm run seed:about` grava o `.md` só se `getAbout` estiver vazio.
  - `npm run launch:generate`:
    - para se `getAbout` estiver vazio;
    - para cada tema pendente, em sequência: `writeArticle(…, process.env.MODEL ?? DEFAULT_WRITER_MODEL)` e depois `createPost` como rascunho, com `topic`;
    - registra no log quantos gerou, quantos pulou e quais falharam, e continua depois de cada falha.

- [ ] **Step 1: Escrever o teste que falha**

```ts
const topics: LaunchTopic[] = JSON.parse(readFileSync('scripts/launch-topics.json', 'utf8'))
expect(topics).toHaveLength(20)
expect(topics.filter(t => t.type === 'tutorial')).toHaveLength(10)
expect(topics.filter(t => t.type === 'faq')).toHaveLength(7)
expect(topics.filter(t => t.type === 'artigo')).toHaveLength(3)
await createPost(sql, { type: 'faq', topic: topics[10].topic, source: src() })
expect(await pendingTopics(sql, topics)).toHaveLength(19)
```

- [ ] **Step 2: Rodar `npm test` e confirmar que falha.**
- [ ] **Step 3: Escrever o conteúdo e implementar**
  - **`launch-topics.json`:** os 20 temas da spec (seção 10), **com o texto como está lá**:
    - 1 a 10 com `type: 'tutorial'`;
    - 11 a 17 com `type: 'faq'`, tirando o "★" e o "(artigo-pilar, que linka para os outros)" do texto do tema 11 e passando essa instrução como frase do próprio tema: "Como parar de ver pornografia? É o artigo principal do blog: cubra o tema de forma ampla.";
    - 18 a 20 com `type: 'artigo'`.
  - **`content/sobre-o-lyrio.md`:** escrito a partir da spec, seção 9, com estas seções: "O que é", "Para quem é", "Funções" (uma subseção por aba: Início, Apps, Emergência, Arsenal, Comunidade, Perfil), "O que o Lyrio não é" (não é tratamento médico e não substitui terapia ou acompanhamento profissional) e "Onde baixar" (as duas lojas).
    - Só afirme o que as telas mostram.
    - **Não** mencione "Usuário Desktop" nem detalhes de como o Socorro funciona por dentro além do que a tela mostra (frase de encorajamento, Dicas Rápidas, histórico).
- [ ] **Step 4: Rodar `npm test`.** Esperado: PASS.
- [ ] **Step 5: Commit:** `feat: sobre o Lyrio e lote de lançamento`

---

### Task 11: Deploy e lançamento (com o usuário: precisa das contas do Lyrio)

**Files:**
- Create: `docs/lancamento.md`

- [ ] **Step 1: Escrever `docs/lancamento.md`** com o checklist dos Steps 2 a 6, mais os itens fora do código listados na spec, seção 7.
- [ ] **Step 2: Contas.** Peça ao usuário, com tudo em contas do Lyrio:
  1. O repositório no GitHub; faça push.
  2. Importar o projeto na Vercel, no plano **Pro**.
  3. Adicionar a Neon pelo Marketplace, que gera o `DATABASE_URL`, e criar o Blob store, que gera o `BLOB_READ_WRITE_TOKEN`.
  4. Configurar as variáveis de ambiente:
     - `OPENROUTER_API_KEY` (conta do Lyrio no OpenRouter, com crédito);
     - `ADMIN_PASSWORD`, com 16 caracteres ou mais;
     - `SESSION_SECRET` (`openssl rand -hex 32`);
     - `SITE_URL=https://blog.lyrioapp.com`.
- [ ] **Step 3: Banco de produção.** `vercel env pull .env.local`, depois `npm run db:migrate` e `npm run seed:about`.
- [ ] **Step 4: Domínio.** Na Vercel, adicione `blog.lyrioapp.com`. No Cloudflare, crie um CNAME `blog` apontando para `cname.vercel-dns.com`, com o proxy **desligado** (nuvem cinza). Espere o HTTPS.
- [ ] **Step 5: Smoke em produção.**
  1. `/` redireciona.
  2. `/robots.txt`, `/sitemap.xml` e `/llms.txt` respondem.
  3. `/admin` pede login.
  4. Criar um artigo de teste à mão, publicar e chegar a 41/41.
  5. Abrir `/ar/…` e `/ja/…`.
  6. Passar o Rich Results Test do Google.
  7. Excluir o artigo de teste e confirmar 404.
- [ ] **Step 6: Lançamento.**
  1. O time revisa "Sobre o Lyrio" no admin.
  2. Rodar `npm run launch:generate` (20 rascunhos).
  3. O time revisa e publica.
  4. Em seguida, os itens fora do código:
     - Google Search Console: propriedade de domínio `lyrioapp.com` e envio do sitemap;
     - Bing Webmaster Tools: importar do GSC e enviar o sitemap;
     - link do site principal para o blog;
     - trocar o `author`/`creator` "Blessed Byte" por Lyrio no site principal.
- [ ] **Step 7: Commit:** `docs: checklist de lançamento`
