#!/usr/bin/env node
/**
 * 高等概率论逐页精讲 —— 网站构建脚本
 *
 * 读取 content/ 下的 Markdown 讲义，生成 docs/ 下的静态网站（GitHub Pages 直接发布 docs/）。
 * 公式在构建时就用 KaTeX 排好版，浏览器只加载 CSS 和字体，不再现场计算公式。
 * 所有依赖都在 site-src/vendor/ 里，不需要 npm install，也不需要联网。
 *
 * 用法：
 *   node site-src/build.mjs                         构建整个网站
 *   node site-src/build.mjs --check                 只检查全部讲义（公式、卡片容器、页眉信息），不写文件
 *   node site-src/build.mjs --check --pages 6-14    只检查第 1 讲的第 6–14 页
 *   node site-src/build.mjs --check --topic topic2 --pages 3,5
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createMarkdownRenderer, CONTAINER_KINDS } from "./lib/markdown.mjs";

const require = createRequire(import.meta.url);
const yaml = require("./vendor/js-yaml.min.cjs");

const SITE_SRC = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SITE_SRC, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content");
const OUTPUT_DIR = path.join(REPO_ROOT, "docs");

/** 页面类型：导航类页面讲解可以短一些，内容类页面必须完整 */
export const PAGE_KINDS = Object.freeze({
  cover: "封面",
  goals: "学习目标",
  contents: "目录",
  roadmap: "路线图",
  definition: "定义",
  remark: "讨论",
  theorem: "定理",
  proof: "证明",
  example: "例子",
  figure: "图解",
  notes: "板书续页",
  summary: "总结",
});
const NAVIGATION_KINDS = new Set(["cover", "goals", "contents", "roadmap"]);
const REQUIRED_FIELDS = ["topic", "page", "slide", "title", "title_en", "kind"];
const MIN_CHINESE_CHARACTERS = 1500;

/* ------------------------------------------------------------------ */
/* 读取内容                                                            */
/* ------------------------------------------------------------------ */

const issues = [];

function report(level, file, line, message) {
  issues.push({ level, file: path.relative(REPO_ROOT, file), line, message });
}

function readYaml(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return yaml.load(fs.readFileSync(file, "utf8"));
}

function pad2(number) {
  return String(number).padStart(2, "0");
}

function splitFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!match) return { data: null, body: source, bodyStartLine: 1, error: "文件开头缺少 --- 包起来的页眉信息（front matter）" };
  try {
    return {
      data: yaml.load(match[1]) || {},
      body: source.slice(match[0].length),
      bodyStartLine: match[0].split("\n").length,
    };
  } catch (error) {
    return { data: null, body: source.slice(match[0].length), bodyStartLine: match[0].split("\n").length, error: `页眉 YAML 格式错误：${error.message}` };
  }
}

function loadTopic(topic) {
  const topicDir = path.join(CONTENT_DIR, topic.id);
  const outline = readYaml(path.join(topicDir, "_outline.yaml"), { pages: [] });
  const manifest = readYaml(path.join(OUTPUT_DIR, "assets", "slides", topic.id, "manifest.json"), {});
  const pages = new Map();
  if (fs.existsSync(topicDir)) {
    for (const name of fs.readdirSync(topicDir).sort()) {
      if (!/^p\d{2}\.md$/.test(name)) continue;
      const file = path.join(topicDir, name);
      const source = fs.readFileSync(file, "utf8");
      const { data, body, bodyStartLine, error } = splitFrontMatter(source);
      const pageNumber = Number(name.slice(1, 3));
      if (error) report("error", file, 1, error);
      pages.set(pageNumber, { file, source, meta: data || {}, body, bodyStartLine, pageNumber });
    }
  }
  const outlineByPage = new Map((outline.pages || []).map((entry) => [Number(entry.page), entry]));
  return {
    ...topic,
    pageCount: Number(topic.pages),
    sections: outline.sections || [],
    outline: outlineByPage,
    pages,
    manifest,
  };
}

function loadGlossary() {
  const entries = readYaml(path.join(CONTENT_DIR, "glossary.yaml"), []) || [];
  const matchers = [];
  for (const entry of entries) {
    for (const text of [entry.term, ...(entry.aliases || [])]) {
      if (text && /[\u4e00-\u9fff]/.test(text)) matchers.push({ id: entry.id, text });
    }
  }
  matchers.sort((a, b) => b.text.length - a.text.length);
  return { entries, byId: new Map(entries.map((entry) => [entry.id, entry])), matchers };
}

