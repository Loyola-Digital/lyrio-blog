# Blog do Lyrio para GEO — design

Data: 2026-10-26 · Status: aprovado pelo usuário em 2026-10-26, incluindo as decisões marcadas como "minhas"

## 1. Intenção (o porquê)

O Lyrio é um app (iOS e Android) para sair do vício em pornografia: bloqueio de apps, gamificação, comunidade e um botão de emergência. O site atual (lyrioapp.com) é uma landing de uma página, sem blog nem FAQ.

Numa consultoria de **GEO** (otimização para motores de IA: ChatGPT, Perplexity, Gemini, Claude, AI Overviews do Google), a recomendação foi ter **documentação escrita vasta, em estilo de blog, FAQ e tutorial**, explicando o que o app faz. Assim as IAs indexam o conteúdo e passam a **recomendar o Lyrio** quando alguém pergunta como largar a pornografia.

O que se pede é: um blog público otimizado para IAs, mais um **painel admin simples** onde o time do Lyrio publica artigos **à mão ou com IA**.

**Sucesso:**
- Alguém do time publica um artigo assistido por IA, revisado e traduzido para todos os idiomas, em poucos minutos e sem dev.
- Com o tempo, o Lyrio aparece citado nas respostas das IAs para as perguntas que os artigos cobrem.

## 2. Objetivos, não-objetivos e antiobjetivos

**Objetivos**
- Blog público em `blog.lyrioapp.com`, nos **mesmos 42 idiomas do site**, com o visual aprovado (seção 6).
- Painel admin para listar, criar (manual ou com IA), editar, publicar e despublicar artigos.
- IA que escreve conhecendo o Lyrio de verdade e na voz do Lyrio.
- Tradução automática por IA para os outros 41 idiomas ao publicar.
- **O lançamento já vem com um primeiro lote de artigos** (seção 10). O usuário confirmou.
- Toda a parte técnica de GEO (seção 7).

**Não-objetivos (v1)**
- Comentários, newsletter, contas individuais ou papéis de usuário.
- IA que publica sozinha, sugere pautas ou agenda posts.
- Imagens geradas por IA.
- Edição manual das traduções: elas são sempre regeneradas a partir do original.
- Painel de analytics.

**Antiobjetivos (falha mesmo que "funcione")**
- A IA inventa funções do app, promete cura ou dá conselho médico.
- O texto soa genérico, "cara de IA", ou o layout parece template. O usuário rejeitou explicitamente a primeira versão do layout por isso.
- O tom fica pregador ou afasta quem não é religioso.
- O original em pt-BR vai ao ar sem uma pessoa ter lido. As traduções vão ao ar automaticamente, como foi mostrado ao usuário: "a tradução acontece no clique de Publicar".

## 3. Restrições

- **Separado do site principal.** O time não tem acesso ao código do lyrioapp.com (Next.js no Firebase Hosting, atrás do Cloudflare). O blog é um projeto próprio.
- **Hospedagem na Vercel** (escolha do usuário). O subdomínio `blog.lyrioapp.com` é apontado por um CNAME no Cloudflare. Quem tem acesso ao Cloudflare faz isso.
- **Idiomas e prefixos de URL idênticos aos do site:**
  `pt-BR en es zh-Hans zh-Hant hi ar fr bn ru id ur de ja mr te bg hr cs da nl et fi el hu it lv lt pl ro sk sl sv pt-PT nb is uk sr mk sq tr ca`.
  `ar` e `ur` são RTL (`dir="rtl"`).
- **Idioma de origem: pt-BR.** Todo artigo é escrito em português e traduzido para os demais.
- O nome da empresa é **Lyrio**. O meta `author`/`creator` do site atual diz "Blessed Byte", o que está errado; no blog, autor e publisher são sempre "Lyrio" / "Equipe Lyrio".
- Links das lojas (tirados do site):
  - iOS `https://apps.apple.com/app/lyrio/id6760236148`
  - Android `https://play.google.com/store/apps/details?id=app.rork.lyrio` (o site usa `&referrer=utm_source%3Dwebsite`; no blog, usar `utm_source%3Dblog`).

## 4. Painel admin (decidido com o usuário)

Rascunho de referência: `2026-10-26-lyrio-blog-geo-mockup/admin-fluxo-fragmento.html`. Mostra a estrutura, não o visual.

