import { Domain, DimensionConfig } from "./types";

export const DIMENSIONS: DimensionConfig[] = [
  {
    key: "possibility",
    label: "Possibilidade",
    description:
      "O quanto é possível que algo muito significativo aconteça nesta área?",
  },
  {
    key: "currentImportance",
    label: "Importância atual",
    description: "O quanto esta área é importante para você neste momento?",
  },
  {
    key: "generalImportance",
    label: "Importância geral",
    description: "O quanto esta área é importante como um todo na sua vida?",
  },
  {
    key: "action",
    label: "Ação",
    description:
      "O quanto você atuou a serviço desta área na última semana?",
  },
  {
    key: "satisfaction",
    label: "Satisfação com ação",
    description:
      "O quanto você está satisfeito com seu nível de ação nesta área?",
  },
  {
    key: "concern",
    label: "Preocupação",
    description:
      "O quanto você está preocupado com a falta de progresso nesta área?",
  },
];

export const DOMAINS: Domain[] = [
  {
    id: "family",
    name: "Família",
    shortName: "Família",
    icon: "👨‍👩‍👧",
    description: "Relações familiares (que não sejam casamento ou parentalidade)",
    prompt:
      "Descreva o tipo de irmão/irmã, filho/filha, pai/mãe que você deseja ser. Quais qualidades gostaria de ter nesses relacionamentos?",
  },
  {
    id: "intimate",
    name: "Casamento / Relação Íntima",
    shortName: "Relação",
    icon: "💑",
    description: "Casamento, casais, relacionamentos íntimos",
    prompt:
      "Descreva a pessoa que você gostaria de ser em um relacionamento íntimo. Que tipo de relacionamento gostaria de ter? Foque no seu papel.",
  },
  {
    id: "parenting",
    name: "Parentalidade",
    shortName: "Parentalidade",
    icon: "👶",
    description: "Maternidade / paternidade",
    prompt: "Que tipo de pai/mãe você gostaria de ser, tanto agora quanto no futuro?",
  },
  {
    id: "friends",
    name: "Amizades / Vida Social",
    shortName: "Amizades",
    icon: "🤝",
    description: "Amizades, vida social, convívio",
    prompt:
      "O que significa para você ser um bom amigo? Se pudesse ser o melhor amigo possível, como você se comportaria?",
  },
  {
    id: "career",
    name: "Carreira / Trabalho",
    shortName: "Carreira",
    icon: "💼",
    description: "Trabalho, carreira, vocação profissional",
    prompt:
      "Que tipo de trabalho você gostaria de fazer? Que tipo de trabalhador gostaria de ser para seus colegas e empregador?",
  },
  {
    id: "education",
    name: "Educação / Crescimento",
    shortName: "Educação",
    icon: "📚",
    description: "Educação, treinamento, crescimento e desenvolvimento pessoal",
    prompt:
      "Que tipo de instrução, treinamento ou desenvolvimento pessoal gostaria de buscar? Por que isso te atrai?",
  },
  {
    id: "recreation",
    name: "Recreação / Diversão",
    shortName: "Recreação",
    icon: "🎮",
    description: "Hobbies, esportes, lazer, diversão",
    prompt:
      "Que tipo de vida recreativa você gostaria de ter? Inclua hobbies, esportes e atividades de lazer.",
  },
  {
    id: "spirituality",
    name: "Espiritualidade",
    shortName: "Espiritualidade",
    icon: "🧘",
    description: "Religião, natureza, propósito, conexão espiritual",
    prompt:
      "O que espiritualidade significa para você? Como gostaria que essa parte da sua vida fosse?",
  },
  {
    id: "community",
    name: "Vida em Comunidade",
    shortName: "Comunidade",
    icon: "🏘️",
    description: "Participação comunitária, voluntariado, engajamento social",
    prompt:
      "Que tipo de participação comunitária é importante para você? Que direção gostaria de tomar nesta área?",
  },
  {
    id: "physical",
    name: "Autocuidado Físico",
    shortName: "Saúde",
    icon: "💪",
    description: "Saúde, dieta, exercício, sono",
    prompt:
      "Quais são seus valores relacionados ao bem-estar físico? Sono, dieta, exercício, saúde geral?",
  },
  {
    id: "environment",
    name: "Ambiente / Sustentabilidade",
    shortName: "Ambiente",
    icon: "🌍",
    description: "Preocupação com o planeta e meio ambiente",
    prompt:
      "Quais seus valores relacionados a sustentabilidade e preocupações com o planeta?",
  },
  {
    id: "aesthetics",
    name: "Arte / Estética",
    shortName: "Arte",
    icon: "🎨",
    description: "Arte, música, literatura, beleza, artesanato",
    prompt:
      "Quais seus valores relacionados a arte, música, literatura ou qualquer forma de beleza no mundo?",
  },
];

export const ENVIRONMENT_QUESTIONS = [
  "Quais elementos do seu ambiente atual puxam comportamentos automáticos que você quer mudar?",
  "O que no seu dia a dia reforça hábitos que vão contra seus valores?",
  "Que pequenas mudanças estruturais você pode fazer para reduzir o atrito entre você e seus valores?",
];

export const SMART_FIELDS = [
  {
    key: "specific" as const,
    label: "O quê",
    description: "O que exatamente você vai fazer? Verbo de ação.",
    placeholder: "treinar musculação",
  },
  {
    key: "measurable" as const,
    label: "Quanto",
    description: "Que número/frequência prova que você conseguiu?",
    placeholder: "3x por semana, 40min por sessão",
  },
  {
    key: "achievable" as const,
    label: "Como",
    description: "O que você vai fazer na prática pra conseguir?",
    placeholder: "acordar 30min mais cedo nos dias de treino",
  },
  {
    key: "relevant" as const,
    label: "Por que",
    description: "Por que isso importa pra você agora?",
    placeholder: "cuidar do corpo me dá energia pra tudo o resto",
  },
  {
    key: "timeBound" as const,
    label: "Quando",
    description: "Qual o prazo final?",
    placeholder: "10 de outubro de 2026",
  },
];
