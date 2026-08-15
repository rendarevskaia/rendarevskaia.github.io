import { escapeHtml } from "./utils.mjs";

export const site = {
  name: "Елена Рендаревская",
  alternateName: "Elena Rendarevskaya",
  role: "предприниматель, CFO-консультант, стратегический модератор",
  title: "Елена Рендаревская — финансы, стратегия и управление бизнесом",
  description:
    "Разборы для предпринимателей о финансах, стратегии, управлении, системах и человеке в работе. Автор — Елена Рендаревская.",
  defaultUrl: "https://rendarevskaia.github.io",
  language: "ru-RU",
  telegram: "https://t.me/rendarevskaya",
  contact: "https://t.me/Elena_Rendarevskaya",
  home: {
    featuredSlugs: [
      "wildberries-sellers-capital",
      "ozark-dlya-predprinimateley",
      "kognitivnye-iskazheniya-v-biznese",
    ],
    pillars: [
      {
        title: "Деньги и устойчивость бизнеса",
        description: "Капитал, управленческий учёт, финансовые модели и цена решений.",
        category: "финансы",
      },
      {
        title: "Стратегия и системы управления",
        description: "Бизнес-модели, обратные связи, процессы и регулярный менеджмент.",
        category: "управление",
      },
      {
        title: "Решения, мышление и человек",
        description: "Когнитивные искажения, предпринимательское мышление и человек в работе.",
        category: "мышление",
      },
    ],
  },
  profile: {
    image: "/images/elena-rendarevskaya.jpg",
    sameAs: [
      "https://network.tochka.com/expert/64/",
      "https://taplink.cc/rendarevskaya",
      "https://t.me/rendarevskaya",
    ],
    knowsAbout: [
      "корпоративные финансы",
      "управленческий учёт",
      "финансовая стратегия",
      "стратегические сессии",
      "операционное управление",
      "регулярный менеджмент",
    ],
  },
};

export const categories = [
  { name: "бизнес", slug: "biznes" },
  { name: "финансы", slug: "finansy" },
  { name: "управление", slug: "upravlenie" },
  { name: "стратегия", slug: "strategiya" },
  { name: "предпринимательство", slug: "predprinimatelstvo" },
  { name: "мышление", slug: "myshlenie" },
  { name: "человек и работа", slug: "chelovek-i-rabota" },
  { name: "исследования", slug: "issledovaniya" },
];

export function categoryByName(name) {
  return categories.find((category) => category.name === name);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function readingTime(markdown) {
  const words = markdown
    .replace(/[`*_>#\[\]()\-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const output = [];
  let paragraph = [];
  let list = null;

  const inline = (text) => {
    let value = escapeHtml(text);
    value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    value = value.replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?;:])/g, "$1<em>$2</em>");
    value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
    return value;
  };

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      output.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };

  for (const line of [...lines, ""]) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    const quote = trimmed.match(/^>\s?(.*)$/);

    if (!trimmed) {
      flushParagraph();
      flushList();
    } else if (image) {
      flushParagraph();
      flushList();
      output.push(`<figure class="prose-figure"><img src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1])}" loading="eager" decoding="async"></figure>`);
    } else if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const id = heading[2]
        .toLocaleLowerCase("ru")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/(^-|-$)/g, "");
      output.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`);
    } else if (quote) {
      flushParagraph();
      flushList();
      output.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
    } else if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? "ul" : "ol";
      if (!list || list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((unordered || ordered)[1]);
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  }

  return output.join("\n");
}
