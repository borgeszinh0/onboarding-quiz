# Planner — Inbox, 1-3-5, Foco

Planejador diário local-first. Regra **1 tarefa grande, 3 médias, 5 pequenas** por dia, captura em Inbox, blocos de tempo agendáveis, Modo Foco em tela cheia e hábitos diários. Sem projetos, sem pastas, sem sincronização com calendário externo.

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
lib/planner-types.ts    Tipos: Task, TimeBlock, Habit, HabitLog, PlannerState
lib/planner-data.ts     Constantes: limites de vaga (1/3/5), horário da régua, trimestres
lib/planner-store.tsx   Reducer + Context + todos os seletores (getInboxTasks, dayCompletion, ...)

components/planner/
  DailyFunnel.tsx         Funil 1-3-5 (Hoje)
  ScheduleTaskControl.tsx Chip de agendamento (trigger) + formulário de horário
  ScheduleRuler.tsx       Régua de horário do dia com os blocos posicionados
  FocusMode.tsx           Overlay de tela cheia do cronômetro
  HabitBar.tsx            Barra fixa de hábitos no rodapé
  InboxCapture.tsx        Captura + lista do Inbox

components/apple/ui.tsx  Design system (ver abaixo) — Card, Button, PageTitle, SectionLabel
```

### Padrão de hidratação (importante)

`PlannerProvider` e o resto dos providers **começam vazios nos dois lados** (servidor e cliente) e só carregam o `localStorage` depois de montar, expondo um flag `hydrated`. Isso existe porque ler `localStorage` direto no inicializador do `useReducer` quebra a hidratação do Next (o HTML do servidor nunca bate com o primeiro render do cliente — React descarta a árvore inteira). Toda página nova **deve** checar `hydrated` antes de renderizar conteúdo dependente de estado:

```tsx
const { hydrated } = usePlanner();
if (!hydrated) return <main aria-busy="true" />;
```

O mesmo vale pra qualquer relógio de parede (timers): nunca ler `Date.now()` durante o render. Ver `useWallClock` em `FocusMode.tsx` — usa `useSyncExternalStore` com o valor lido só dentro do `subscribe` (que roda depois do commit).

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

Construído do zero nesta sessão em cima da **skill `apple-ui-design`** (design Apple-like: clareza, deferência, profundidade) e depois revisado com a **skill `impeccable`** (comando `polish`, register "product") e a **skill `web-design-guidelines`** (Vercel).

### Tokens e Estética Gemini (`app/globals.css`)

- **Bubbly & Minimalista:** O aplicativo adotou uma identidade visual focada em contrastes extremos (fundo preto absoluto ou branco puro, sem cinzas chapados) e curvaturas acentuadas (`rounded-3xl` e border-radius de `32px` em cartões).
- **Dock Flutuante Imersiva:** A barra de navegação inferior foi convertida em uma pílula flutuante (estilo Instagram Reels / Gemini App) com blur super pesado e alta translucidez, e sem rótulos de texto nos ícones.
- **Gemini Spark:** A cor de destaque primária para eventos de conclusão (como bater um hábito ou fechar uma tarefa) agora usa o gradiente `--gemini-grad` inspirado nos tons da IA do Google (azul, roxo, rosa).
- Cor: `--bg`, `--label`, `--label-secondary`, `--separator`, `--fill-subtle`, `--card-bg/border/shadow`, todos com variante escura via `@media (prefers-color-scheme: dark)` — **não existe toggle manual de tema**, segue o SO.
- Espaçamento (`--space-*`) e `--ease-standard` (curva de easing) ficam **fora do bloco `@theme`** de propósito — `--spacing-*` é namespace reservado do Tailwind 4 e colidir com ele quebra todas as utilities de padding/margem.
- `color-scheme: light dark` no `:root` — sem isso, o ícone do seletor de hora nativo (`<input type="time">`) e a seta do `<select>` renderizam no chrome claro do SO mesmo com o app em modo escuro.

### Componentes (`components/apple/ui.tsx`)

`Card`, `Button` (variantes primary/secondary/plain), `PageTitle`, `SectionLabel`. Todo alvo de toque ≥44px. Cards usam blur + borda 1px + sombra **rasa** (nunca sombra difusa de blur alto junto com borda — é um padrão banido explicitamente pela skill impeccable, o "ghost-card", clichê reconhecível de UI gerada por IA).

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
