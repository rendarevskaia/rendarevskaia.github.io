import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  categories,
  categoryByName,
  formatDate,
  readingTime,
  renderMarkdown,
  site,
} from "../src/site.mjs";
import { renderSeptemberDiagnostic } from "../src/september-diagnostic.mjs";
import { escapeHtml, escapeXml } from "../src/utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const basePath = normalizeBase(process.env.BASE_PATH || "");
const siteUrl = (process.env.SITE_URL || site.defaultUrl).replace(/\/$/, "");

function normalizeBase(value) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function href(value = "/") {
  const clean = value.startsWith("/") ? value : `/${value}`;
  return `${basePath}${clean}`.replace(/\/+/g, "/");
}

function absolute(value = "/") {
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function personSchema() {
  return {
    "@type": "Person",
    "@id": `${absolute("/about/")}#person`,
    name: site.name,
    alternateName: site.alternateName,
    url: absolute("/about/"),
    image: absolute(site.profile.image),
    jobTitle: site.role,
    description: "Предприниматель, финансист, CFO-консультант, стратегический модератор и практикующий психолог. Работает с корпоративными финансами, стратегией, управлением и психологией решений.",
    knowsAbout: site.profile.knowsAbout,
    sameAs: site.profile.sameAs,
  };
}

function parseFrontMatter(source, filename) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`Нет front matter: ${filename}`);
  const data = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`Некорректная строка front matter в ${filename}: ${line}`);
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else if (value === "true" || value === "false") {
      value = value === "true";
    }
    data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function articlePath(article) {
  return `/articles/${article.slug}/`;
}

function articleUrl(article) {
  return absolute(articlePath(article));
}

function categoryPath(name) {
  const category = categoryByName(name);
  return category ? `/topics/${category.slug}/` : "/articles/";
}

function nav(active) {
  const item = (key, label, url) =>
    `<a href="${href(url)}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<nav class="site-nav" aria-label="Основная навигация">
    ${item("articles", "Статьи", "/articles/")}
    ${item("diagnostic", "Диагностика", "/diagnostics/september-2026/")}
    ${item("services", "Услуги", "/services/")}
    ${item("about", "Обо мне", "/about/")}
  </nav>`;
}

function layout({
  title,
  description,
  pathname,
  active,
  content,
  type = "website",
  image = "/og/editorial.png",
  jsonLd = "",
  robots = "",
  publishedTime = "",
  section = "",
}) {
  const canonical = absolute(pathname);
  const imageUrl = image ? absolute(image) : "";
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="${site.name}">
  ${robots ? `<meta name="robots" content="${robots}">` : ""}
  <meta name="theme-color" content="#fbfaf7">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="Материалы Елены Рендаревской" href="${absolute("/rss.xml")}">
  <link rel="icon" href="${href("/favicon.svg")}" type="image/svg+xml" sizes="any">
  <link rel="apple-touch-icon" href="${href(site.profile.image)}">
  <link rel="author" href="${href("/about/")}">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="${escapeHtml(title)}">` : ""}
  ${type === "article" && publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ""}
  ${type === "article" && section ? `<meta property="article:section" content="${escapeHtml(section)}">` : ""}
  ${type === "article" ? `<meta property="article:author" content="${absolute("/about/")}">` : ""}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ""}
  <link rel="stylesheet" href="${href("/styles.css?v=20260825-diagnostic")}">
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
</head>
<body>
  <a class="skip-link" href="#content">К содержанию</a>
  <header class="site-header">
    <a class="brand" href="${href("/")}" aria-label="На главную">${site.name}</a>
    ${nav(active)}
  </header>
  <main id="content">${content}</main>
  <footer class="site-footer">
    <p>© ${new Date().getUTCFullYear()} ${site.name}</p>
    <nav aria-label="Дополнительная навигация">
      <a href="${site.telegram}" rel="me">Telegram</a>
      <a href="${href("/rss.xml")}">RSS</a>
      <a href="${href("/articles/")}">Архив</a>
      <a href="${href("/diagnostics/september-2026/")}">Диагностика</a>
      <a href="${href("/services/")}">Услуги</a>
    </nav>
  </footer>
</body>
</html>`;
}

function articleRow(article) {
  return `<a class="article-row" href="${href(articlePath(article))}">
    <span class="article-date">${formatDate(article.date)}</span>
    <div>
      <span class="meta">${escapeHtml(article.category)}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.description)}</p>
    </div>
    <span class="article-arrow" aria-hidden="true">↗</span>
  </a>`;
}