/* ------------------------------------------------------------------ */
/* 校验                                                                */
/* ------------------------------------------------------------------ */

function lineOf(page, needle) {
  if (!needle) return 0;
  const index = page.source.indexOf(String(needle).slice(0, 40));
  return index < 0 ? 0 : page.source.slice(0, index).split("\n").length;
}

function checkFrontMatter(topic, page) {
  const meta = page.meta;
  for (const field of REQUIRED_FIELDS) {
    if (meta[field] === undefined || meta[field] === null || meta[field] === "") {
      report("error", page.file, 1, `页眉缺少字段 ${field}`);
    }
  }
  if (meta.page !== undefined && Number(meta.page) !== page.pageNumber) {
    report("error", page.file, 1, `页眉 page: ${meta.page} 与文件名 p${pad2(page.pageNumber)}.md 不一致`);
  }
  if (meta.topic && meta.topic !== topic.id) report("error", page.file, 1, `页眉 topic: ${meta.topic} 应为 ${topic.id}`);
  if (meta.kind && !PAGE_KINDS[meta.kind]) {
    report("error", page.file, 1, `未知的 kind: ${meta.kind}（可选：${Object.keys(PAGE_KINDS).join(" / ")}）`);
  }
  if (meta.title && /\$/.test(meta.title)) report("warn", page.file, 1, "title 里不要写 $公式$，请直接用 σ、Ω、μ 等 Unicode 字符");
}