1. **Lista de artigos:** título, tipo, status (rascunho / publicado) e progresso da tradução ("41/41 idiomas").
2. **Novo artigo → Manual ou Com IA.**
3. **Com IA:** a pessoa escreve só sobre o que quer falar (texto livre) e escolhe o tipo (**Artigo, FAQ ou Tutorial**). Clica em Gerar e a IA preenche o editor.
4. **Editor** (o mesmo para o manual e para o que a IA gerou): título, headline, "Em resumo", texto, perguntas frequentes (pares pergunta/resposta), tipo e imagem de capa opcional. Os campos "Em resumo" e perguntas frequentes são opcionais no manual. O botão **Salvar rascunho** salva sem publicar.
5. **Publicar:** só por clique humano. **A IA nunca publica sozinha** (decisão do usuário: opção A). Ao publicar, dispara a tradução para os 41 idiomas.
6. **Editar um artigo publicado** e republicar regera todas as traduções.
7. **Despublicar e excluir.**

Login: **uma senha única do time** (variável de ambiente) e cookie de sessão. Nada de cadastro. As rotas `/admin` ficam bloqueadas para quem não está logado e marcadas como `noindex`. *(Decisão minha; dá para trocar por contas individuais depois.)*

**"Sobre o Lyrio" (decisão minha):** uma página no admin com um campo de texto onde o time descreve o app (funções, para quem é, o que não faz). Esse texto alimenta a IA e o `/llms.txt`. Fica no banco e não no código, porque as funções do app mudam (o Modo Foco, por exemplo, está em BETA) e o time precisa conseguir atualizar sem dev. O conteúdo inicial é rascunhado pelo builder a partir das telas do app (seção 9) e **revisado pelo time antes do lançamento**.

## 5. Como a IA escreve e traduz

**Escrita.** A entrada é o tema em texto livre e o tipo. A saída é estruturada, preenchendo o editor: título, headline, "Em resumo" (2–3 frases que respondem a pergunta sozinhas), corpo em Markdown com subtítulos H2 em forma de pergunta, 3–6 perguntas frequentes, slug e meta description.

Regras do prompt:
- Usa o "Sobre o Lyrio" como única fonte sobre o app. Nunca cita função que não esteja lá.
- **Voz:** acolhedora, direta, em português do Brasil. A **base de fé aparece nos valores** (virtudes, propósito, recomeço, "você não está sozinho"), **sem pregação**. Versículo ou oração entram só quando o tema pedir. Quem chega sem ser religioso precisa se sentir bem-vindo. (Combinado com o usuário.)
- O vocabulário do app ("Arsenal", "batalha", "guerreiro") pode aparecer com moderação, sem caricatura.
- Sem promessa de cura, sem diagnóstico, sem números inventados.
- **Afirmações gerais** (sobre vício, cérebro, sono) só se forem amplamente aceitas e ditas sem estatística nem estudo específico. A v1 não tem busca na web nem campo de fontes; se alguém quiser citar uma fonte, coloca o link à mão no editor. *(Decisão minha.)*
- **Escrita para GEO:** resposta primeiro, passos concretos e o Lyrio mencionado onde ele de fato resolve o problema, nunca enfiado à força.
- Para cada tipo:
  - **Tutorial:** passo a passo numerado.
  - **FAQ:** pergunta central respondida logo de cara, seguida das relacionadas.
  - **Artigo:** explicação com subtítulos em pergunta.

**Tradução.** Cada um dos 41 idiomas é traduzido a partir do pt-BR, incluindo título, slug localizado e meta description. A tradução é adaptada, não literal, e mantém a voz e os nomes das funções conforme aparecem no app. Cada idioma vai ao ar assim que fica pronto, sem revisão humana. A v1 não tem checagem automática por um segundo modelo, porque traduzir um texto já revisado raramente introduz afirmações novas *(decisão minha)*. Um idioma sem tradução não aparece nas listagens nem no hreflang. O admin mostra o progresso e tem um botão **"Traduzir faltantes"** para tentar de novo os idiomas que falharam.

**Nomes das funções nas traduções (decisão do usuário, 26/10):** tradução direta, sem glossário. "Opção Nuclear" vira "Nuclear Option" em inglês, e assim por diante; o prompt pede para traduzir sempre do mesmo jeito.

**Modelos (decisão do usuário, 26/10):** a IA roda pelo **OpenRouter**, e a pessoa **escolhe o modelo na hora**:
- no formulário "Com IA", o padrão é `anthropic/claude-opus-5.5`;
- no painel de tradução do editor, o padrão é `anthropic/claude-sonnet-5.5`.

A lista vem da API de modelos do OpenRouter, filtrada para os que suportam saída estruturada. O painel lembra a última escolha. O time do Lyrio fornece a chave do OpenRouter.

## 6. Blog público (visual aprovado)

