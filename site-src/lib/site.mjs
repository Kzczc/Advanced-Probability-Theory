/**
 * 生成 docs/ 下的全部网页：首页、每讲目录页、逐页精讲页、基础补课页、术语表、搜索索引。
 * 由 site-src/build.mjs 调用（build.mjs 负责读取内容与校验）。
 */
import fs from "node:fs";
import path from "node:path";
import { escapeHtml } from "./markdown.mjs";

const pad2 = (number) => String(number).padStart(2, "0");

/* ------------------------------------------------------------------ */
/* 文件工具                                                            */
/* ------------------------------------------------------------------ */

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function copyDirectory(source, target, filter = () => true) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to, filter);
    else if (filter(entry.name)) fs.copyFileSync(from, to);
  }
}

/** 清理上一次生成的网页，但保留课件页图（它们由 tools/render_slides.py 生成） */
function cleanOutput(outputDir) {
  if (!fs.existsSync(outputDir)) return;
  for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
    const full = path.join(outputDir, entry.name);
    if (entry.name === "assets") {
      for (const asset of fs.readdirSync(full)) {
        if (asset !== "slides") fs.rmSync(path.join(full, asset), { recursive: true, force: true });
      }
    } else {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
}

/** 从 HTML 中提取纯文本（用于搜索索引） */
function htmlToText(html) {
  return html
    .replace(/<span class="katex-html"[\s\S]*?<\/span>(?=<\/span>)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* 公共片段                                                            */
/* ------------------------------------------------------------------ */

const ICONS = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  focus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M12 5v14"/></svg>',
};

function layout({ root, title, bodyClass, main, topbar, extraHead = "", pageData = null }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="高等概率论课件逐页中文精讲：课件原页对照、零基础补课、公式推导、老师板书解读、例子与自测。">
<link rel="stylesheet" href="${root}assets/katex/katex.min.css">
<link rel="stylesheet" href="${root}assets/css/site.css">
${extraHead}
<script>try{var s=localStorage.getItem("apt-font-scale");if(s)document.documentElement.style.setProperty("--font-scale",s);if(localStorage.getItem("apt-layout")==="focus")document.documentElement.classList.add("focus-mode");}catch(e){}</script>
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">跳到正文</a>
${topbar}
${main}
<div class="lightbox" id="lightbox" hidden><button class="lightbox-close" type="button" aria-label="关闭">关闭 ✕</button><div class="lightbox-stage"><img alt=""></div><p class="lightbox-hint">点击图片放大 / 缩小 · Esc 关闭</p></div>
<div class="term-pop" id="term-pop" role="tooltip" hidden></div>
<div class="search-panel" id="search-panel" hidden>
  <div class="search-box" role="dialog" aria-label="搜索讲义">
    <input id="search-input" type="search" placeholder="搜索：σ-代数、外测度、Fatou、单调收敛……" autocomplete="off">
    <ol id="search-results" class="search-results"></ol>
    <p class="search-hint">↑↓ 选择 · Enter 打开 · Esc 关闭</p>
  </div>
</div>
${pageData ? `<script type="application/json" id="page-data">${JSON.stringify(pageData).replace(/</g, "\\u003c")}</script>` : ""}
<script src="${root}assets/js/site.js" defer></script>
<script src="${root}assets/js/demos.js" defer></script>
</body>
</html>
`;
}

function topbar({ root, topics, currentTopicId, showReaderTools }) {
  const topicLinks = topics
    .map((topic) => `<a href="${root}${topic.id}/index.html"${topic.id === currentTopicId ? ' aria-current="page"' : ""}>第 ${topic.number} 讲</a>`)
    .join("");
  const readerTools = showReaderTools
    ? `<button class="tool-btn" id="toc-toggle" type="button" aria-label="打开本讲目录">${ICONS.menu}<span>目录</span></button>`
    : "";
  return `<header class="topbar">
  <div class="topbar-inner">
    ${readerTools}
    <a class="brand" href="${root}index.html">高等概率论<span>逐页精讲</span></a>
    <nav class="topnav" aria-label="讲次">${topicLinks}<a href="${root}basics.html">基础补课</a><a href="${root}glossary.html">术语表</a></nav>
    <div class="tools">
      <button class="tool-btn" id="search-open" type="button" aria-label="搜索">${ICONS.search}<span>搜索</span></button>
      ${showReaderTools ? `<button class="tool-btn" id="layout-toggle" type="button" aria-pressed="false" title="隐藏 / 显示左侧课件原页">${ICONS.focus}<span class="layout-label">专注阅读</span></button>` : ""}
      <div class="font-tools" role="group" aria-label="字号"><button class="tool-btn" id="font-down" type="button" aria-label="缩小字号">A−</button><button class="tool-btn" id="font-up" type="button" aria-label="放大字号">A+</button></div>
    </div>
  </div>
  <div class="read-progress" aria-hidden="true"><span></span></div>
</header>`;
}

function sectionOf(topic, pageNumber) {
  return (topic.sections || []).find((section) => pageNumber >= section.pages[0] && pageNumber <= section.pages[1]) || null;
}

function pageInfo(topic, pageNumber) {
  const written = topic.pages.get(pageNumber);
  const outline = topic.outline.get(pageNumber) || {};
  const meta = written ? written.meta : {};
  return {
    number: pageNumber,
    written: Boolean(written),
    title: meta.title || outline.title || outline.title_en || `第 ${pageNumber} 页`,
    titleEn: meta.title_en || outline.title_en || "",
    slide: meta.slide || outline.slide || "",
    kind: meta.kind || outline.kind || "",
  };
}

function tocHtml(topic, currentPage) {
  const sections = topic.sections && topic.sections.length ? topic.sections : [{ title: "全部页面", pages: [1, topic.pageCount] }];
  const blocks = sections.map((section) => {
    const items = [];
    for (let number = section.pages[0]; number <= section.pages[1]; number += 1) {
      const info = pageInfo(topic, number);
      const classes = [info.written ? "" : "pending", number === currentPage ? "current" : ""].filter(Boolean).join(" ");
      items.push(`<li${classes ? ` class="${classes}"` : ""} data-page="${number}"><a href="p${pad2(number)}.html"${number === currentPage ? ' aria-current="page"' : ""}><span class="toc-num">${pad2(number)}</span><span class="toc-title">${escapeHtml(info.title)}</span></a></li>`);
    }
    return `<section class="toc-section"><h2>${escapeHtml(section.title)}</h2><ol>${items.join("")}</ol></section>`;
  });
  return `<aside class="toc" id="toc" aria-label="本讲目录">
  <div class="toc-head"><a href="index.html">第 ${topic.number} 讲 · ${escapeHtml(topic.title)}</a><p class="toc-progress" data-topic="${topic.id}" data-total="${topic.pageCount}">已看懂 <b>0</b> / ${topic.pageCount} 页</p></div>
  ${blocks.join("\n")}
</aside>`;
}

/* ------------------------------------------------------------------ */
/* 逐页精讲页                                                          */
/* ------------------------------------------------------------------ */

function readerPageHtml({ topic, topics, pageNumber, rendered, kinds, glossary }) {
  const info = pageInfo(topic, pageNumber);
  const section = sectionOf(topic, pageNumber);
  const size = topic.manifest[`p${pad2(pageNumber)}`] || { width: 1600, height: 1280 };
  const imageSrc = `../assets/slides/${topic.id}/p${pad2(pageNumber)}.webp`;
  const previous = pageNumber > 1 ? pageInfo(topic, pageNumber - 1) : null;
  const next = pageNumber < topic.pageCount ? pageInfo(topic, pageNumber + 1) : null;

  const chips = rendered && rendered.headings.length
    ? `<nav class="chips" aria-label="本页小标题"><span class="chips-label">本页小标题</span>${rendered.headings.map((h) => `<a href="#${h.id}">${escapeHtml(h.text)}</a>`).join("")}</nav>`
    : "";

  const notes = rendered
    ? rendered.html
    : `<div class="pending-note"><p class="pending-title">这一页的精讲正在写作中</p><p>先对照左边的课件原页。课件标题：<em>${escapeHtml(info.titleEn)}</em></p></div>`;

  const usedTerms = rendered ? rendered.usedTerms : [];
  const termData = {};
  for (const id of usedTerms) {
    const entry = glossary.byId.get(id);
    if (entry) termData[id] = { term: entry.term, en: entry.en || "", plain: entry.plain || "", page: entry.page || null };
  }

  const pager = `<nav class="pager" aria-label="翻页">
    ${previous ? `<a class="pager-prev" rel="prev" href="p${pad2(previous.number)}.html"><small>← 上一页 · ${pad2(previous.number)}</small><span>${escapeHtml(previous.title)}</span></a>` : "<span></span>"}
    ${next ? `<a class="pager-next" rel="next" href="p${pad2(next.number)}.html"><small>下一页 · ${pad2(next.number)} →</small><span>${escapeHtml(next.title)}</span></a>` : `<a class="pager-next" href="index.html"><small>本讲结束 →</small><span>回到第 ${topic.number} 讲目录</span></a>`}
  </nav>`;

  const main = `<div class="reader">
${tocHtml(topic, pageNumber)}
<div class="toc-scrim" id="toc-scrim" hidden></div>
<main id="main" class="reader-main" data-topic="${topic.id}" data-page="${pageNumber}" data-prev="${previous ? `p${pad2(previous.number)}.html` : ""}" data-next="${next ? `p${pad2(next.number)}.html` : ""}">
  <header class="page-head">
    <p class="crumbs"><a href="index.html">第 ${topic.number} 讲 ${escapeHtml(topic.title)}</a>${section ? `<span>›</span>${escapeHtml(section.title)}` : ""}</p>
    <div class="badges"><span class="badge">PDF 第 ${pageNumber} / ${topic.pageCount} 页</span>${info.slide ? `<span class="badge">幻灯片 ${escapeHtml(info.slide)}</span>` : ""}${info.kind && kinds[info.kind] ? `<span class="badge badge-kind">${kinds[info.kind]}</span>` : ""}</div>
    <h1>${escapeHtml(info.title)}</h1>
    ${info.titleEn ? `<p class="title-en" lang="en">${escapeHtml(info.titleEn)}</p>` : ""}
    ${chips}
  </header>
  <div class="split">
    <figure class="slide-pane">
      <button class="slide-zoom" type="button" data-full="${imageSrc}" aria-label="放大查看课件原页">
        <img src="${imageSrc}" width="${size.width}" height="${size.height}" alt="课件第 ${pageNumber} 页：${escapeHtml(info.titleEn || info.title)}" decoding="async" fetchpriority="high">
      </button>
      <figcaption>课件原页 · 点击放大 · ← → 键翻页</figcaption>
    </figure>
    <article class="notes prose" id="notes">
${notes}
    </article>
  </div>
  <footer class="page-foot">
    <label class="done-toggle"><input type="checkbox" id="done-box" data-topic="${topic.id}" data-page="${pageNumber}"><span>这一页我看懂了</span></label>
    ${pager}
  </footer>
</main>
</div>`;

  const extraHead = [
    next ? `<link rel="prefetch" href="p${pad2(next.number)}.html">` : "",
    next ? `<link rel="prefetch" href="../assets/slides/${topic.id}/p${pad2(next.number)}.webp" as="image">` : "",
  ].join("\n");

  return layout({
    root: "../",
    title: `${pad2(pageNumber)} ${info.title} · 第${topic.number}讲 · 高等概率论逐页精讲`,
    bodyClass: "page-reader",
    topbar: topbar({ root: "../", topics, currentTopicId: topic.id, showReaderTools: true }),
    main,
    extraHead,
    pageData: { terms: termData, topic: topic.id, page: pageNumber },
  });
}

/* ------------------------------------------------------------------ */
/* 目录页 / 首页 / 术语表 / 基础补课                                    */
/* ------------------------------------------------------------------ */

function topicIndexHtml({ topic, topics, kinds }) {
  const writtenCount = topic.pages.size;
  const sections = (topic.sections && topic.sections.length ? topic.sections : [{ title: "全部页面", pages: [1, topic.pageCount] }]).map((section) => {
    const rows = [];
    for (let number = section.pages[0]; number <= section.pages[1]; number += 1) {
      const info = pageInfo(topic, number);
      rows.push(`<li class="page-row${info.written ? "" : " pending"}" data-page="${number}">
        <a href="p${pad2(number)}.html">
          <span class="row-num">${pad2(number)}</span>
          <span class="row-main"><span class="row-title">${escapeHtml(info.title)}</span><span class="row-en" lang="en">${escapeHtml(info.titleEn)}</span></span>
          <span class="row-meta">${info.slide ? `幻灯片 ${escapeHtml(info.slide)}` : ""}${info.kind && kinds[info.kind] ? ` · ${kinds[info.kind]}` : ""}${info.written ? "" : " · 写作中"}</span>
        </a></li>`);
    }
    return `<section class="index-section"><h2>${escapeHtml(section.title)}${section.title_en ? `<small lang="en">${escapeHtml(section.title_en)}</small>` : ""}</h2><ol class="page-rows">${rows.join("")}</ol></section>`;
  });

  const main = `<main id="main" class="index-main">
  <header class="index-head">
    <p class="eyebrow">第 ${topic.number} 讲 · ${topic.pageCount} 页课件</p>
    <h1>${escapeHtml(topic.title)}</h1>
    <p class="title-en" lang="en">${escapeHtml(topic.english)}</p>
    <p class="lede">${escapeHtml(topic.summary)}</p>
    <div class="index-actions">
      <a class="button primary" href="p01.html">从第 1 页开始</a>
      <a class="button" id="resume-link" href="p01.html" data-topic="${topic.id}" hidden>继续上次的进度</a>
    </div>
    <p class="index-stats">精讲已完成 <b>${writtenCount}</b> / ${topic.pageCount} 页 · <span class="toc-progress" data-topic="${topic.id}" data-total="${topic.pageCount}">已看懂 <b>0</b> / ${topic.pageCount} 页</span></p>
  </header>
  ${sections.join("\n")}
</main>`;
  return layout({
    root: "../",
    title: `第${topic.number}讲 ${topic.title} · 高等概率论逐页精讲`,
    bodyClass: "page-index",
    topbar: topbar({ root: "../", topics, currentTopicId: topic.id, showReaderTools: false }),
    main,
  });
}

function homeHtml({ catalog, topics }) {
  const cards = topics.map((topic) => `<li class="topic-card">
    <a href="${topic.id}/index.html">
      <span class="card-num">第 ${topic.number} 讲</span>
      <strong>${escapeHtml(topic.title)}</strong>
      <em lang="en">${escapeHtml(topic.english)}</em>
      <p>${escapeHtml(topic.summary)}</p>
      <span class="card-meta">精讲 ${topic.pages.size} / ${topic.pageCount} 页${topic.pages.size === 0 ? " · 即将开始" : ""}</span>
      <span class="meter" aria-hidden="true"><span style="width:${((100 * topic.pages.size) / topic.pageCount).toFixed(1)}%"></span></span>
      <span class="toc-progress card-progress" data-topic="${topic.id}" data-total="${topic.pageCount}">已看懂 <b>0</b> / ${topic.pageCount} 页</span>
    </a>
  </li>`).join("");

  const main = `<main id="main" class="home-main">
  <section class="hero">
    <p class="eyebrow" lang="en">${escapeHtml(catalog.site.english)}</p>
    <h1>${escapeHtml(catalog.site.title)}</h1>
    <p class="lede">${escapeHtml(catalog.site.subtitle)}</p>
    <div class="index-actions"><a class="button primary" href="topic1/p01.html">从第 1 讲第 1 页开始</a><a class="button" href="basics.html">先补数学基础</a></div>
  </section>
  <section class="how">
    <h2>怎么用这个网站</h2>
    <ol class="how-steps">
      <li><b>左右对照。</b>左边固定显示课件原页（点击可放大，看清老师的手写），右边是中文精讲。</li>
      <li><b>每页同一个顺序。</b>这一页在讲什么 → 先补基础 → 课件原文逐句精读 → 老师板书在说什么 → 图解 → 例子 → 推导 → 常见疑问 → 小结与自测。顶部的「本页小标题」可以直接跳转。</li>
      <li><b>边读边查。</b>正文里带虚线的术语，鼠标停留（手机上点一下）就会弹出白话解释；右上角「搜索」或按 <kbd>/</kbd> 可以搜全站。</li>
      <li><b>记录进度。</b>看懂一页就勾选页面底部的「这一页我看懂了」，首页和目录会显示进度；<kbd>←</kbd> <kbd>→</kbd> 键翻页。</li>
    </ol>
  </section>
  <ol class="topic-cards">${cards}</ol>
  <section class="extra-cards">
    <a class="extra-card" href="basics.html"><strong>基础补课</strong><span>集合、函数、上确界、极限、级数、可数性……测度论需要的最少背景，一次讲清。</span></a>
    <a class="extra-card" href="glossary.html"><strong>术语表</strong><span>中英对照 + 白话解释，并标出每个术语第一次出现在哪一页。</span></a>
  </section>
</main>`;
  return layout({
    root: "",
    title: `${catalog.site.title} · ${catalog.site.english}`,
    bodyClass: "page-home",
    topbar: topbar({ root: "", topics, currentTopicId: "", showReaderTools: false }),
    main,
  });
}

function glossaryHtml({ topics, glossary }) {
  const rows = glossary.entries.map((entry) => {
    const pageLink = entry.page ? `<a href="topic1/p${pad2(entry.page)}.html">第 1 讲 p${pad2(entry.page)}</a>` : "";
    return `<li class="glossary-row" id="term-${escapeHtml(entry.id)}" data-search="${escapeHtml([entry.term, ...(entry.aliases || []), entry.en, entry.plain].join(" ").toLowerCase())}">
      <div class="g-term"><strong>${escapeHtml(entry.term)}</strong><span lang="en">${escapeHtml(entry.en || "")}</span></div>
      <p class="g-plain">${escapeHtml(entry.plain || "")}</p>
      <p class="g-page">${pageLink}</p>
    </li>`;
  }).join("");
  const main = `<main id="main" class="index-main">
  <header class="index-head">
    <p class="eyebrow">Glossary</p>
    <h1>术语表</h1>
    <p class="lede">每个术语：中文 · 英文原词 · 一句白话解释 · 第一次出现的页面。讲义正文里带虚线的词，就是这里的术语。</p>
    <input class="glossary-filter" id="glossary-filter" type="search" placeholder="筛选术语：输入中文或英文">
  </header>
  <ol class="glossary-list" id="glossary-list">${rows || "<li>术语表正在整理中。</li>"}</ol>
</main>`;
  return layout({
    root: "",
    title: "术语表 · 高等概率论逐页精讲",
    bodyClass: "page-glossary",
    topbar: topbar({ root: "", topics, currentTopicId: "", showReaderTools: false }),
    main,
  });
}

function basicsHtml({ topics, rendered }) {
  const chips = rendered && rendered.headings.length
    ? `<nav class="chips" aria-label="小标题"><span class="chips-label">目录</span>${rendered.headings.map((h) => `<a href="#${h.id}">${escapeHtml(h.text)}</a>`).join("")}</nav>`
    : "";
  const main = `<main id="main" class="basics-main">
  <header class="index-head">
    <p class="eyebrow">Prerequisites</p>
    <h1>基础补课：读懂测度论需要的最少数学</h1>
    <p class="lede">不需要一次读完。讲义里遇到不懂的符号或概念时，回到这里查对应的小节。</p>
    ${chips}
  </header>
  <article class="notes prose basics-prose">
${rendered ? rendered.html : "<p>基础补课正在写作中。</p>"}
  </article>
</main>`;
  return layout({
    root: "",
    title: "基础补课 · 高等概率论逐页精讲",
    bodyClass: "page-basics",
    topbar: topbar({ root: "", topics, currentTopicId: "", showReaderTools: false }),
    main,
    pageData: { terms: rendered ? rendered.termData : {} },
  });
}

/* ------------------------------------------------------------------ */
/* 总装                                                                */
/* ------------------------------------------------------------------ */

export function buildSite({ catalog, topics, glossary, renderPage, pageTitleMap, checks, paths, kinds, markdown, report }) {
  const { SITE_SRC, CONTENT_DIR, OUTPUT_DIR } = paths;
  cleanOutput(OUTPUT_DIR);
  writeFile(path.join(OUTPUT_DIR, ".nojekyll"), "");

  // 静态资源：样式、脚本、KaTeX 的 CSS 与字体（KaTeX 的 JS 不再需要，公式已在构建时排好）
  copyDirectory(path.join(SITE_SRC, "assets", "css"), path.join(OUTPUT_DIR, "assets", "css"));
  copyDirectory(path.join(SITE_SRC, "assets", "js"), path.join(OUTPUT_DIR, "assets", "js"));
  fs.mkdirSync(path.join(OUTPUT_DIR, "assets", "katex"), { recursive: true });
  fs.copyFileSync(path.join(SITE_SRC, "assets", "katex", "katex.min.css"), path.join(OUTPUT_DIR, "assets", "katex", "katex.min.css"));
  copyDirectory(path.join(SITE_SRC, "assets", "katex", "fonts"), path.join(OUTPUT_DIR, "assets", "katex", "fonts"), (name) => name.endsWith(".woff2") || name.endsWith(".woff"));

  const searchIndex = [];

  for (const topic of topics) {
    const titles = pageTitleMap(topic);

    for (let pageNumber = 1; pageNumber <= topic.pageCount; pageNumber += 1) {
      const page = topic.pages.get(pageNumber);
      let rendered = null;
      if (page) {
        checks.checkFrontMatter(topic, page);
        checks.checkContainers(page);
        rendered = renderPage(topic, page, glossary, titles);
        checks.checkQuality(page, rendered.html);
        const info = pageInfo(topic, pageNumber);
        searchIndex.push({
          u: `${topic.id}/p${pad2(pageNumber)}.html`,
          t: info.title,
          e: info.titleEn,
          k: `第${topic.number}讲 · p${pad2(pageNumber)}`,
          h: rendered.headings.map((h) => h.text).join(" / "),
          x: htmlToText(rendered.html).slice(0, 6000),
        });
      }
      const html = readerPageHtml({ topic, topics, pageNumber, rendered, kinds, glossary });
      writeFile(path.join(OUTPUT_DIR, topic.id, `p${pad2(pageNumber)}.html`), html);
    }
    writeFile(path.join(OUTPUT_DIR, topic.id, "index.html"), topicIndexHtml({ topic, topics, kinds }));
  }

  writeFile(path.join(OUTPUT_DIR, "index.html"), homeHtml({ catalog, topics }));
  writeFile(path.join(OUTPUT_DIR, "glossary.html"), glossaryHtml({ topics, glossary }));

  // 基础补课页（content/basics.md）
  const basicsFile = path.join(CONTENT_DIR, "basics.md");
  let basicsRendered = null;
  if (fs.existsSync(basicsFile)) {
    const source = fs.readFileSync(basicsFile, "utf8");
    const env = {
      headings: [],
      usedTerms: new Set(),
      glossaryMatchers: glossary.matchers,
      report: (level, needle, message) => report(level, basicsFile, 0, message),
      topicNumber: 1,
      pageTitles: pageTitleMap(topics[0]),
    };
    const html = markdown.render(source, env);
    const termData = {};
    for (const id of env.usedTerms) {
      const entry = glossary.byId.get(id);
      if (entry) termData[id] = { term: entry.term, en: entry.en || "", plain: entry.plain || "", page: entry.page || null };
    }
    basicsRendered = { html: html.replace(/href="p(\d\d)\.html"/g, 'href="topic1/p$1.html"'), headings: env.headings, termData };
    searchIndex.push({ u: "basics.html", t: "基础补课", e: "Prerequisites", k: "基础补课", h: env.headings.map((h) => h.text).join(" / "), x: htmlToText(html).slice(0, 12000) });
  }
  writeFile(path.join(OUTPUT_DIR, "basics.html"), basicsHtml({ topics, rendered: basicsRendered }));

  for (const entry of glossary.entries) {
    searchIndex.push({ u: `glossary.html#term-${entry.id}`, t: entry.term, e: entry.en || "", k: "术语表", h: "", x: entry.plain || "" });
  }
  writeFile(path.join(OUTPUT_DIR, "assets", "search.json"), JSON.stringify(searchIndex));

  console.log(`已生成网站：${path.relative(paths.REPO_ROOT, OUTPUT_DIR)}/（${topics.map((t) => `${t.id} ${t.pages.size}/${t.pageCount} 页精讲`).join("，")}）`);
}