function checkContainers(page) {
  const stack = [];
  let insideFence = false;
  page.body.split("\n").forEach((line, index) => {
    const lineNumber = page.bodyStartLine + index;
    if (/^\s*(```|~~~)/.test(line)) {
      insideFence = !insideFence;
      return;
    }
    if (insideFence) return;
    // 表格行里公式中的 | 会被当成单元格分隔符，把表格拆坏
    if (/^\s*\|/.test(line)) {
      for (const formula of line.match(/\$[^$]+\$/g) || []) {
        if (/(^|[^\\])\|/.test(formula)) {
          report("error", page.file, lineNumber, `表格里的公式含有 |，会把表格拆坏，请改用 \\lvert … \\rvert（绝对值）或 \\mid（条件竖线）：${formula.slice(0, 50)}`);
        }
      }
    }
    const open = line.match(/^\s*(:{3,})\s*([A-Za-z]+)(.*)$/);
    const close = line.match(/^\s*(:{3,})\s*$/);
    if (open) {
      if (!CONTAINER_KINDS[open[2]]) {
        report("error", page.file, lineNumber, `未知的卡片种类「${open[2]}」（可选：${Object.keys(CONTAINER_KINDS).join(" / ")}）`);
      }
      stack.push({ markerLength: open[1].length, kind: open[2], lineNumber });
    } else if (close) {
      const top = stack[stack.length - 1];
      if (!top) report("error", page.file, lineNumber, "多出来的 ::: 关闭行（前面没有对应的开头）");
      else if (close[1].length < top.markerLength) {
        report("error", page.file, lineNumber, `卡片 ${top.kind}（第 ${top.lineNumber} 行，用了 ${top.markerLength} 个冒号开头）必须用至少同样多的冒号关闭`);
        stack.pop();
      } else stack.pop();
    }
  });
  for (const open of stack) report("error", page.file, open.lineNumber, `卡片 ${open.kind} 没有用 ::: 关闭`);
}

function countChinese(text) {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

function checkQuality(page, renderedHtml) {
  const meta = page.meta;
  const body = page.body;
  if (/\\\(|\\\[/.test(body)) report("warn", page.file, lineOf(page, "\\("), "请用 $…$ / $$…$$，不要用 \\( \\) 或 \\[ \\]");
  for (const phrase of ["TODO", "待补充", "此处省略", "（略）", "见左图", "详见课件"]) {
    if (body.includes(phrase)) report("warn", page.file, lineOf(page, phrase), `出现了「${phrase}」——讲义必须把内容写出来`);
  }
  const strayDollar = renderedHtml.replace(/<[^>]+>/g, "").match(/[^\\]\$/);
  if (strayDollar) report("warn", page.file, 0, "渲染后仍有单独的 $，可能有公式没闭合或 $ 内侧有空格");
  if (NAVIGATION_KINDS.has(meta.kind)) return;

  const chineseCount = countChinese(body);
  if (chineseCount < MIN_CHINESE_CHARACTERS) {
    report("warn", page.file, 0, `讲解偏短：只有 ${chineseCount} 个汉字（内容页建议 ≥ ${MIN_CHINESE_CHARACTERS}）`);
  }
  const hasContainer = (kind) => new RegExp(`^\\s*:{3,}\\s*${kind}\\b`, "m").test(body);
  if (!hasContainer("ex")) report("warn", page.file, 0, "没有 ::: ex 例子卡片");
  if (!hasContainer("quiz")) report("warn", page.file, 0, "没有 ::: quiz 自测卡片");
  if (!hasContainer("sum")) report("warn", page.file, 0, "没有 ::: sum 小结卡片");
  const handwrittenOnly = meta.kind === "notes" || (meta.kind === "summary" && meta.slide === "—");
  if (!handwrittenOnly && !hasContainer("original")) report("warn", page.file, 0, "没有 ::: original 课件原文卡片");
}

/* ------------------------------------------------------------------ */
/* 渲染单页                                                            */
/* ------------------------------------------------------------------ */

const markdown = createMarkdownRenderer();

function pageTitleMap(topic) {
  const titles = new Map();
  for (const [number, entry] of topic.outline) titles.set(number, entry.title || entry.title_en);
  for (const [number, page] of topic.pages) if (page.meta.title) titles.set(number, page.meta.title);
  return titles;
}

function slideImageFor(topic, root) {
  return (pageNumber) => {
    const size = topic.manifest[`p${pad2(pageNumber)}`];
    if (!size) return null;
    return { src: `${root}assets/slides/${topic.id}/p${pad2(pageNumber)}.webp`, width: size.width, height: size.height };
  };
}

function renderPage(topic, page, glossary, titles) {
  const env = {
    topicNumber: topic.number,
    pageNumber: page.pageNumber,
    headings: [],
    usedTerms: new Set(),
    glossaryMatchers: glossary.matchers,
    pageTitles: titles,
    slideImage: slideImageFor(topic, "../"),
    report: (level, needle, message) => report(level, page.file, lineOf(page, needle), message),
  };
  const html = markdown.render(page.body, env);
  return { html, headings: env.headings, usedTerms: [...env.usedTerms] };
}

/* ------------------------------------------------------------------ */
/* 命令行                                                              */
/* ------------------------------------------------------------------ */

function parsePageList(spec) {
  const pages = new Set();
  for (const part of String(spec || "").split(",")) {
    if (!part.trim()) continue;
    const [first, last] = part.split("-").map((value) => Number(value.trim()));
    for (let page = first; page <= (last || first); page += 1) pages.add(page);
  }
  return pages;
}

function parseArguments(argv) {
  const options = { check: false, topicId: null, pages: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--topic") options.topicId = argv[++index];
    else if (argument === "--pages") options.pages = parsePageList(argv[++index]);
  }
  if (options.pages && !options.topicId) options.topicId = "topic1";
  return options;
}

function printIssues() {
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warn");
  for (const issue of [...errors, ...warnings]) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    console.log(`${issue.level === "error" ? "✗ 错误" : "! 提醒"}  ${location}  ${issue.message}`);
  }
  console.log(`\n共 ${errors.length} 个错误，${warnings.length} 个提醒。`);
  return errors.length;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const catalog = readYaml(path.join(CONTENT_DIR, "topics.yaml"));
  const glossary = loadGlossary();
  const topics = catalog.topics.map(loadTopic);

  if (options.check) {
    let checkedCount = 0;
    for (const topic of topics) {
      if (options.topicId && topic.id !== options.topicId) continue;
      const titles = pageTitleMap(topic);
      for (const page of topic.pages.values()) {
        if (options.pages && !options.pages.has(page.pageNumber)) continue;
        checkFrontMatter(topic, page);
        checkContainers(page);
        const { html } = renderPage(topic, page, glossary, titles);
        checkQuality(page, html);
        checkedCount += 1;
      }
    }
    console.log(`已检查 ${checkedCount} 页。`);
    process.exit(printIssues() > 0 ? 1 : 0);
  }

  const { buildSite } = await import("./lib/site.mjs");
  buildSite({
    catalog,
    topics,
    glossary,
    renderPage,
    pageTitleMap,
    checks: { checkFrontMatter, checkContainers, checkQuality },
    paths: { REPO_ROOT, SITE_SRC, CONTENT_DIR, OUTPUT_DIR },
    kinds: PAGE_KINDS,
    markdown,
    report,
  });
  const errorCount = printIssues();
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