Referência aprovada pelo usuário ("boa, segue"): `2026-10-26-lyrio-blog-geo-mockup/artigo.html`. O texto ali é enchimento e não deve ser usado como fato sobre o app.

- **Visual de revista, não de template.**
  - Serifa editorial nos títulos e no texto (Newsreader); Montserrat, a fonte do site, em rótulos, menus e subtítulos.
  - Fundo off-white `#f4f2eb`, azul-marinho `#1b2847` e o dourado do logo `#b89346`.
  - Linhas finas no lugar de cards e caixas. Sem emoji e sem gradiente decorativo.
- **Ordem do artigo:**
  1. Kicker (tipo e tempo de leitura), título, headline em itálico, byline "Equipe Lyrio" com a data de atualização.
  2. Capa: se houver imagem, aparece ao lado, como no mockup com a tela do app; sem imagem, o topo fica só com o texto.
  3. **"Em resumo" como primeiro parágrafo**, sem caixa. É o trecho que as IAs costumam citar.
  4. Corpo com H2 em pergunta e passos com numerais dourados.
  5. Perguntas frequentes em acordeão.
  6. Faixa azul-marinho com "Você não está sozinho nessa luta." e os botões das lojas.
  7. "Leia também" com 3 artigos.
- **Telas reais do app dentro do texto** são bem-vindas. O editor permite subir imagens no corpo.
- **Fontes por escrita:** a Newsreader só cobre o alfabeto latino. Cirílico, grego, CJK, devanágari, bengali, telugu e árabe/urdu precisam de fontes equivalentes (por exemplo, a família Noto). Fica a cargo do builder.
- **Página inicial por idioma:** lista de artigos com filtro por tipo. O menu fica em Artigos · Guias (tutoriais) · Perguntas (FAQ). *(Decisão minha: o mockup tinha "Recaída" e "Fé e propósito", que eram chute; categorias temáticas ficam para quando houver volume.)*
- Seletor de idioma no topo. Na raiz `/`, redireciona pelo idioma do navegador, e o padrão é pt-BR.
- Responsivo: no celular vira uma coluna, como no mockup.

## 7. GEO técnico

- HTML renderizado no servidor e estático por artigo, regenerado ao publicar. As IAs leem o HTML e não executam JavaScript.
- URL: `blog.lyrioapp.com/{idioma}/{slug-localizado}`, com canonical próprio.
- `hreflang` entre todas as versões existentes, mais `x-default`.
- **JSON-LD:**
  - `BlogPosting` com autor e publisher Organization "Lyrio", logo, `datePublished` e `dateModified`.
  - `FAQPage` quando houver perguntas frequentes.
  - `HowTo` nos tutoriais.
  - `BreadcrumbList`.
  - `Organization` e `MobileApplication` com os links das lojas e o site como `sameAs`.
- `sitemap.xml` com as alternates de idioma.
- `robots.txt` liberando explicitamente os robôs das IAs (os do ChatGPT, Claude, Perplexity, Google e Apple; o builder confere a lista atual).
- `/llms.txt` com o resumo do Lyrio (do "Sobre o Lyrio") e os links dos artigos.
- Imagem de compartilhamento gerada automaticamente com o título, no visual da marca, quando não houver capa.
- Data de atualização visível na página e no schema.

**Fora do código, mas necessário (listar no lançamento):**
- O site principal deve linkar para o blog.
- Trocar o author "Blessed Byte" do site para Lyrio.
- Cadastrar o blog no Google Search Console e no Bing Webmaster Tools. A busca do ChatGPT usa o Bing.

## 8. Decisões técnicas (minhas, o usuário delegou)

- **Next.js** (mesma tecnologia do site) na **Vercel**, num único projeto para o blog e o admin.
- **Postgres da Neon**, instalado pela própria Vercel, guarda artigos, traduções e o "Sobre o Lyrio".
- **Vercel Blob** guarda as imagens (capa e imagens do corpo).
- O corpo é guardado em **Markdown**, que é o formato natural para a IA gerar e traduzir. O editor é uma área de texto com barra simples (subtítulo, negrito, lista, link, imagem) e aba de pré-visualização.
- O modelo de dados é responsabilidade do builder. A ideia é ter um artigo com N versões de idioma, cada uma com seu status de tradução.

**Pré-requisitos de contas (não mudam o que se constrói, mas precisam existir):**
- Vercel, Neon, Blob, repositório e chave do OpenRouter ficam **em contas do Lyrio**, para não ter migração depois.
- Vercel no **plano gratuito (Hobby)**, por decisão do usuário em 26/10, ciente de que os termos da Vercel reservam o Hobby para uso não comercial. Se a Vercel pausar o projeto, a saída é migrar para um time Pro.
- Os limites de uso do OpenRouter e do modelo escolhido limitam a velocidade das 41 traduções. O builder controla a concorrência e as novas tentativas.

