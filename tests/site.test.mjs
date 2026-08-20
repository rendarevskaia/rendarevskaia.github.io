import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), "utf8");

test("главная страница содержит имя, навигацию и SEO", async () => {
  const html = await read("index.html");
  assert.match(html, /Елена Рендаревская/);
  assert.match(html, /Разбираю, как предпринимателям принимать финансовые и управленческие решения/);
  assert.match(html, /С чего начать/);
  assert.match(html, /Главные материалы/);
  assert.match(html, /Новые материалы/);
  assert.match(html, /Подписаться в Telegram/);
  assert.match(html, /Три направления/);
  assert.match(html, /images\/brand\/elena-editorial-hero\.webp/);
  assert.match(html, /class="section section-band"/);
  assert.match(html, /styles\.css\?v=20260815-management-cycle/);
  assert.doesNotMatch(html, /topics\/biznes\//);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /rel="icon"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"WebSite"/);
  assert.match(html, /"@type":"CollectionPage"/);
  assert.match(html, /"alternateName":"Elena Rendarevskaya"/);
});

test("страница автора содержит биографию, фотографию и ProfilePage", async () => {
  const html = await read("about/index.html");
  assert.match(html, /<h1 class="page-title">Елена Рендаревская<\/h1>/);
  assert.match(html, /с 2005 года/);
  assert.match(html, /оборотом более 100 млн рублей/);
  assert.match(html, /images\/elena-rendarevskaya\.jpg/);
  assert.match(html, /class="about-portrait-frame"/);
  assert.match(html, /"@type":"ProfilePage"/);
  assert.match(html, /"sameAs":\["https:\/\/network\.tochka\.com\/expert\/64\/"/);
  assert.match(html, /href="https:\/\/t\.me\/rendarevskaya"/);
  assert.match(html, /href="https:\/\/pro\.rbc\.ru\/demo\/65c44e4c9a794727f4f4f595"/);
});

test("первая статья собрана со всеми метаданными", async () => {
  const html = await read("articles/wildberries-sellers-capital/index.html");
  assert.match(html, /Склады заработают раньше, чем селлеры вернут потерянные деньги/);
  assert.match(html, /мин чтения/);
  assert.match(html, /og:type" content="article"/);
  assert.match(html, /article:published_time" content="2026-08-15"/);
  assert.match(html, /article:section" content="финансы"/);
  assert.match(html, /property="og:image" content="https:\/\/rendarevskaia\.github\.io\/og\/wildberries-sellers-capital\.png"/);
  assert.match(html, /Связанные материалы/);
  assert.match(html, /Новые тексты — в Telegram/);
  assert.match(html, /Подписаться/);
  assert.match(html, /Обсудить задачу/);
  assert.doesNotMatch(html, /Этот блок подготовлен для будущей подборки/);
  assert.match(html, /<article>/);
  assert.match(html, /Источники и документы/);
  assert.match(
    html,
    /href="https:\/\/www\.consultant\.ru\/document\/cons_doc_LAW_9027\/3eacab31c1963cdd60b71d21e403cf23450c07ca\/"/,
  );
  assert.doesNotMatch(html, /href="[^"]*<em>/);
});

test("эссе «Шуба» опубликовано с фотографией и отдельной OG-обложкой", async () => {
  const [html, archive, topic] = await Promise.all([
    read("articles/shuba/index.html"),
    read("articles/index.html"),
    read("topics/myshlenie/index.html"),
  ]);
  assert.match(html, /<h1>Шуба<\/h1>/);
  assert.match(html, /src="\/images\/articles\/shuba\.jpg"/);
  assert.match(html, /property="og:image" content="https:\/\/rendarevskaia\.github\.io\/og\/shuba\.png"/);
  assert.match(html, /Июнь 2026\. Москва - Кипр\./);
  assert.match(archive, /articles\/shuba\//);
  assert.match(topic, /articles\/shuba\//);
});

test("разбор «Озарка» опубликован в теме «управление»", async () => {
  const [html, archive, topic] = await Promise.all([
    read("articles/ozark-dlya-predprinimateley/index.html"),
    read("articles/index.html"),
    read("topics/upravlenie/index.html"),
  ]);
  assert.match(html, /<h1>«Озарк» для предпринимателей: теория систем в действии<\/h1>/);
  assert.match(html, /src="\/og\/ozark\.png"/);
  assert.match(html, /property="og:image" content="https:\/\/rendarevskaia\.github\.io\/og\/ozark\.png"/);
  assert.match(html, /href="https:\/\/t\.me\/elena_rendarevskaya"/);
  assert.match(archive, /articles\/ozark-dlya-predprinimateley\//);
  assert.match(topic, /articles\/ozark-dlya-predprinimateley\//);
});

test("цикл о когнитивных искажениях опубликован и связан между собой", async () => {
  const [hub, first, second, third, archive, topic] = await Promise.all([
    read("articles/kognitivnye-iskazheniya-v-biznese/index.html"),
    read("articles/predprinimatel-protiv-effekta-tolpy/index.html"),
    read("articles/novosti-keisy-i-iskazhennaya-strategiya/index.html"),
    read("articles/plohie-resheniya-i-chuzhie-ramki/index.html"),
    read("articles/index.html"),
    read("topics/myshlenie/index.html"),
  ]);
  assert.match(hub, /Шесть ловушек мышления/);
  assert.match(hub, /t\.me\/NeProstoBizness\/48/);
  assert.match(first, /Эффект толпы/);
  assert.match(second, /Ошибка выжившего/);
  assert.match(third, /Эскалация обязательств/);
  assert.match(first, /class="related-materials"/);
  assert.match(archive, /kognitivnye-iskazheniya-v-biznese/);
  assert.match(topic, /plohie-resheniya-i-chuzhie-ramki/);
});

test("служебные файлы существуют и содержат публичные URL", async () => {
  const [sitemap, robots, rss] = await Promise.all([
    read("sitemap.xml"),
    read("robots.txt"),
    read("rss.xml"),
  ]);
  assert.match(sitemap, /wildberries-sellers-capital/);
  assert.match(sitemap, /topics\/finansy\//);
  assert.match(sitemap, /topics\/issledovaniya\//);
  assert.match(sitemap, /topics\/strategiya\//);
  assert.match(sitemap, /topics\/predprinimatelstvo\//);
  assert.match(sitemap, /topics\/chelovek-i-rabota\//);
  assert.doesNotMatch(sitemap, /topics\/biznes\//);
  assert.match(robots, /Sitemap:/);
  assert.match(rss, /<rss version="2.0">/);
});

test("пустые темы доступны для будущих материалов, но не индексируются", async () => {
  const [emptyTopic, populatedTopic] = await Promise.all([
    read("topics/biznes/index.html"),
    read("topics/finansy/index.html"),
  ]);
  assert.match(emptyTopic, /name="robots" content="noindex,follow"/);
  assert.doesNotMatch(populatedTopic, /name="robots" content="noindex/);
});

test("каждая статья ведёт к подписке и реальным связанным материалам", async () => {
  const directory = new URL("../dist/articles/", import.meta.url);
  const articles = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const slug of articles) {
    const html = await read(`articles/${slug}/index.html`);
    assert.match(html, /class="reader-cta"/, slug);
    assert.match(html, /class="related-materials"/, slug);
    assert.doesNotMatch(html, /будущей подборки/, slug);
  }
});

test("все статьи имеют собственные изображения для Telegram", async () => {
  const directory = new URL("../dist/articles/", import.meta.url);
  const slugs = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const slug of slugs) {
    const html = await read(`articles/${slug}/index.html`);
    const match = html.match(/property="og:image" content="https:\/\/rendarevskaia\.github\.io(\/og\/[^"?]+\.png)"/);
    assert.ok(match, `${slug}: не найдено собственное изображение Open Graph`);
    assert.notEqual(match[1], "/og/editorial.png", `${slug}: используется общая обложка`);
    await assert.doesNotReject(access(new URL(`../public${match[1]}`, import.meta.url)), slug);
  }
});

test("файл подтверждения Google публикуется в корне сайта", async () => {
  const verification = await read("google1b27122ea4d5af23.html");
  assert.equal(verification.trim(), "google-site-verification: google1b27122ea4d5af23.html");
});

test("статья о цикле встреч связана с рабочим шаблоном", async () => {
  const [article, sourceArticle, resource, template, sitemap] = await Promise.all([
    read("articles/tsikl-upravlencheskih-vstrech/index.html"),
    read("articles/nalog-na-neupravlyaemost/index.html"),
    read("materials/standart-upravlencheskih-vstrech/index.html"),
    read("templates/standart-upravlencheskih-vstrech.md"),
    read("sitemap.xml"),
  ]);
  assert.match(article, /Четыре уровня управленческого ритма/);
  assert.match(article, /class="article-resource"/);
  assert.match(article, /href="\/materials\/standart-upravlencheskih-vstrech\/"/);
  assert.match(sourceArticle, /ритм управленческих встреч и критерии вопросов/);
  assert.match(sourceArticle, /href="\/articles\/tsikl-upravlencheskih-vstrech\/"/);
  assert.match(resource, /Практический инструмент/);
  assert.match(resource, /Скачать шаблон в Markdown/);
  assert.match(resource, /href="\/templates\/standart-upravlencheskih-vstrech\.md" download/);
  assert.match(template, /## Карточка встречи/);
  assert.match(template, /## Протокол решения/);
  assert.match(sitemap, /materials\/standart-upravlencheskih-vstrech\//);
});

test("статья о спиральной динамике опубликована с памяткой и связана с управленческим циклом", async () => {
  const [article, cycle, archive, topic, sitemap] = await Promise.all([
    read("articles/spiralnaya-dinamika-v-upravlenii/index.html"),
    read("articles/tsikl-upravlencheskih-vstrech/index.html"),
    read("articles/index.html"),
    read("topics/upravlenie/index.html"),
    read("sitemap.xml"),
  ]);
  assert.match(article, /Не цвет человека, а логика решения/);
  assert.match(article, /Как спиральная динамика связана с управленческим циклом/);
  assert.match(article, /href="\/articles\/tsikl-upravlencheskih-vstrech\/"/);
  assert.match(article, /href="\/materials\/spiralnaya-dinamika-pamyatka\.pdf" download/);
  assert.match(article, /Скачать памятку в PDF/);
  assert.match(cycle, /href="\/articles\/spiralnaya-dinamika-v-upravlenii\/"/);
  assert.match(archive, /articles\/spiralnaya-dinamika-v-upravlenii\//);
  assert.match(topic, /articles\/spiralnaya-dinamika-v-upravlenii\//);
  assert.match(sitemap, /articles\/spiralnaya-dinamika-v-upravlenii\//);
  await assert.doesNotReject(access(new URL("../dist/materials/spiralnaya-dinamika-pamyatka.pdf", import.meta.url)));
});

test("внутренние ссылки ведут на собранные страницы и файлы", async () => {
  const dist = new URL("../dist/", import.meta.url);
  const files = (await readdir(dist, { recursive: true })).filter((file) => file.endsWith(".html"));

  for (const file of files) {
    const html = await readFile(new URL(file, dist), "utf8");
    for (const match of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = match[1];
      const target = href === "/" ? "index.html" : href.endsWith("/") ? `${href.slice(1)}index.html` : href.slice(1);
      await assert.doesNotReject(access(new URL(target, dist)), `${file}: не найдена ссылка ${href}`);
    }
  }
});
