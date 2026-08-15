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
    ${item("about", "Обо мне", "/about/")}
  </nav>`;
}

function layout({ title, description, pathname, active, content, type = "website", image = "/og/editorial.png", jsonLd = "" }) {
  const canonical = absolute(pathname);
  const imageUrl = image ? absolute(image) : "";
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="Материалы Елены Рендаревской" href="${absolute("/rss.xml")}">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">` : ""}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ""}
  <link rel="stylesheet" href="${href("/styles.css")}">
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
      <a href="${href("/rss.xml")}">RSS</a>
      <a href="${href("/articles/")}">Архив</a>
    </nav>
  </footer>
</body>
</html>`;
}

function articleRow(article) {
  return `<a class="article-row" href="${href(articlePath(article))}">
    <span class="article-date">${formatDate(article.date)}</span>
    <span>
      <span class="meta">${escapeHtml(article.category)}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.description)}</p>
    </span>
    <span class="article-arrow" aria-hidden="true">↗</span>
  </a>`;
}

function relatedMaterials(article, articles) {
  const slugs = String(article.related || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  if (!slugs.length) {
    return `<div class="related-placeholder"><strong>Связанные материалы</strong><br>Этот блок подготовлен для будущей подборки статей по теме.</div>`;
  }

  const bySlug = new Map(articles.map((item) => [item.slug, item]));
  const related = slugs.map((slug) => {
    const item = bySlug.get(slug);
    if (!item) throw new Error(`Не найдена связанная статья «${slug}» для ${article.slug}`);
    if (item.slug === article.slug) throw new Error(`Статья ${article.slug} не может ссылаться на себя`);
    return item;
  });

  return `<section class="related-materials" aria-labelledby="related-${article.slug}">
    <p class="section-kicker">Продолжить чтение</p>
    <h2 id="related-${article.slug}">Связанные материалы</h2>
    <ul>${related.map((item) => `<li><a href="${href(articlePath(item))}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.description)}</span></li>`).join("")}</ul>
  </section>`;
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
  const latest = articles.slice(0, 5);

  const home = `<section class="shell hero">
    <div>
      <p class="eyebrow">Независимое медиа и архив текстов</p>
      <h1>Елена<br>Рендаревская</h1>
    </div>
    <p class="hero-note">${site.role}. Авторские материалы о решениях, системах и человеке в работе.</p>
  </section>
  <section class="shell section" aria-labelledby="latest-title">
    <div class="section-heading">
      <div><p class="section-kicker">Последнее</p><h2 id="latest-title">Новые материалы</h2></div>
      <a class="text-link" href="${href("/articles/")}">Все статьи</a>
    </div>
    <div class="article-list">${latest.map(articleRow).join("\n") || "<p>Материалы скоро появятся.</p>"}</div>
  </section>
  <section class="shell section" aria-labelledby="topics-title">
    <div class="section-heading"><div><p class="section-kicker">Навигация</p><h2 id="topics-title">Темы</h2></div></div>
    <div class="topics">${categories.map((category) => `<a href="${href(`/topics/${category.slug}/`)}">${category.name}</a>`).join("")}</div>
  </section>`;

  await writePage("/", layout({
    title: site.title,
    description: site.description,
    pathname: "/",
    content: home,
    jsonLd: JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: site.name, url: siteUrl, jobTitle: site.role }),
  }));

  const years = articles.reduce((map, article) => {
    const year = article.date.slice(0, 4);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(article);
    return map;
  }, new Map());
  const archive = `<section class="shell page-header"><p class="eyebrow">Архив</p><h1 class="page-title">Все статьи</h1><p class="page-intro">Материалы по дате: бизнес, финансы, управление, стратегия и человек в работе.</p></section>
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
      mainEntityOfPage: articleUrl(article),
      image: absolute(article.image),
      author: { "@type": "Person", name: site.name },
      publisher: { "@type": "Person", name: site.name },
    });
    const content = `<article>
      <header class="article-header">
        <a class="meta" href="${href(categoryPath(article.category))}">${escapeHtml(article.category)}</a>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-dek">${escapeHtml(article.description)}</p>
        <div class="article-meta"><span><time datetime="${article.date}">${formatDate(article.date)}</time></span><span>${article.minutes} мин чтения</span></div>
      </header>
      <div class="prose">${renderMarkdown(article.body)}</div>
      <footer class="article-footer">
        <a class="text-link" href="${href("/articles/")}">← Все статьи</a>
        <div class="author-block"><div class="author-monogram" aria-hidden="true">ЕР</div><p><strong>${site.name}</strong><br>${site.role}</p></div>
        ${relatedMaterials(article, articles)}
      </footer>
    </article>`;
    await writePage(articlePath(article), layout({ title: `${article.title} — ${site.name}`, description: article.description, pathname: articlePath(article), active: "articles", type: "article", image: article.image, content, jsonLd }));
  }

  for (const category of categories) {
    const items = articles.filter((article) => article.category === category.name);
    const content = `<section class="shell page-header"><p class="eyebrow">Тема</p><h1 class="page-title">${category.name}</h1><p class="page-intro">Публикации по теме «${category.name}».</p></section><section class="shell section"><div class="article-list">${items.length ? items.map(articleRow).join("\n") : "<p>Материалы по этой теме скоро появятся.</p>"}</div></section>`;
    await writePage(`/topics/${category.slug}/`, layout({ title: `${category.name[0].toUpperCase()}${category.name.slice(1)} — ${site.name}`, description: `Авторские материалы Елены Рендаревской по теме «${category.name}».`, pathname: `/topics/${category.slug}/`, active: "articles", content }));
  }

  const aboutSource = await readFile(path.join(root, "content/pages/about.md"), "utf8");
  const about = parseFrontMatter(aboutSource, "content/pages/about.md");
  const aboutContent = `<section class="shell page-header"><p class="eyebrow">Автор</p><h1 class="page-title">${escapeHtml(about.data.title)}</h1><p class="page-intro">${site.role}</p></section><section class="shell about-layout"><aside class="about-aside">Временная структура страницы. Текст можно заменить в одном Markdown-файле.</aside><div class="prose">${renderMarkdown(about.body)}</div></section>`;
  await writePage("/about/", layout({ title: `${about.data.title} — ${site.name}`, description: about.data.description, pathname: "/about/", active: "about", content: aboutContent }));

  const urls = ["/", "/articles/", "/about/", ...articles.map(articlePath), ...categories.map((category) => `/topics/${category.slug}/`)];
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