## 9. Material de partida para o "Sobre o Lyrio"

Do que se vê nas telas do app (12 capturas enviadas pelo usuário), a ser **confirmado pelo time**:

- **Início:**
  - Níveis por pontos (Escudeiro, Patrulheiro, Veterano, Cavaleiro…).
  - Sequência de dias limpos com calendário e melhor sequência.
  - Fase de recuperação (por exemplo, "Persistência").
- **Apps (Controle de Apps):**
  - Regras de bloqueio personalizadas por apps e sites (intervalo de uso liberado e depois bloqueio).
  - Estatísticas de uso.
  - Modo Foco em BETA: "bloqueie tudo, menos o essencial".
  - Recomendação do modo pomodoro.
- **Emergência:**
  - Botão **Socorro** para quem está sob forte tentação, com frase de encorajamento, "Dicas Rápidas" e histórico.
  - **Opção Nuclear**: bloqueia todos os apps e deixa o celular inutilizável por 1, 2, 3, 4 ou 8 horas, sem volta.
- **Arsenal:**
  - **Hábitos:** hábitos diários com lembrete.
  - **Jornada:** etapas com desafios, como "Etapa 1 — Primeiros Passos" e "Dia perfeito".
  - **Jogos:** PornEscape, Snake Streak, Combine Virtudes, Bubble Streak, Memória dos Hábitos e Paciência, com favoritos.
  - **Diário:** humor e texto, privado.
- **Comunidade:**
  - Feed com posts oficiais do Lyrio (por exemplo, o desafio No Fap September), curtidas e comentários.
  - Selos de participação, como "Elite da Comunidade".
- **Perfil:** conquistas (28 na captura), rank e "Contribuições Especiais ao Lyrio".
- Existe uma conquista "Usuário Desktop", então há algum uso no computador. **Confirmar o que é.**

As capturas estão em `C:\Users\Lucas\Downloads\` (arquivos `.jpg` com nome UUID, de 26/10).

## 10. Primeiro lote de artigos (lançamento)

O usuário confirmou que o blog **não sai vazio**. O lote é gerado pelo mesmo fluxo de IA do admin, rodado em sequência a partir da lista abaixo. Os artigos entram como **rascunhos em pt-BR**. O time do Lyrio revisa e publica cada um, e só aí as traduções saem, seguindo a regra de que o original nunca vai ao ar sem leitura humana.

A lista inicial é decisão minha; o time pode cortar ou trocar temas antes de gerar. Os temas citados pelo usuário estão marcados com ★.

**Funções do app (Tutorial)**
1. Como usar o botão Socorro numa crise
2. O que é a Opção Nuclear e quando usar
3. Como configurar o Controle de Apps: regras de bloqueio por app e site
4. Modo Foco: bloquear tudo, menos o essencial
5. Como funcionam a Sequência e os Níveis do Lyrio
6. Hábitos: como criar hábitos que ocupam o lugar do vício
7. A Jornada do Lyrio: etapas e desafios
8. Os jogos do Arsenal: por que jogar ajuda a atravessar a vontade
9. Diário: escrever para tirar o impulso do piloto automático
10. Comunidade do Lyrio: como funciona e o que é privado

**Perguntas (FAQ)**

11. ★ Como parar de ver pornografia? (artigo-pilar, que linka para os outros)
12. ★ O Lyrio é anônimo? Quem vê o que eu escrevo
13. O Lyrio funciona no iPhone e no Android?
14. Como bloquear sites pornográficos no celular
15. Pornografia é vício? Como saber se eu tenho um problema
16. Recaí. E agora?
17. O que é o desafio No Fap September?

**Artigos**

18. Por que a madrugada é o momento mais difícil, e o que fazer
19. Gatilhos: os momentos que mais levam à recaída e como se preparar
20. Fé e recomeço: como a fé ajuda a vencer o vício

## 11. Fica a cargo do builder

- Bibliotecas: editor, Markdown, autenticação e acesso ao banco.
- Como rodar as 41 traduções sem estourar o tempo das funções da Vercel. Por exemplo, o próprio admin dispara uma chamada por idioma e mostra o progresso, ou uma fila.
- Ids exatos dos modelos e prompts finais.
- Layout da página inicial do blog e da listagem por tipo.
- O visual do admin: simples, com a cara da marca e sem "cara de IA".
- Fontes por sistema de escrita e ajustes de RTL.
