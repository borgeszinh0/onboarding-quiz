# Planner — Inbox, 1-3-5, Foco

Planejador diário local-first. Regra **1 tarefa grande, 3 médias, 5 pequenas** por dia, captura em Inbox, blocos de tempo agendáveis, Modo Foco em tela cheia, hábitos diários e **modo do dia** para adaptar recomendações de planejamento. Sem projetos, sem pastas, sem sincronização com calendário externo.

> Este app **substituiu por completo** um projeto anterior chamado "Valores" (quiz de valores ACT + 12 Week Year). Nada daquele fluxo existe mais no código — ver [Histórico e migração](#histórico-e-migração) antes de mexer em dados de usuários antigos.

---

## O que o app faz

| Módulo | Rota | O que é |
|---|---|---|
| **Hoje** | `/` | Funil 1-3-5 (Grande/Média/Pequena), cronograma do dia, barra de hábitos, ponto de entrada do Modo Foco |
| **Inbox** | `/inbox` | Captura rápida de ideias/tarefas sem categoria nem data |
| **Semana** | `/semana` | Ocupação de horário por dia da semana + conclusão do funil |
| **Mês** | `/mes` | Grade mensal com destaque de dias "perfeitos" (todos os hábitos cumpridos) |
| **Ano / Calendário** | `/ano` | Visão anual em formato de calendário de pontos |
| **Objetivos** | `/objetivos` | Mural de foco trimestral (Q1–Q4), texto livre para o "Norte" |
| **Perfil** | `/perfil` | Métricas vitalícias (foco, tarefas e hábitos concluídos) e conta |
| **Dados** | `/dados` | Export/import de backup JSON, status de sync com Supabase, backups automáticos locais |

### Regras de negócio centrais

- **Funil 1-3-5**: cada dia tem exatamente 1 vaga "grande", 3 "médias", 5 "pequenas". Vaga cheia esconde o botão de planejar — o excedente fica no Inbox até haver espaço.
- **Modo do dia**: a escolha `Baixa / Média / Alta` agora representa estratégia de planejamento, não decoração visual. O app traduz isso em `Manutenção / Execução / Criação` e usa o modo para ordenar sugestões, explicar consequências, ajustar durações padrão e avaliar o fechamento do dia. O modo **não altera os limites absolutos** do 1-3-5; ele orienta o que deve ser favorecido dentro desses limites.
- **Virada de dia automática**: ao abrir o app, qualquer tarefa de categoria não-inbox com data passada e ainda pendente volta pro Inbox e perde o bloco de tempo agendado. Roda uma vez por dia (`lastRolloverDate` no estado evita repetir).
- **TimeBlock**: uma tarefa tem no máximo um bloco de horário ativo. Agendar de novo substitui o anterior.
- **Modo Foco**: cronômetro regressivo baseado na duração do bloco (ou 25min padrão se a tarefa não tem bloco). Pausa de verdade — acumula tempo decorrido em vez de reiniciar. Ao bater o alvo, passa a contar tempo extra em vez de zerar.
- **Hábitos**: lista simples com toggle diário. "Dia perfeito" = todos os hábitos ativos marcados naquela data — é o que acende o destaque verde no Mês.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **React Context + useReducer** — todo o estado do app é um único reducer (`PlannerState`), sem lib externa de state management
- **Supabase** — auth + sync em nuvem (opcional, ver abaixo)
- **localStorage** — funciona 100% offline sem Supabase configurado
- **PWA** — instalável, notificações de lembrete para blocos agendados

---

## Arquitetura

Estado único (`PlannerState`) num reducer, sem backend obrigatório — tudo funciona 100% em `localStorage`, com sync opcional pro Supabase quando o usuário está autenticado.

```
lib/planner-types.ts    Tipos: Task, TimeBlock, Habit, HabitLog, DayMode, PlannerState
lib/planner-data.ts     Constantes: limites de vaga (1/3/5), horário da régua, trimestres
lib/day-mode.ts         Motor de estratégia do dia: regras, scoring, microcopy e sugestões
lib/planner-store.tsx   Reducer + Context + todos os seletores (getInboxTasks, dayCompletion, ...)

components/planner/
  DailyPlanning.tsx       Cards de modo do dia + botão de início/edição do dia
  DailyFunnel.tsx         Funil 1-3-5 com recomendações por modo
  InboxCapture.tsx        Captura + Inbox agrupado por aderência ao modo do dia
  ScheduleTaskControl.tsx Chip de agendamento + duração sugerida por modo/categoria
  ScheduleRuler.tsx       Régua de horário do dia com blocos posicionados e foco protegido
  DailyShutdown.tsx       Fechamento do dia com leitura de aderência ao modo escolhido
  FocusMode.tsx           Overlay de tela cheia do cronômetro
  HabitBar.tsx            Barra fixa de hábitos no rodapé

components/apple/ui.tsx  Primitivas de UI legadas no nome, agora renderizadas pelo tema Raycast-like — Card, Button, PageTitle, SectionLabel
```

### Padrão de hidratação (importante)

`PlannerProvider` e o resto dos providers **começam vazios nos dois lados** (servidor e cliente) e só carregam o `localStorage` depois de montar, expondo um flag `hydrated`. Isso existe porque ler `localStorage` direto no inicializador do `useReducer` quebra a hidratação do Next (o HTML do servidor nunca bate com o primeiro render do cliente — React descarta a árvore inteira). Toda página nova **deve** checar `hydrated` antes de renderizar conteúdo dependente de estado:

```tsx
const { hydrated } = usePlanner();
if (!hydrated) return <main aria-busy="true" />;
```

O mesmo vale pra qualquer relógio de parede (timers): nunca ler `Date.now()` durante o render. Ver `useWallClock` em `FocusMode.tsx` — usa `useSyncExternalStore` com o valor lido só dentro do `subscribe` (que roda depois do commit).

### Motor de modo do dia

O arquivo [`lib/day-mode.ts`](lib/day-mode.ts) centraliza as regras do modo do dia. Ele existe para evitar que cada tela invente uma interpretação diferente de `Baixa / Média / Alta`.

| Modo | Nome de produto | Estratégia |
|---|---|---|
| `low` | Manutenção | Favorece tarefas pequenas, revisão, pendências leves e blocos curtos. |
| `medium` | Execução | Favorece médias importantes e rotina protegida; é o fallback quando o usuário ainda não escolheu modo. |
| `high` | Criação | Favorece uma tarefa grande, foco protegido, trabalho profundo e decisões difíceis. |

Onde isso aparece hoje:

- `DailyPlanning.tsx`: substituiu chips simples por três cards compactos de "modo do dia", cada um com consequência explícita.
- `DailyFunnel.tsx`: mostra orçamento recomendado por categoria, ordena sugestões do Inbox por aderência e pede confirmação quando o usuário tenta planejar algo que foge do modo.
- `InboxCapture.tsx`: agrupa o Inbox em "Recomendadas para hoje", "Também cabem" e "Melhor guardar".
- `ScheduleTaskControl.tsx`: ajusta duração inicial do bloco conforme modo + categoria. Em `high` + tarefa grande, o bloco entra como `protected`.
- `ScheduleRuler.tsx`: exibe "Foco protegido" nos blocos protegidos.
- `DailyShutdown.tsx`: calcula uma leitura de aderência do dia (`matched`, `tooHeavy`, `tooLight`) com base em categoria concluída, foco planejado e foco realizado.

Compatibilidade de dados: `DayLog` agora usa `mode`, mas ainda aceita o campo legado `energy` para não quebrar dados já salvos no `localStorage` ou em backup. Sempre que escrever dia novo, grave `mode` e mantenha `energy` apenas como compatibilidade enquanto existirem usuários com estado antigo.

O que **ainda não existe**: aprendizado histórico real, replanejamento automático, divisão automática de tarefas grandes, integração com calendário externo, perguntas de reflexão no fechamento ("sim / mais ou menos / não") e ações explícitas para pendências ("Enviar ao Inbox / Mover para amanhã / Manter planejado"). Esses pontos dependem de especificação de UX/produto antes de virar código.

### Sync e backup

- `lib/cloud-sync.tsx`: pull no login (remoto vence se tiver dado), push debounced (1.5s) a cada mudança. Sem Supabase configurado, funciona só localStorage.
- `lib/backup.ts`: export/import JSON versionado. **v1–v3 são de versões anteriores do app** (quiz de valores, 12WY, TEA) e continuam sendo aceitos na importação só pra não quebrar quem tem backup antigo — os campos são ignorados. v4 é o formato atual (`{ planner: PlannerState }`).
- `supabase/schema.sql`: a tabela `app_state` tem colunas legadas (`quiz`, `plan`, `daily`, `tea`) que o app **não lê nem escreve mais**. Ficaram de propósito pra não apagar dado de usuário de versões antigas. A coluna ativa é `planner` (jsonb).

### Configurar Supabase (opcional — sem isso roda 100% offline)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. SQL Editor → cole e rode [`supabase/schema.sql`](supabase/schema.sql).
3. Authentication → Providers → habilite **Email** (magic link).
4. Authentication → URL Configuration → adicione a URL do site + `…/auth/callback` em Redirect URLs.
5. Crie `.env.local` na raiz com:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
6. Na Vercel, adicione as mesmas duas env vars no projeto.

Sem as env vars, o botão de login some e o app usa só localStorage.

---

## Design system

A direção visual atual abandona o padrão Apple-like anterior e assume uma estética **Raycast-inspired dark liquid glass tech**. A referência principal é [Raycast](https://www.raycast.com/): fundo preto, superfícies translúcidas compactas, bordas hairline, blur controlado, acentos frios e pouca cor.

### Tokens Raycast-like (`app/globals.css`)

- **Base preta:** `--bg: #050507`, com brilho radial sutil em `--bg-radial`. Não usar orbs grandes, bokeh, textura barulhenta ou gradientes multicoloridos decorativos.
- **Vidro estrutural:** `--glass-1`, `--glass-2`, `--glass-3`, `--glass-border`, `--glass-border-strong`, `--glass-highlight` e `--glass-shadow` definem a hierarquia. Não criar efeitos diferentes por componente.
- **Superfícies:** usar `.surface-base` para cards normais, `.surface-raised` para métricas/destaques e `.surface-floating` para dock, command bar, sheets e modais.
- **Cards:** raio padrão de `20px`, padding `16px` ou `20px`, `background: var(--glass-1)`, `border: 1px solid var(--glass-border)`, `backdrop-filter: blur(18px) saturate(140%)`. Cards importantes usam `--glass-2`, borda forte e sombra curta.
- **Dock:** pílula escura de `72px`, `inset-x: 18px`, `bottom: calc(18px + env(safe-area-inset-bottom))`, `background: rgba(12, 12, 16, 0.66)`, borda `rgba(255,255,255,.14)` e blur `26px`.
- **Gráficos:** trilha `rgba(255,255,255,.10)`, ativo `--accent-2` ou token da métrica, glow somente no traço/ponto ativo do gráfico, nunca no card inteiro.
- **Tipografia:** Geist/Inter/system, com escala `32/38 600`, `20/26 600`, `15/22 400`, `12/16 500`, números em `tabular-nums`.
- **Tema:** o app está visualmente dark-first. `:root.light` também recebe os tokens escuros por enquanto para evitar drift visual enquanto não existir um spec de tema claro Raycast-like.
- Espaçamento (`--space-*`) e `--ease-standard` ficam **fora do bloco `@theme`** de propósito — `--spacing-*` é namespace reservado do Tailwind 4 e colidir com ele quebra todas as utilities de padding/margem.
- `color-scheme` permanece configurado no `:root` para manter controles nativos (`<input type="time">`, `<select>`) legíveis no tema escuro.

Regra de aprovação visual: a tela precisa parecer uma ferramenta premium de comando e foco. Se parecer uma demo de glassmorphism, reduzir blur, glow, saturação, radius e cor.

### Tailwind 4 e CSS variables

Depois de limpar `.next`, o build expôs um problema importante: algumas classes arbitrárias do Tailwind com `var()` ou `env()` geravam CSS quebrado no pipeline atual. Por isso, não adicionar novas classes como:

```tsx
className="text-[color:var(--label-secondary)] bottom-[calc(env(safe-area-inset-bottom)+24px)]"
```

Use utilities nomeadas em `app/globals.css` (`text-label`, `text-label-secondary`, `text-accent`, `bg-fill-subtle`, `border-separator`, `pb-main-safe`, `bottom-dock-safe`, etc.) ou crie uma utility nova lá. Essa decisão é técnica, não estética: mantém o build de produção estável.

### Componentes (`components/apple/ui.tsx`)

`Card`, `Button` (variantes primary/secondary/plain), `PageTitle`, `SectionLabel`. O nome da pasta é legado, mas o visual vem dos tokens Raycast-like. Todo alvo de toque ≥44px. Cards usam blur + borda 1px + sombra rasa quando elevados; evitar sombra difusa forte junto com borda branca grossa.

### O que foi revisado e corrigido no polish pass

1. Ghost-card (borda + sombra difusa ≥16px blur no mesmo elemento) — trocado por sombra rasa.
2. Contraste de texto accent em telas escuras (4.4:1 → 7.9:1, token `--accent-text`).
3. `<input type="time">` / `<select>` sem estilo, chrome do navegador destoando do resto — `color-scheme` + seta customizada.
4. Formulário de agendamento sobrepondo o título da tarefa quando o título era longo — reestruturado pra abrir como bloco abaixo da linha, não inline.
5. Nav com itens fora da tela sem indicação (`overflow-x-auto` sem sinal visual) — fade de borda via `mask-image`.
6. Nav sem estado de hover nos itens inativos.
7. Token CSS morto (`--color-tempo`, sobra de uma versão anterior) removido.

---

## Histórico e migração

Este repositório passou por **duas reescritas completas** na mesma sessão:

1. **"Valores"** (quiz ACT + 12 Week Year) → **"TEA"** (Tempo/Energia/Atenção, framework de gestão de tempo) → **Planner atual** (Inbox + 1-3-5 + TimeBlocks + Foco + Hábitos).
2. Nenhuma dessas reescritas foi um refactor incremental — cada uma removeu o código da anterior por completo (`git rm -f` nos arquivos, sem deprecar gradualmente). O motivo: eram produtos conceitualmente diferentes, não iterações do mesmo produto.

**Dados de usuário de versões antigas não foram apagados do banco** — só o código que os lia/escrevia. Ver seção "Sync e backup" acima.

---

## Estado atual para o próximo dev

Última frente concluída: transformar energia em **modo do dia** com efeito prático na experiência. A UI agora explica a consequência do modo, recomenda tarefas conforme a estratégia escolhida, sugere durações de blocos, marca foco protegido e avalia o fechamento do dia.

Verificações feitas nesta entrega:

- `npm run build` passou em produção.
- ESLint passou nos arquivos tocados do motor de modo do dia e componentes do planner.
- Validação visual/funcional via navegador no dev server: cards de modo aparecem, funil mostra orçamento recomendado, Inbox agrupa por aderência, agendamento sugere duração correta e fechamento exibe insight do modo.

Pendências de produto/UX antes de implementar mais lógica:

- Definir se o app pode sugerir rebaixar/promover tarefas entre Grande/Média/Pequena ou se só recomenda sem alterar categoria.
- Definir como o usuário encerra o dia: reflexão simples, motivo de desalinhamento, ações sobre pendências e se isso alimenta histórico.
- Definir se `overrideCount` deve virar métrica visível, regra de aprendizado ou só telemetria local.
- Definir algoritmo de seleção para dias futuros: manter 1-3-5 rígido, adaptar por modo ou criar exceções explícitas.
- Definir se duração estimada por tarefa entra no modelo (`estimatedMinutes`) ou continua derivada de categoria + modo.

---

## Rodar localmente

```bash
git clone https://github.com/borgeszinh0/onboarding-quiz.git
cd onboarding-quiz
npm install
npm run dev
```

Abre em `http://localhost:3000` (ou a próxima porta livre — o Next avisa no terminal se 3000 estiver ocupada).

### Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # build de produção
npm run lint     # ESLint
```

---

## Deploy

Configurado pra Vercel, deploy automático a cada push em `main`.

```bash
vercel --prod
```

> Não verificado nesta sessão se o projeto Vercel já linkado reflete este código — a reescrita foi grande, confirme o build lá antes de assumir que está no ar.

---

## Skills e processo usados nesta sessão

Documentando porque quem pegar o projeto depois vai encontrar padrões que só fazem sentido conhecendo a origem.

- **`apple-ui-design`** — base do design system (tokens, componentes, tipografia, motion).
- **`impeccable`** (comando `polish`, register `product`) — pass de revisão sistemática: descoberta do design system existente antes de mexer, checklist de contraste/estados de interação/espaçamento, lista de padrões banidos (ghost-card, gradiente em texto, glassmorphism decorativo, grade de cards idêntica, etc.).
- **`web-design-guidelines`** (Vercel, instalada via `npx skills add vercel-labs/agent-skills@web-design-guidelines`) — segunda referência de UI guidelines, usada em conjunto com a impeccable.
- **Verificação real, não suposição**: todo bug de UI relatado nesta doc foi confirmado no navegador (screenshot, leitura de DOM, ou cálculo de contraste via canvas/luminância), não deduzido só lendo o CSS.
- **Build em fases**: o Planner atual foi construído em 7 fases (schema/store → Inbox/funil → hábitos → TimeBlocks/Foco → Semana/Mês → Ano → integração final), cada uma com `tsc --noEmit` + `eslint` + `npm run build` limpos e verificação manual no navegador antes de seguir pra próxima.

---

## Metodologias de referência (produto)

- **Regra 1-3-5** — framework de priorização diária (1 tarefa grande, 3 médias, 5 pequenas).
- **Inbox / captura única** — GTD (David Allen), sem a complexidade de contextos/projetos.
- **Timeboxing** — blocos de tempo protegidos por tarefa.

---

## Licença

Projeto pessoal. Uso privado.
