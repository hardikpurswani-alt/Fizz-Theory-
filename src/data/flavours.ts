export type FlavourId = "orange" | "berry" | "lime" | "mix";
export type FruitKind = "orange" | "grapefruit" | "lime" | "lemon";

export interface Flavour {
  id: FlavourId;
  name: string;
  /** two-line name painted on the can */
  lines: [string, string];
  description: string;
  price: number;
  /** hero panel colour */
  hero: string;
  /** label base colour */
  base: string;
  dark: string;
  accent: string;
  /** pastel card colour */
  card: string;
  fruit: FruitKind;
  tags: string[];
  quote: { text: string; name: string; role: string };
}

export const FLAVOURS: Flavour[] = [
  {
    id: "orange",
    name: "Sunny Orange",
    lines: ["SUNNY", "ORANGE"],
    description: "Sun-ripened orange, a squeeze of tangerine and a bright, bubbly finish.",
    price: 2.99,
    hero: "#FF7A1A",
    base: "#FF8A1F",
    dark: "#E85D04",
    accent: "#FFD23F",
    card: "#FFE47A",
    fruit: "orange",
    tags: ["Low sugar", "Real fruit", "12 fl oz"],
    quote: {
      text: "Tastes like summer in a can. I stopped buying anything else.",
      name: "Maya R.",
      role: "Sample review",
    },
  },
  {
    id: "berry",
    name: "Berry Pop",
    lines: ["BERRY", "POP"],
    description: "Wild raspberry and pink grapefruit with a crisp, jammy sparkle.",
    price: 2.99,
    hero: "#F0457F",
    base: "#F2508A",
    dark: "#C71F5E",
    accent: "#FFC6DA",
    card: "#FFC4D8",
    fruit: "grapefruit",
    tags: ["Zero artificial", "Fruit-first", "12 fl oz"],
    quote: {
      text: "Finally a pink soda that doesn't taste like candy. Obsessed.",
      name: "Jonah K.",
      role: "Sample review",
    },
  },
  {
    id: "lime",
    name: "Lime Spark",
    lines: ["LIME", "SPARK"],
    description: "Zesty lime and lemon peel with a clean, electric fizz.",
    price: 2.99,
    hero: "#5DB11F",
    base: "#76C52C",
    dark: "#3E8E12",
    accent: "#F4F27A",
    card: "#E3F27A",
    fruit: "lime",
    tags: ["Zesty", "Crisp finish", "12 fl oz"],
    quote: {
      text: "So crisp and refreshing. It's my 3pm pick-me-up now.",
      name: "Priya S.",
      role: "Sample review",
    },
  },
  {
    id: "mix",
    name: "Fizz Mix-Tangy",
    lines: ["MIX", "TANGY"],
    description: "The whole rainbow in one can. Citrus, berry and a little mystery.",
    price: 3.49,
    hero: "#FF7A1A",
    base: "#FF8A1F",
    dark: "#E85D04",
    accent: "#FFD23F",
    card: "#FFE47A",
    fruit: "lemon",
    tags: ["Limited drop", "Rainbow", "12 fl oz"],
    quote: { text: "", name: "", role: "" },
  },
];

export const HERO_FLAVOURS = FLAVOURS.filter((f) => f.id !== "mix");
export const MIX = FLAVOURS[3];

export const money = (n: number) => `$${n.toFixed(2)}`;