function relatedMaterials(article, articles) {
  const explicitSlugs = String(article.related || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  const bySlug = new Map(articles.map((item) => [item.slug, item]));
  const related = explicitSlugs.map((slug) => {
    const item = bySlug.get(slug);
    if (!item) throw new Error(`Не найдена связанная статья «${slug}» для ${article.slug}`);
    if (item.slug === article.slug) throw new Error(`Статья ${article.slug} не может ссылаться на себя`);
    return item;
  });

  const fallback = [
    ...articles.filter((item) => item.category === article.category),
    ...site.home.featuredSlugs.map((slug) => bySlug.get(slug)).filter(Boolean),
    ...articles,
  ];
  for (const item of fallback) {
    if (related.length >= 3) break;
    if (item.slug !== article.slug && !related.some((relatedItem) => relatedItem.slug === item.slug)) related.push(item);
  }

  return `<section class="related-materials" aria-labelledby="related-${article.slug}">
    <p class="section-kicker">Продолжить чтение</p>
    <h2 id="related-${article.slug}">Связанные материалы</h2>
    <ul>${related.map((item) => `<li><a href="${href(articlePath(item))}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.description)}</span></li>`).join("")}</ul>
  </section>`;
}

function readerCta() {
  return `<section class="reader-cta" aria-labelledby="reader-cta-title">
    <p class="section-kicker">Оставаться на связи</p>
    <h2 id="reader-cta-title">Новые тексты — в Telegram</h2>
    <p>Там я публикую наблюдения, материалы к статьям и анонсы новых разборов.</p>
    <div class="reader-actions">
      <a class="button button-primary" href="${site.telegram}" rel="me">Подписаться</a>
      <a class="button button-secondary" href="${site.contact}">Обсудить задачу</a>
    </div>
  </section>`;
}

function articleResource(article) {
  if (!article.resourceUrl) return "";
  return `<aside class="article-resource" aria-labelledby="article-resource-${article.slug}">
    <p class="section-kicker">Практический материал</p>
    <h2 id="article-resource-${article.slug}">${escapeHtml(article.resourceTitle || "Шаблон к статье")}</h2>
    <p>${escapeHtml(article.resourceDescription || "Готовая рабочая форма, которую можно адаптировать под свою компанию.")}</p>
    <a class="button button-primary" href="${href(article.resourceUrl)}"${article.resourceDownload === true ? " download" : ""}>${escapeHtml(article.resourceButton || "Открыть и скачать шаблон")}</a>
  </aside>`;
}

async function loadArticles() {
  const directory = path.join(root, "content/articles");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));
  const articles = [];
  const slugs = new Set();

  for (const file of files) {
    const source = await readFile(path.join(directory, file), "utf8");
    const { data, body } = parseFrontMatter(source, file);
    for (const field of ["title", "description", "date", "category", "slug", "draft", "image"]) {
      if (data[field] === undefined || data[field] === "") throw new Error(`Поле ${field} не заполнено в ${file}`);
    }
    if (!categoryByName(data.category)) throw new Error(`Неизвестная категория «${data.category}» в ${file}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error(`Дата в ${file} должна быть в формате YYYY-MM-DD`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error(`Slug в ${file} должен быть написан латиницей`);
    if (slugs.has(data.slug)) throw new Error(`Повторяющийся slug: ${data.slug}`);
    slugs.add(data.slug);
    if (data.draft !== true) articles.push({ ...data, body, minutes: readingTime(body) });
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

async function writePage(pathname, html) {
  const target = pathname === "/" ? out : path.join(out, pathname.replace(/^\//, ""));
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "index.html"), html);
}

async function build() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(path.join(root, "public"), out, { recursive: true });
  await cp(path.join(root, "src/styles.css"), path.join(out, "styles.css"));

  const articles = await loadArticles();
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const featured = site.home.featuredSlugs.map((slug) => {
    const article = bySlug.get(slug);
    if (!article) throw new Error(`Не найдена главная статья «${slug}»`);
    return article;
  });
  const featuredSlugs = new Set(featured.map((article) => article.slug));
  const latest = articles.filter((article) => !featuredSlugs.has(article.slug)).slice(0, 4);
  const populatedCategories = categories.filter((category) => articles.some((article) => article.category === category.name));

  const home = `<section class="shell hero">
    <div class="hero-copy">
      <p class="eyebrow">Авторский сайт · независимое медиа</p>
      <h1>Елена<br>Рендаревская</h1>
      <p class="hero-note">Пишу о деньгах, управлении и человеке внутри бизнеса — о том, как решения собственника превращаются в прибыль или убыток, порядок или хаос, развитие компании или его собственное истощение. Потерянную прибыль видно в отчёте, а потерянное внимание, отложенную жизнь и невозможность выйти из операционки обычно не считает никто.</p>
      <p class="hero-support">Длинные тексты о финансах, стратегии, управлении и человеке в работе.</p>
      <div class="hero-actions">
        <a class="button button-primary" href="#start">Начать с главных материалов</a>
        <a class="button button-secondary" href="${site.telegram}" rel="me">Подписаться в Telegram</a>
      </div>
      <p class="hero-credentials">В финансах с 2005 года · практикующий психолог · предпринимательский опыт с выходом из бизнеса</p>
    </div>
    <figure class="hero-art">
      <img src="${href(site.profile.editorialImage)}" alt="Иллюстрированный портрет Елены Рендаревской" width="1122" height="1402" loading="eager" fetchpriority="high">
      <figcaption><span>Финансы</span><span>Стратегия</span><span>Человек</span></figcaption>
    </figure>
  </section>
  <section class="shell section" id="start" aria-labelledby="start-title">
    <div class="section-heading">
      <div><p class="section-kicker">С чего начать</p><h2 id="start-title">Главные материалы</h2></div>
      <a class="text-link" href="${href("/articles/")}">Весь архив</a>
    </div>
    <div class="article-list">${featured.map(articleRow).join("\n")}</div>
  </section>
  <section class="shell section" aria-labelledby="latest-title">
    <div class="section-heading">
      <div><p class="section-kicker">Последнее</p><h2 id="latest-title">Новые материалы</h2></div>
      <a class="text-link" href="${href("/articles/")}">Все статьи</a>
    </div>
    <div class="article-list">${latest.map(articleRow).join("\n") || "<p>Материалы скоро появятся.</p>"}</div>
  </section>
  <section class="diagnostic-preview" aria-labelledby="diagnostic-preview-title"><div class="shell diagnostic-preview-grid">
    <div><p class="section-kicker">Точка сентября · 2026</p><h2 id="diagnostic-preview-title">Что ограничивает результат бизнеса до конца года</h2></div>
    <div><p>Пятнадцать вопросов по причинной цепочке: от спроса и экономики до управления и роли собственника. На выходе — главное ограничение и три действия на 30 дней.</p><a class="button button-primary" href="${href("/diagnostics/september-2026/")}">Пройти диагностику</a></div>
  </div></section>
  <section class="section section-band" aria-labelledby="directions-title"><div class="shell">
    <div class="section-heading"><div><p class="section-kicker">Редакционная карта</p><h2 id="directions-title">Три направления</h2></div></div>
    <div class="editorial-paths">${site.home.pillars.map((pillar, index) => {
      const category = categoryByName(pillar.category);
      if (!category || !populatedCategories.some((item) => item.name === category.name)) return "";
      return `<a href="${href(`/topics/${category.slug}/`)}"><span class="path-number">0${index + 1}</span><div><h3>${escapeHtml(pillar.title)}</h3><p>${escapeHtml(pillar.description)}</p></div><span class="article-arrow" aria-hidden="true">↗</span></a>`;
    }).join("")}</div>
  </div></section>
  <section class="shell section work-preview" aria-labelledby="work-title">
    <div class="section-heading">
      <div><p class="section-kicker">Работа со мной</p><h2 id="work-title">Три масштаба задачи</h2></div>
      <a class="text-link" href="${href("/services/")}">Все форматы</a>
    </div>
    <div class="editorial-paths">
      <a href="${href("/services/#decision")}"><span class="path-number">01</span><div><h3>Разобрать сложное решение</h3><p>Индивидуальная консультация для собственника, когда нужно увидеть варианты, риски и последствия.</p></div><span class="article-arrow" aria-hidden="true">↗</span></a>
      <a href="${href("/services/#diagnostics")}"><span class="path-number">02</span><div><h3>Понять, что происходит с бизнесом</h3><p>Диагностика финансов, процессов и системы управления.</p></div><span class="article-arrow" aria-hidden="true">↗</span></a>
      <a href="${href("/services/#session")}"><span class="path-number">03</span><div><h3>Принять решение вместе с командой</h3><p>Стратегическая работа с собственником, партнёрами или руководителями.</p></div><span class="article-arrow" aria-hidden="true">↗</span></a>
    </div>
  </section>`;

  await writePage("/", layout({
    title: site.title,
    description: site.description,
    pathname: "/",
    content: home,
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          name: site.name,
          alternateName: [site.alternateName, "rendarevskaia.github.io"],
          url: absolute("/"),
          description: site.description,
          inLanguage: site.language,
          publisher: { "@id": `${absolute("/about/")}#person` },
        },
        {
          "@type": "CollectionPage",
          "@id": `${siteUrl}/#collection`,
          name: "Главные материалы Елены Рендаревской",
          url: absolute("/"),
          isPartOf: { "@id": `${siteUrl}/#website` },
          hasPart: featured.map((article) => ({ "@type": "Article", headline: article.title, url: articleUrl(article) })),
        },
        personSchema(),
      ],
    }),
  }));

  const years = articles.reduce((map, article) => {
    const year = article.date.slice(0, 4);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(article);
    return map;
  }, new Map());
  const archive = `<section class="shell page-header"><p class="eyebrow">Архив</p><h1 class="page-title">Все статьи</h1><p class="page-intro">Финансы бизнеса, системы управления, мышление и человек в работе.</p></section>
  <section class="shell section">${[...years.entries()].map(([year, items]) => `<section aria-labelledby="year-${year}"><h2 class="archive-year" id="year-${year}">${year}</h2><div class="article-list">${items.map(articleRow).join("\n")}</div></section>`).join("\n")}</section>`;
  await writePage("/articles/", layout({ title: `Статьи — ${site.name}`, description: "Архив всех публикаций Елены Рендаревской по датам и темам.", pathname: "/articles/", active: "articles", content: archive }));

  for (const article of articles) {
    const category = categoryByName(article.category);
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: article.date,
      articleSection: article.category,
      inLanguage: site.language,
      mainEntityOfPage: articleUrl(article),
      image: absolute(article.image),
      author: personSchema(),
      publisher: { "@id": `${absolute("/about/")}#person`, "@type": "Person", name: site.name },
    });
    const content = `<article>
      <header class="article-header article-header-${category.slug}">
        <a class="meta" href="${href(categoryPath(article.category))}">${escapeHtml(article.category)}</a>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-dek">${escapeHtml(article.description)}</p>
        <div class="article-meta"><span><time datetime="${article.date}">${formatDate(article.date)}</time></span><span>${article.minutes} мин чтения</span></div>
      </header>
      <div class="prose${article.resourceUrl ? " prose-with-resource" : ""}">${renderMarkdown(article.body)}</div>
      ${articleResource(article)}
      <footer class="article-footer">
        <a class="text-link" href="${href("/articles/")}">← Все статьи</a>
        <div class="author-block"><img class="author-photo" src="${href(site.profile.image)}" alt="" width="64" height="64" loading="lazy"><p><a class="author-name" href="${href("/about/")}"><strong>${site.name}</strong></a><br>${site.role}</p></div>
        ${readerCta()}
        ${relatedMaterials(article, articles)}
      </footer>
    </article>`;
    await writePage(articlePath(article), layout({
      title: `${article.title} — ${site.name}`,
      description: article.description,
      pathname: articlePath(article),
      active: "articles",
      type: "article",
      image: article.image,
      content,
      jsonLd,
      publishedTime: article.date,
      section: article.category,
    }));
  }

  for (const category of categories) {
    const items = articles.filter((article) => article.category === category.name);
    const content = `<section class="shell page-header"><p class="eyebrow">Тема</p><h1 class="page-title">${category.name}</h1><p class="page-intro">Публикации по теме «${category.name}».</p></section><section class="shell section"><div class="article-list">${items.length ? items.map(articleRow).join("\n") : "<p>Материалы по этой теме скоро появятся.</p>"}</div></section>`;
    await writePage(`/topics/${category.slug}/`, layout({
      title: `${category.name[0].toUpperCase()}${category.name.slice(1)} — ${site.name}`,
      description: `Авторские материалы Елены Рендаревской по теме «${category.name}».`,
      pathname: `/topics/${category.slug}/`,
      active: "articles",
      content,
      robots: items.length ? "" : "noindex,follow",
    }));
  }

  const aboutSource = await readFile(path.join(root, "content/pages/about.md"), "utf8");
  const about = parseFrontMatter(aboutSource, "content/pages/about.md");
  const aboutContent = `<section class="shell page-header"><p class="eyebrow">Об авторе</p><h1 class="page-title">${escapeHtml(about.data.title)}</h1><p class="page-intro">${site.role}</p></section><section class="shell about-layout">
    <aside class="about-aside">
      <div class="about-portrait-frame"><img class="about-portrait" src="${href(site.profile.image)}" alt="Елена Рендаревская" width="300" height="300" loading="eager"></div>
      <p class="section-kicker">Коротко</p>
      <dl class="about-facts">
        <div><dt>В финансах</dt><dd>с 2005 года</dd></div>
        <div><dt>Практика</dt><dd>финансы, управление, психология</dd></div>
        <div><dt>Форматы</dt><dd>консалтинг, сопровождение, стратегические сессии</dd></div>
      </dl>
      <nav class="about-links" aria-label="Публичные профили">
        <a href="https://t.me/rendarevskaya">Telegram</a>
        <a href="https://network.tochka.com/expert/64/">Точка Нетворк</a>
        <a href="https://taplink.cc/rendarevskaya">Taplink</a>
      </nav>
    </aside>
    <div class="prose">${renderMarkdown(about.body)}</div>
  </section>`;
  const aboutJsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "ProfilePage", "@id": absolute("/about/"), mainEntity: personSchema() });
  await writePage("/about/", layout({ title: about.data.seoTitle || `${about.data.title} — ${site.name}`, description: about.data.description, pathname: "/about/", active: "about", image: "/og/editorial.png", content: aboutContent, jsonLd: aboutJsonLd }));

  const serviceArticles = [
    bySlug.get("chto-to-proishodit-s-dengami"),
    bySlug.get("finansovaya-sluzhba-obsluzhivaet-haos"),
    bySlug.get("strategicheskaya-sessiya-rezultat-363-dnya"),
  ];
  if (serviceArticles.some((article) => !article)) throw new Error("Не найдены материалы для страницы услуг");

  const servicesContent = `<section class="shell services-hero">
    <div>
      <p class="eyebrow">Работа со мной</p>
      <h1 class="page-title">Финансы, управление и решения собственника</h1>
    </div>
    <div class="services-hero-copy">
      <p>Чаще всего работа начинается с фразы: «У нас что-то происходит с деньгами». Мы проверяем финансовую модель, процессы, полномочия и решения собственника, чтобы найти причину и выбрать подходящий масштаб работы.</p>
      <div class="hero-actions"><a class="button button-primary" href="${site.contact}">Описать задачу</a><a class="button button-secondary" href="#formats">Посмотреть форматы</a></div>
    </div>
  </section>

  <section class="shell section" id="formats" aria-labelledby="formats-title">
    <div class="section-heading"><div><p class="section-kicker">С чего начать</p><h2 id="formats-title">Три входа в работу</h2></div></div>
    <div class="service-index">
      <a href="#decision"><span class="path-number">01</span><h3>Одно сложное решение</h3><p>Работаем с собственником.</p></a>
      <a href="#diagnostics"><span class="path-number">02</span><h3>Устройство бизнеса целиком</h3><p>Работаем с финансовой и управленческой системой.</p></a>
      <a href="#session"><span class="path-number">03</span><h3>Совместное решение</h3><p>Работаем с собственником и командой.</p></a>
    </div>
  </section>

  <section class="shell service-detail" id="decision" aria-labelledby="decision-title">
    <header class="service-detail-header"><div><p class="section-kicker">01 · Собственник</p><h2 id="decision-title">Разбор сложного решения</h2></div><p class="service-price">50 000 ₽</p></header>
    <div class="service-detail-grid">
      <div class="service-lead"><p>Индивидуальная консультация для ситуации, в которой решение нельзя принять только по ощущению, но и одной таблицы для него недостаточно.</p><a class="text-link" href="${site.contact}">Обсудить консультацию →</a></div>
      <div><h3>С какими вопросами</h3><ul><li>продолжать или закрывать направление;</li><li>брать ли кредит или инвестировать собственные деньги;</li><li>менять ли руководителя, партнёра или распределение ролей;</li><li>как выйти из операционки и не потерять управление;</li><li>какие риски создаёт выбранный сценарий.</li></ul></div>
      <div><h3>Что делаем</h3><p>Отделяем факты и расчёты от предположений, определяем варианты и ограничения, смотрим на финансовые и управленческие последствия каждого решения.</p><h3>Результат</h3><p>Ясная формулировка задачи, карта вариантов и рисков, перечень данных и следующих действий, необходимых для решения.</p></div>
    </div>
  </section>

  <section class="shell service-detail" id="diagnostics" aria-labelledby="diagnostics-title">
    <header class="service-detail-header"><div><p class="section-kicker">02 · Система бизнеса</p><h2 id="diagnostics-title">Диагностика бизнеса через деньги</h2></div><p class="service-price">300 000 ₽</p></header>
    <div class="service-detail-grid">
      <div class="service-lead"><p>Проектное обследование для компании, в которой оборот, прибыль, ликвидность, отчётность или процессы перестали складываться в понятную картину.</p><div class="service-entry-links"><a class="text-link" href="${href("/diagnostics/september-2026/")}">Начать с «Точки сентября» →</a><a class="text-link" href="${site.contact}">Обсудить проектную диагностику →</a></div></div>
      <div><h3>Что исследуем</h3><ul><li>финансовую модель и экономику направлений;</li><li>прибыль, движение денег и оборотный капитал;</li><li>управленческую отчётность и качество данных;</li><li>процессы, которые создают финансовый результат;</li><li>полномочия, ответственность и роль собственника;</li><li>готовность учёта и процессов к автоматизации.</li></ul></div>
      <div><h3>Результат</h3><p>Описание текущего устройства бизнеса, причины финансовых и управленческих симптомов, основные риски и приоритетный план изменений.</p><p>Если проблема требует внедрения управленческого учёта, автоматизации или перестройки регулярного менеджмента, объём следующего проекта определяется после диагностики.</p></div>
    </div>
  </section>

  <section class="shell service-detail" id="session" aria-labelledby="session-title">
    <header class="service-detail-header"><div><p class="section-kicker">03 · Собственник и команда</p><h2 id="session-title">Стратегическая сессия</h2></div><p class="service-price">от 490 000 ₽</p></header>
    <div class="service-detail-grid">
      <div class="service-lead"><p>Для ситуации, когда решение должны не только сформулировать, но и разделить собственники, партнёры или руководители компании.</p><a class="text-link" href="${site.contact}">Обсудить сессию →</a></div>
      <div><h3>Когда подходит</h3><ul><li>нужно выбрать стратегические приоритеты;</li><li>партнёры по-разному видят следующий этап;</li><li>роли и зоны ответственности размыты;</li><li>команда обсуждает одни и те же проблемы без решения;</li><li>принятые решения не переходят в исполнение.</li></ul></div>
      <div><h3>Что остаётся после</h3><p>Зафиксированные решения, приоритеты, владельцы, показатели, сроки и дорожная карта. Формат подготовки, состав участников и необходимое сопровождение определяются по задаче.</p></div>
    </div>
  </section>

  <section class="section services-continuation" aria-labelledby="continuation-title"><div class="shell">
    <div class="section-heading"><div><p class="section-kicker">После решения</p><h2 id="continuation-title">Сопровождение изменений</h2></div></div>
    <p class="services-continuation-intro">Трекинг и внедрение появляются не до, а после того, как понятны причина, решение и объём изменений.</p>
    <div class="continuation-list">
      <div><p class="service-price">150 000 ₽</p><h3>Трекинг и помощь в развитии бизнеса</h3><p>Регулярная работа с выполнением решений, препятствиями и корректировкой следующего шага.</p></div>
      <div><p class="service-price">Индивидуальный расчёт</p><h3>Проектное внедрение</h3><p>Управленческий учёт и автоматизация, финансовая политика или регулярный менеджмент — в объёме, который определён диагностикой.</p></div>
    </div>
  </div></section>

  <section class="shell section services-method" aria-labelledby="method-title">
    <div class="section-heading"><div><p class="section-kicker">Принципы работы</p><h2 id="method-title">Не объяснять цифрами всё. Не объяснять всё психологией</h2></div></div>
    <div class="method-grid"><p>Я начинаю с проверяемой финансовой картины: что происходит с прибылью, деньгами, продуктом и обязательствами. Затем связываю цифру с процессом, ответственностью и решением, которое её создаёт.</p><p>Психология становится частью работы, когда бизнес-задача касается тревоги, отношений, идентичности или способности собственника сделать выбор. Она не подменяет финансовую диагностику и не включается в проект без отдельной договорённости.</p></div>
  </section>

  <section class="shell section" aria-labelledby="reading-title">
    <div class="section-heading"><div><p class="section-kicker">До разговора</p><h2 id="reading-title">Материалы о моём подходе</h2></div><a class="text-link" href="${href("/articles/")}">Весь архив</a></div>
    <div class="article-list">${serviceArticles.map(articleRow).join("\n")}</div>
  </section>

  <section class="shell section services-proof" aria-labelledby="proof-title">
    <div class="section-heading"><div><p class="section-kicker">Опыт</p><h2 id="proof-title">Основания доверять</h2></div></div>
    <dl><div><dt>С 2005 года</dt><dd>работаю с финансами</dd></div><div><dt>Собственный бизнес</dt><dd>создала системную компанию и вышла из неё</dd></div><div><dt>Более 1 млрд ₽</dt><dd>выручка компаний, с которыми я работала</dd></div><div><dt>Финансы + управление + психология</dt><dd>три плоскости одной предпринимательской задачи</dd></div></dl>
  </section>

  <section class="shell section services-faq" aria-labelledby="faq-title">
    <div class="section-heading"><div><p class="section-kicker">FAQ</p><h2 id="faq-title">Перед началом работы</h2></div></div>
    <div class="faq-list">
      <details><summary>Как понять, какой формат мне подходит?</summary><p>Опишите ситуацию своими словами. Если вопрос касается одного решения, начнём с консультации. Если причина неясна и затрагивает устройство компании, нужна диагностика. Если решение должны принять несколько людей, обсуждаем сессию.</p></details>
      <details><summary>Можно ли начать с одной консультации?</summary><p>Да. Консультация может завершиться самостоятельным планом действий или показать, что задаче нужен проектный формат.</p></details>
      <details><summary>Вы работаете только с финансами?</summary><p>Нет. Финансы дают проверяемую картину результата, но причины часто находятся в бизнес-модели, процессах, ответственности и решениях собственника.</p></details>
      <details><summary>Что входит в стоимость проекта?</summary><p>До начала работы мы фиксируем задачу, границы, этапы и ожидаемый результат. Состав диагностики, сессии или внедрения зависит от масштаба компании и количества участников.</p></details>
      <details><summary>Как разделяются бизнес-консалтинг и психологическая работа?</summary><p>Финансовая и управленческая задача не становится психологической автоматически. Если требуется отдельная работа с состоянием или личным выбором собственника, мы обсуждаем её как самостоятельный формат.</p></details>
    </div>
  </section>

  <section class="services-final"><div class="shell"><p class="section-kicker">Начать разговор</p><h2>Не обязательно заранее выбирать услугу</h2><p>Опишите, что происходит с бизнесом и какое решение не удаётся принять. Я скажу, относится ли задача к моей практике и какой формат здесь имеет смысл.</p><a class="button button-primary" href="${site.contact}">Описать задачу в Telegram</a></div></section>`;

  const servicesJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absolute("/services/"),
    name: "Услуги Елены Рендаревской",
    description: "CFO-консалтинг, финансово-управленческая диагностика и стратегические сессии для собственников и команд.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        { "@type": "Service", name: "Разбор сложного решения", provider: personSchema() },
        { "@type": "Service", name: "Диагностика бизнеса через деньги", provider: personSchema() },
        { "@type": "Service", name: "Стратегическая сессия", provider: personSchema() },
      ],
    },
  });
  await writePage("/services/", layout({
    title: `Услуги для собственников и команд — ${site.name}`,
    description: "CFO-консалтинг, финансово-управленческая диагностика, стратегические сессии и сопровождение изменений.",
    pathname: "/services/",
    active: "services",
    content: servicesContent,
    jsonLd: servicesJsonLd,
  }));

  const diagnosticPath = "/diagnostics/september-2026/";
  const diagnosticContent = renderSeptemberDiagnostic({ href, contact: site.contact });
  const diagnosticJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absolute(diagnosticPath),
    name: "Точка сентября — 2026",
    description: "Онлайн-диагностика пяти направлений бизнеса: продажи, экономика, выполнение заказов, управление и зависимость текущей работы от собственника.",
    inLanguage: site.language,
    author: personSchema(),
    about: ["стратегия бизнеса", "управление", "финансы бизнеса", "роль собственника"],
  });
  await writePage(diagnosticPath, layout({
    title: `Точка сентября — 2026: диагностика бизнеса — ${site.name}`,
    description: "15 базовых и 4 уточняющих вопроса, чтобы выбрать первое направление проверки и конкретные данные для следующего шага.",
    pathname: diagnosticPath,
    active: "diagnostic",
    image: "/og/tochka-sentyabrya-2026.png",
    content: diagnosticContent,
    jsonLd: diagnosticJsonLd,
  }));

  const resourceSource = await readFile(path.join(root, "content/pages/standart-upravlencheskih-vstrech.md"), "utf8");
  const resource = parseFrontMatter(resourceSource, "content/pages/standart-upravlencheskih-vstrech.md");
  const resourcePath = `/materials/${resource.data.slug}/`;
  const resourceDownloadPath = `/templates/${resource.data.downloadName}`;
  const resourceContent = `<section class="shell resource-hero">
    <div>
      <p class="eyebrow">Практический инструмент</p>
      <h1 class="page-title">${escapeHtml(resource.data.title)}</h1>
      <p class="page-intro">${escapeHtml(resource.data.description)}</p>
      <div class="resource-actions">
        <a class="button button-primary" href="${href(resourceDownloadPath)}" download>Скачать шаблон в Markdown</a>
        <a class="button button-secondary" href="${href("/articles/tsikl-upravlencheskih-vstrech/")}">Прочитать статью</a>
      </div>
    </div>
    <aside class="resource-summary" aria-label="Содержание шаблона">
      <p class="section-kicker">Внутри</p>
      <ul>
        <li>четыре уровня регулярного цикла;</li>
        <li>форматы встреч по событию;</li>
        <li>критерии участия собственника;</li>
        <li>карточка встречи и протокол решения.</li>
      </ul>
    </aside>
  </section>
  <section class="shell resource-layout">
    <div class="prose resource-prose">${renderMarkdown(resource.body)}</div>
    <aside class="resource-side-note">
      <p class="section-kicker">Как применять</p>
      <p>Начните с минимального цикла и в течение месяца фиксируйте принятые решения. Затем уберите встречи без результата и уточните пороги участия собственника.</p>
      <a class="text-link" href="${site.contact}">Обсудить настройку →</a>
    </aside>
  </section>`;
  const resourceJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: resource.data.title,
    description: resource.data.description,
    url: absolute(resourcePath),
    image: absolute(resource.data.image),
    inLanguage: site.language,
    author: personSchema(),
  });
  await writePage(resourcePath, layout({
    title: `${resource.data.title} — ${site.name}`,
    description: resource.data.description,
    pathname: resourcePath,
    active: "articles",
    image: resource.data.image,
    content: resourceContent,
    jsonLd: resourceJsonLd,
  }));
  await mkdir(path.join(out, "templates"), { recursive: true });
  await writeFile(path.join(out, "templates", resource.data.downloadName), `# ${resource.data.title}\n\n${resource.body}\n`);

  const urls = ["/", "/articles/", "/services/", diagnosticPath, "/about/", resourcePath, ...articles.map(articlePath), ...populatedCategories.map((category) => `/topics/${category.slug}/`)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(absolute(url))}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(out, "sitemap.xml"), sitemap);
  await writeFile(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${absolute("/sitemap.xml")}\n`);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escapeXml(site.name)}</title><link>${escapeXml(siteUrl)}</link><description>${escapeXml(site.description)}</description><language>ru</language>
  ${articles.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${escapeXml(articleUrl(article))}</link><guid>${escapeXml(articleUrl(article))}</guid><pubDate>${new Date(`${article.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(article.description)}</description><category>${escapeXml(article.category)}</category></item>`).join("\n  ")}
</channel></rss>\n`;
  await writeFile(path.join(out, "rss.xml"), rss);
  await writeFile(path.join(out, ".nojekyll"), "");

  const notFound = layout({ title: `Страница не найдена — ${site.name}`, description: "Такой страницы нет.", pathname: "/404.html", content: `<section class="shell page-header"><p class="eyebrow">Ошибка 404</p><h1 class="page-title">Страница не найдена</h1><p class="page-intro">Возможно, адрес изменился. <a class="text-link" href="${href("/")}">Вернуться на главную</a>.</p></section>`, image: "" });
  await writeFile(path.join(out, "404.html"), notFound);
  console.log(`Собрано статей: ${articles.length}. Результат: dist/`);
}

await build();
