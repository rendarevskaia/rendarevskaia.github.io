import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), "utf8");

test("главная страница содержит имя, навигацию и SEO", async () => {
  const html = await read("index.html");
  assert.match(html, /Елена Рендаревская/);
  assert.match(html, /Новые материалы/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /application\/ld\+json/);
});

test("первая статья собрана со всеми метаданными", async () => {
  const html = await read("articles/wildberries-sellers-capital/index.html");
  assert.match(html, /Склады заработают раньше, чем селлеры вернут потерянные деньги/);
  assert.match(html, /мин чтения/);
  assert.match(html, /og:type" content="article"/);
  assert.match(html, /Связанные материалы/);
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

test("служебные файлы существуют и содержат публичные URL", async () => {
  const [sitemap, robots, rss] = await Promise.all([
    read("sitemap.xml"),
    read("robots.txt"),
    read("rss.xml"),
  ]);
  assert.match(sitemap, /wildberries-sellers-capital/);
  assert.match(robots, /Sitemap:/);
  assert.match(rss, /<rss version="2.0">/);
});
