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
