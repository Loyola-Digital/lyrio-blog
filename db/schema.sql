create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('artigo','faq','tutorial')),
  topic text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  rev int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists post_versions (
  post_id uuid not null references posts(id) on delete cascade,
  locale text not null,
  rev int not null default 0,
  slug text not null,
  title text not null,
  headline text not null default '',
  summary text not null default '',
  body_md text not null default '',
  faq jsonb not null default '[]',
  meta_description text not null default '',
  updated_at timestamptz not null default now(),
  primary key (post_id, locale),
  unique (locale, slug)
);

create table if not exists settings (key text primary key, value text not null);

create table if not exists glossary (locale text primary key, terms jsonb not null);
