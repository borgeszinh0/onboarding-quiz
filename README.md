# 🧭 Valores — Onboarding + 12 Week Year

Sistema completo de autodesenvolvimento baseado na metodologia ACT (Terapia de Aceitação e Comprometimento) combinada com o sistema de execução **The 12 Week Year** (Brian Moran).

**🔗 Ao vivo:** [onboarding-quiz-eight.vercel.app](https://onboarding-quiz-eight.vercel.app)

---

## O que é

Um app web que conduz o usuário por uma jornada de 3 fases:

1. **Mapeamento de Valores** — 12 domínios da vida avaliados em 6 dimensões
2. **Construção de Metas SMART** — os maiores gaps viram metas estruturadas
3. **Plano de Execução de 12 Semanas** — metas viram táticas semanais com scorecard

O sistema é baseado em dois PDFs do **Reservatório de Dopamina**:
- *Meu Planejamento para 2026* — framework valores + ambiente + compromisso
- *Avaliação dos Valores / Exercício sobre Valores* — exercícios de clareza de valores

---

## Arquitetura

```
Valores (quiz)
  └── Metas SMART (quiz)
        └── Táticas semanais (12 Week Year)
              └── Execução semanal com scorecard
```

### Fluxo do quiz (5 etapas)

| Etapa | O que faz | Metodologia |
|---|---|---|
| **01 · Avaliação Quantitativa** | 12 domínios × 6 dimensões (sliders 0-10) | BulMBProgressHUDIPTerapia de Aceitação e Comprometimento — Matrix de Valores |
| **02 · Reflexão** | Top 5 domínios com maior gap → texto livre | ACT — Clareza de Valores |
| **03 · Narrativa** | 1 frase-bússola por domínio (importância ≥ 5) | ACT — Valores como direção, não destino |
| **04 · Ambiente** | 3 perguntas de auditoria ambiental | Context Theory — Ambiente como gatilho |
| **05 · Metas SMART** | Top 3 gaps → meta montada automaticamente | SMART (Doran, 1981) |
| **Resultado** | Dashboard: gap chart, prioridades, narrativas, metas, ambiente + export JSON | — |

### 12 Week Year (sistema de execução)

Depois do quiz, o usuário pode iniciar um plano de 12 semanas:

1. **Setup:** cada meta SMART vira 3-5 táticas semanais
2. **Dashboard semanal:** checklist de táticas + scorecard circular (% de conclusão)
3. **Visão geral:** grid de 12 semanas com histórico de scores
4. **Score geral:** % acumulado de execução

Scorecard do 12WY:
- **80%+** → Execução excelente (verde)
- **50-79%** → Precisa acelerar (vermelho)
- **<50%** → Refocar (cinza)

---

## Os 12 Domínios da Vida

| # | Domínio | Ícone | Descrição |
|---|---|---|---|
| 1 | Família | 👨‍👩‍👧 | Relações familiares |
| 2 | Casamento / Relação Íntima | 💑 | Casamento, relacionamentos íntimos |
| 3 | Parentalidade | 👶 | Maternidade / paternidade |
| 4 | Amizades / Vida Social | 🤝 | Amizades, vida social |
| 5 | Carreira / Trabalho | 💼 | Trabalho, carreira, vocação |
| 6 | Educação / Crescimento | 📚 | Educação, desenvolvimento pessoal |
| 7 | Recreação / Diversão | 🎮 | Hobbies, esportes, lazer |
| 8 | Espiritualidade | 🧘 | Religião, natureza, propósito |
|  Especialista | Vida em Comunidade | 🏘️ | Voluntariado, engajamento social |
| 10 | Autocuidado Físico | 💪 | Saúde, dieta, exercício, sono |
| 11 | Ambiente / Sustentabilidade | 🌍 | Preocupação com o planeta |
| 12 | Arte / Estética | 🎨 | Arte, música, literatura, beleza |

## As 6 Dimensões de Avaliação

| Dimensão | Pergunta |
|---|---|
| Possibilidade | O quanto é possível que algo significativo aconteça nesta área? |
| Importância atual | O quanto esta área é importante para você agora? |
| Importância geral | O quanto esta área é importante como um todo na sua vida? |
| Ação | O quanto você atuou nesta área na última semana? |
| Satisfação | O quanto você está satisfeito com seu nível de ação? |
| Preocupação | O quanto você está preocupado com a falta de progresso? |

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **React Context + useReducer** — state management (zero dependências externas)
- **localStorage** — persistência sem backend

## Estrutura do projeto

```
onboarding-quiz/
├── app/
│   ├── layout.tsx               # Root layout (pt-BR)
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Design tokens (cream/rust palette)
│   ├── quiz/
│   │   ├── layout.tsx           # QuizProvider wrapper
│   │   └── page.tsx
│   └── plano/
│       ├── layout.tsx           # TwelveWeekProvider + QuizProvider
│       ├── page.tsx
│       └── dashboard/
│           └── page.tsx         # Redirect → /plano
├── components/
│   ├── ProgressBar.tsx
│   ├── ui.tsx                   # Slider, TextBox, NavButtons, StepHeader
│   ├── steps/
│   │   ├── WelcomeStep.tsx
│   │   ├── QuantitativeStep.tsx
│   │   ├── QualitativeStep.tsx
│   │   ├── NarrativeStep.tsx
│   │   ├── EnvironmentStep.tsx
│   │   ├── SmartStep.tsx
│   │   └── ResultStep.tsx
│   └── 12wy/
│       ├── PlanSetup.tsx        # Setup de táticas
│       └── PlanDashboard.tsx    # Dashboard semanal + scorecard
└── lib/
    ├── types.ts                 # Tipos do quiz
    ├── data.ts                  # 12 domínios, 6 dimensões, SMART fields
    ├── store.tsx                # QuizStore (Context + useReducer + localStorage)
    ├── 12wy-types.ts            # Tipos do 12 Week Year
    └── 12wy-store.tsx           # 12WY Store (Context + useReducer + localStorage)
```

## Design

Identidade visual extraída do PDF original do Reservatório de Dopamina:

- **Paleta:** cream quente (`#F5F0E6`) + rust/vermelho (`#B8392E`)
- **Tipografia:** editorial — títulos bold, eyebrows em uppercase tracking-wide
- **Sliders customizados** com thumb rust e borda cream
- **Animação** fadeInUp entre steps
- **Scorecard circular** SVG com feedback de cor (verde/vermelho/cinza)
- Totalmente responsivo

---

## Rodar localmente

```bash
git clone https://github.com/borgeszinh0/onboarding-quiz.git
cd onboarding-quiz
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Deploy

O app está deployado na Vercel (hobby tier — grátis). O deploy é automático a cada push na branch `main`.

```bash
vercel --prod
```

---

## Metodologias de referência

- **ACT (Terapia de Aceitação e Comprometimento)** — Steven Hayes
- **The 12 Week Year** — Brian Moran & Michael Lennington
- **SMART Goals** — George T. Doran (1981)
- **Reservatório de Dopamina** — material de origem dos exercícios

---

## Licença

Projeto pessoal. Uso privado.
