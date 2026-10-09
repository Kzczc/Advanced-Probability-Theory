/**
 * 生成 docs/ 下的全部网页：首页、每讲目录页、逐页精讲页、基础补课页、术语表、搜索索引。
 * 由 site-src/build.mjs 调用（build.mjs 负责读取内容与校验）。
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { escapeHtml } from "./markdown.mjs";
import { isExerciseCollection, topicLabel, unitName } from "./collections.mjs";

/** 样式与脚本的版本号（按文件内容计算）：内容变了链接就变，浏览器不会继续用缓存里的旧文件 */
let assetVersion = "dev";
function computeAssetVersion(siteSrc) {
  const hash = crypto.createHash("sha1");
  for (const relative of ["assets/css/site.css", "assets/js/site.js", "assets/js/demos.js"]) {
    hash.update(fs.readFileSync(path.join(siteSrc, relative)));
  }
  return hash.digest("hex").slice(0, 10);
}

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
    .replace(/<span class="box-kind">[^<]*<\/span>/g, " ")
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
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
};

/** 站点信息（content/topics.yaml 的 site 段），buildSite 开始时设置 */
let siteInfo = { title: "高等概率论 · 逐页精讲", url: "", repo: "" };

const DEFAULT_DESCRIPTION = "高等概率论课件逐页中文精讲：课件原页对照、零基础补课、公式推导、老师板书解读、例子与自测；作业与小测逐题精讲，逐行订正原解答。";

function siteFooter(root) {
  const repoLinks = siteInfo.repo
    ? `<a href="${siteInfo.repo}" target="_blank" rel="noopener">GitHub 仓库</a><a href="${siteInfo.repo}/issues" target="_blank" rel="noopener">反馈问题</a>`
    : "";
  return `<footer class="site-foot">
  <div class="site-foot-inner">
    <a class="foot-brand" href="${root}index.html">${escapeHtml(siteInfo.title)}</a>
    <nav class="foot-links" aria-label="站点信息"><a href="${root}about.html">关于本站</a><a href="${root}basics.html">基础补课</a><a href="${root}glossary.html">术语表</a>${repoLinks}</nav>
    <p class="foot-note">讲解如与老师课堂不同，以老师为准 · 阅读进度只保存在你自己的浏览器里</p>
  </div>
</footer>`;
}

function layout({ root, title, bodyClass, main, topbar, extraHead = "", pageData = null, description = DEFAULT_DESCRIPTION, pagePath = "" }) {
  const absoluteUrl = siteInfo.url ? `${siteInfo.url}${pagePath}` : "";
  const shareMeta = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(siteInfo.title)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    absoluteUrl ? `<meta property="og:url" content="${escapeHtml(absoluteUrl)}">` : "",
    siteInfo.url ? `<meta property="og:image" content="${siteInfo.url}assets/img/og.png">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
  ].filter(Boolean).join("\n");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${shareMeta}
<meta name="theme-color" content="#2f3b9c">
<link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/katex/katex.min.css">
<link rel="stylesheet" href="${root}assets/css/site.css?v=${assetVersion}">
${extraHead}
<script>try{var d=document.documentElement,s=localStorage.getItem("apt-font-scale"),t=localStorage.getItem("apt-theme");if(s)d.style.setProperty("--font-scale",s);if(localStorage.getItem("apt-layout")==="focus")d.classList.add("focus-mode");if(t==="dark"||(!t&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("theme-dark");}catch(e){}</script>
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">跳到正文</a>
${topbar}
${main}
${siteFooter(root)}
<button class="to-top" id="to-top" type="button" aria-label="回到顶部" hidden>↑ 顶部</button>
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
<script src="${root}assets/js/site.js?v=${assetVersion}" defer></script>
<script src="${root}assets/js/demos.js?v=${assetVersion}" defer></script>
</body>
</html>
`;
}

function topbar({ root, topics, currentTopicId, showReaderTools }) {
  const currentTopic = topics.find((topic) => topic.id === currentTopicId);
  const lectureLinks = topics
    .filter((topic) => !isExerciseCollection(topic))
    .map((topic) => `<a href="${root}${topic.id}/index.html"${topic.id === currentTopicId ? ' aria-current="page"' : ""}>${topicLabel(topic)}</a>`)
    .join("");
  const exerciseLink = topics.some(isExerciseCollection)
    ? `<a href="${root}index.html#exercises"${currentTopic && isExerciseCollection(currentTopic) ? ' aria-current="page"' : ""}>作业与小测</a>`
    : "";
  const topicLinks = lectureLinks + exerciseLink;
  const readerTools = showReaderTools
    ? `<button class="tool-btn" id="toc-toggle" type="button" aria-label="打开目录">${ICONS.menu}<span>目录</span></button>`
    : "";
  return `<header class="topbar">
  <div class="topbar-inner">
    ${readerTools}
    <a class="brand" href="${root}index.html">高等概率论<span>逐页精讲</span></a>
    <nav class="topnav" aria-label="讲次">${topicLinks}<a href="${root}basics.html">基础补课</a><a href="${root}glossary.html">术语表</a></nav>
    <div class="tools">
      <button class="tool-btn" id="search-open" type="button" aria-label="搜索">${ICONS.search}<span>搜索</span></button>
      ${showReaderTools ? `<button class="tool-btn" id="layout-toggle" type="button" aria-pressed="false" title="隐藏 / 显示左侧课件原页">${ICONS.focus}<span class="layout-label">专注阅读</span></button>` : ""}
      <button class="tool-btn" id="theme-toggle" type="button" aria-pressed="false" title="夜间模式（再点一次回到日间）">${ICONS.moon}<span class="theme-label">夜间</span></button>
      <div class="font-tools" role="group" aria-label="字号"><button class="tool-btn" id="font-down" type="button" aria-label="缩小字号">A−</button><button class="tool-btn" id="font-up" type="button" aria-label="放大字号">A+</button></div>
    </div>
  </div>
  <div class="read-progress" aria-hidden="true"><span></span></div>
</header>`;
}

/** 术语表条目的 topic 字段：数字表示第几讲，字符串表示练习合集（如 hw2） */
function glossaryTopicId(entry) {
  return typeof entry.topic === "string" ? entry.topic : `topic${entry.topic || 1}`;
}

/** 术语第一次出现的页面链接（相对站点根目录） */
function glossaryEntryHref(entry) {
  if (!entry.page) return "";
  return `${glossaryTopicId(entry)}/p${pad2(entry.page)}.html`;
}

/** 术语第一次出现的位置，写成「第 3 讲 p07」或「作业 2 第 5 题」 */
function glossaryEntryLabel(entry, topics) {
  const topic = topics.find((item) => item.id === glossaryTopicId(entry));
  if (!topic) return `p${pad2(entry.page)}`;
  return isExerciseCollection(topic) ? `${topicLabel(topic)} 第 ${entry.page} 题` : `${topicLabel(topic)} p${pad2(entry.page)}`;
}

/** 每页末尾的「本页术语」中英对照卡片（按正文中出现的先后排列） */
function vocabularyBoxHtml(usedTerms, glossary, root) {
  const entries = usedTerms.map((id) => glossary.byId.get(id)).filter(Boolean);
  if (entries.length === 0) return "";
  const rows = entries.map((entry) => `<tr><td><a href="${root}glossary.html#term-${escapeHtml(entry.id)}">${escapeHtml(entry.term)}</a></td><td lang="en"><em>${escapeHtml(entry.en || "")}</em></td><td>${escapeHtml(entry.plain || "")}</td></tr>`).join("");
  return `\n<section class="box box-vocab"><header class="box-head"><span class="box-kind">本页术语</span><span class="box-title">中英对照（按出现顺序）</span></header><div class="box-body"><div class="table-wrap"><table><thead><tr><th>中文</th><th>English</th><th>白话解释</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>\n`;
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
    title: meta.title || outline.title || outline.title_en || `第 ${pageNumber} ${unitName(topic)}`,
    titleEn: meta.title_en || outline.title_en || "",
    slide: meta.slide || outline.slide || "",
    kind: meta.kind || outline.kind || "",
    source: meta.source || outline.source || null,
  };
}

/**
 * 练习页左侧：这道题在解答 PDF 里的那几段（同一道题可能跨页），按顺序上下拼起来。
 * 每段用 CSS 裁剪整页图（与正文里的 ::: fig crop 相同的做法），点击可放大看整页。
 */
function sourcePaneHtml(topic, info) {
  const segments = Array.isArray(info.source) && info.source.length ? info.source : [{ page: info.number, from: 0, to: 1 }];
  const crops = segments.map((segment, index) => {
    const pageTag = `p${pad2(Number(segment.page))}`;
    const size = topic.manifest[pageTag] || { width: 1600, height: 2070 };
    const src = `../assets/slides/${topic.id}/${pageTag}.webp`;
    const x0 = Number(segment.x0 ?? 0.07);
    const x1 = Number(segment.x1 ?? 0.93);
    const y0 = Number(segment.from ?? 0);
    const y1 = Number(segment.to ?? 1);
    const imageStyle = [
      `width:${(100 / (x1 - x0)).toFixed(3)}%`,
      `left:${(-100 * x0 / (x1 - x0)).toFixed(3)}%`,
      `top:${(-100 * y0 / (y1 - y0)).toFixed(3)}%`,
    ].join(";");
    const ratio = `${((x1 - x0) * size.width).toFixed(0)} / ${((y1 - y0) * size.height).toFixed(0)}`;
    const loading = index === 0 ? ' fetchpriority="high"' : ' loading="lazy"';
    return `<div class="crop source-crop" style="aspect-ratio:${ratio}"><img src="${src}" alt="解答原页第 ${Number(segment.page)} 页（本题所在部分）" decoding="async"${loading} style="${imageStyle}"></div>`;
  }).join("\n      ");
  const pages = [...new Set(segments.map((segment) => Number(segment.page)))];
  const pagesLabel = pages.length > 1 ? `${pages[0]}–${pages[pages.length - 1]}` : `${pages[0]}`;
  return `<figure class="slide-pane source-pane">
      ${crops}
      <figcaption>解答原页第 ${pagesLabel} 页（本题部分）· 点击图片看整页</figcaption>
    </figure>`;
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
  return `<aside class="toc" id="toc" aria-label="目录">
  <div class="toc-head"><a href="index.html">${topicLabel(topic)} · ${escapeHtml(topic.title)}</a><p class="toc-progress" data-topic="${topic.id}" data-total="${topic.pageCount}">已看懂 <b>0</b> / ${topic.pageCount} ${unitName(topic)}</p></div>
  ${blocks.join("\n")}
</aside>`;
}

/* ------------------------------------------------------------------ */
/* 逐页精讲页                                                          */
/* ------------------------------------------------------------------ */

/** 讲义页末尾：作业与小测里哪些题引用了这一页（由练习页正文里的 [[tN:p:M]] 反查得到） */
function relatedExercisesHtml(related, topics) {
  if (!related || related.length === 0) return "";
  const items = related.map(({ topicId, number }) => {
    const collection = topics.find((topic) => topic.id === topicId);
    if (!collection) return "";
    const info = pageInfo(collection, number);
    return `<li><a href="../${topicId}/p${pad2(number)}.html"><span class="rel-label">${topicLabel(collection)} 第 ${number} 题</span><span class="rel-title">${escapeHtml(info.title)}</span></a></li>`;
  }).join("");
  return `\n<section class="box box-related"><header class="box-head"><span class="box-kind">相关练习</span><span class="box-title">作业与小测中用到这一页的题</span></header><div class="box-body"><ul class="related-list">${items}</ul></div></section>\n`;
}

function readerPageHtml({ topic, topics, pageNumber, rendered, kinds, glossary, related }) {
  const info = pageInfo(topic, pageNumber);
  const section = sectionOf(topic, pageNumber);
  const exercise = isExerciseCollection(topic);
  const unit = unitName(topic);
  const label = topicLabel(topic);
  const size = topic.manifest[`p${pad2(pageNumber)}`] || { width: 1600, height: 1280 };
  const imageSrc = `../assets/slides/${topic.id}/p${pad2(pageNumber)}.webp`;
  const previous = pageNumber > 1 ? pageInfo(topic, pageNumber - 1) : null;
  const next = pageNumber < topic.pageCount ? pageInfo(topic, pageNumber + 1) : null;
  const nextImagePage = next ? (exercise && Array.isArray(next.source) && next.source.length ? Number(next.source[0].page) : next.number) : null;

  const chips = rendered && rendered.headings.length
    ? `<nav class="chips" aria-label="本页小标题"><span class="chips-label">本页小标题</span>${rendered.headings.map((h) => `<a href="#${h.id}">${escapeHtml(h.text)}</a>`).join("")}</nav>`
    : "";

  const usedTerms = rendered ? rendered.usedTerms : [];
  const termData = {};
  for (const id of usedTerms) {
    const entry = glossary.byId.get(id);
    if (entry) termData[id] = { term: entry.term, en: entry.en || "", plain: entry.plain || "" };
  }

  const notes = rendered
    ? rendered.html + relatedExercisesHtml(related, topics) + vocabularyBoxHtml(usedTerms, glossary, "../")
    : `<div class="pending-note"><p class="pending-title">这一${unit}的精讲正在写作中</p><p>先对照左边的${exercise ? "解答原页" : "课件原页"}。标题：<em>${escapeHtml(info.titleEn)}</em></p></div>`;

  const endLabel = exercise ? `${label} 结束 →` : "本讲结束 →";
  const pager = `<nav class="pager" aria-label="翻页">
    ${previous ? `<a class="pager-prev" rel="prev" href="p${pad2(previous.number)}.html"><small>← 上一${unit} · ${pad2(previous.number)}</small><span>${escapeHtml(previous.title)}</span></a>` : "<span></span>"}
    ${next ? `<a class="pager-next" rel="next" href="p${pad2(next.number)}.html"><small>下一${unit} · ${pad2(next.number)} →</small><span>${escapeHtml(next.title)}</span></a>` : `<a class="pager-next" href="index.html"><small>${endLabel}</small><span>回到${label}${exercise ? " " : ""}目录</span></a>`}
  </nav>`;

  const badges = exercise
    ? `<span class="badge">第 ${pageNumber} 题 / 共 ${topic.pageCount} 题</span>${info.slide ? `<span class="badge">解答原页 ${escapeHtml(info.slide)}</span>` : ""}`
    : `<span class="badge">PDF 第 ${pageNumber} / ${topic.pageCount} 页</span>${info.slide ? `<span class="badge">幻灯片 ${escapeHtml(info.slide)}</span>` : ""}`;
  const leftPane = exercise
    ? sourcePaneHtml(topic, info)
    : `<figure class="slide-pane">
      <button class="slide-zoom" type="button" data-full="${imageSrc}" aria-label="放大查看课件原页">
        <img src="${imageSrc}" width="${size.width}" height="${size.height}" alt="课件第 ${pageNumber} 页：${escapeHtml(info.titleEn || info.title)}" decoding="async" fetchpriority="high">
      </button>
      <figcaption>课件原页 · 点击放大 · ← → 键翻页</figcaption>
    </figure>`;

  const main = `<div class="reader">
${tocHtml(topic, pageNumber)}
<div class="toc-scrim" id="toc-scrim" hidden></div>
<main id="main" class="reader-main" data-topic="${topic.id}" data-page="${pageNumber}" data-label="${escapeHtml(exercise ? `${label} 第 ${pageNumber} 题` : `${label} 第 ${pageNumber} 页`)}" data-title="${escapeHtml(info.title)}" data-prev="${previous ? `p${pad2(previous.number)}.html` : ""}" data-next="${next ? `p${pad2(next.number)}.html` : ""}">
  <header class="page-head">
    <p class="crumbs"><a href="index.html">${label} ${escapeHtml(topic.title)}</a>${section ? `<span>›</span>${escapeHtml(section.title)}` : ""}</p>
    <div class="badges">${badges}${info.kind && kinds[info.kind] ? `<span class="badge badge-kind">${kinds[info.kind]}</span>` : ""}</div>
    <h1>${escapeHtml(info.title)}</h1>
    ${info.titleEn ? `<p class="title-en" lang="en">${escapeHtml(info.titleEn)}</p>` : ""}
    ${chips}
  </header>
  <div class="split">
    ${leftPane}
    <article class="notes prose" id="notes">
${notes}
    </article>
  </div>
  <footer class="page-foot">
    <label class="done-toggle"><input type="checkbox" id="done-box" data-topic="${topic.id}" data-page="${pageNumber}"><span>这一${unit}我看懂了</span></label>
    ${pager}
  </footer>
</main>
</div>`;

  const extraHead = [
    next ? `<link rel="prefetch" href="p${pad2(next.number)}.html">` : "",
    next ? `<link rel="prefetch" href="../assets/slides/${topic.id}/p${pad2(nextImagePage)}.webp" as="image">` : "",
  ].join("\n");

  return layout({
    root: "../",
    title: `${pad2(pageNumber)} ${info.title} · ${label.replace(/\s+/g, "")} · 高等概率论逐页精讲`,
    bodyClass: "page-reader",
    topbar: topbar({ root: "../", topics, currentTopicId: topic.id, showReaderTools: true }),
    main,
    extraHead,
    pageData: { terms: termData, topic: topic.id, page: pageNumber },
    description: `${label} ${exercise ? `第 ${pageNumber} 题` : `第 ${pageNumber} 页`}：${info.title}。${exercise ? "解答原页对照 + 中文逐题精讲（含原解答订正、例子与自测）。" : "课件原页对照 + 中文逐页精讲（基础补课、推导、例子与自测）。"}`,
    pagePath: `${topic.id}/p${pad2(pageNumber)}.html`,
  });
}

/* ------------------------------------------------------------------ */
/* 目录页 / 首页 / 术语表 / 基础补课                                    */
/* ------------------------------------------------------------------ */

/**
 * 练习合集目录页：把各题「::: warn 原解答的问题：…」「::: warn 题目的笔误：…」的标题汇总成一张速览表，
 * 每条链到该题的「原解答逐行对照」一节。
 */
function issuesOverviewHtml(topic, issues) {
  const entries = [...(issues || new Map()).entries()].sort((a, b) => a[0] - b[0]);
  if (entries.length === 0) return "";
  const total = entries.reduce((sum, [, entry]) => sum + entry.titles.length, 0);
  const items = entries.map(([number, entry]) => {
    const info = pageInfo(topic, number);
    const href = `p${pad2(number)}.html${entry.anchor ? `#${entry.anchor}` : ""}`;
    const lines = entry.titles.map((title) => {
      const split = title.indexOf("：");
      const tag = split > 0 ? title.slice(0, split) : "原解答的问题";
      const text = split > 0 ? title.slice(split + 1) : title;
      const tagClass = tag.startsWith("题目") ? "issue-tag issue-tag-problem" : tag.includes("小") ? "issue-tag issue-tag-minor" : "issue-tag";
      const shortTag = tag.startsWith("题目") ? (tag.includes("笔误") ? "题目笔误" : "题目")
        : tag.includes("遗漏") ? "遗漏" : tag.includes("小") ? "小问题" : "问题";
      return `<li><span class="${tagClass}">${shortTag}</span>${escapeHtml(text)}</li>`;
    }).join("");
    return `<li class="issue-item"><a href="${href}"><span class="row-num">${pad2(number)}</span><span class="issue-title">${escapeHtml(info.title)}</span></a><ul>${lines}</ul></li>`;
  }).join("");
  return `<section class="index-section issues-overview" id="issues">
    <h2>原解答问题速览<small>${entries.length} 道题 · ${total} 处</small></h2>
    <p class="section-lede">解答原页不是标准答案：下面是各题精讲里指出的笔误、跳步和错误（「题目」表示题面本身的问题）。点题目标题直接跳到那道题的「原解答逐行对照」，那里有正确写法。考前复习时，这些地方最容易丢分。</p>
    <ol class="issue-list">${items}</ol>
  </section>`;
}

function topicIndexHtml({ topic, topics, kinds, issues }) {
  const writtenCount = topic.pages.size;
  const exercise = isExerciseCollection(topic);
  const unit = unitName(topic);
  const label = topicLabel(topic);
  const sections = (topic.sections && topic.sections.length ? topic.sections : [{ title: exercise ? "全部题目" : "全部页面", pages: [1, topic.pageCount] }]).map((section) => {
    const rows = [];
    for (let number = section.pages[0]; number <= section.pages[1]; number += 1) {
      const info = pageInfo(topic, number);
      const where = info.slide ? (exercise ? `解答原页 ${escapeHtml(info.slide)}` : `幻灯片 ${escapeHtml(info.slide)}`) : "";
      rows.push(`<li class="page-row${info.written ? "" : " pending"}" data-page="${number}">
        <a href="p${pad2(number)}.html">
          <span class="row-num">${pad2(number)}</span>
          <span class="row-main"><span class="row-title">${escapeHtml(info.title)}</span><span class="row-en" lang="en">${escapeHtml(info.titleEn)}</span></span>
          <span class="row-meta">${where}${info.kind && kinds[info.kind] ? ` · ${kinds[info.kind]}` : ""}${info.written ? "" : " · 写作中"}</span>
        </a></li>`);
    }
    return `<section class="index-section"><h2>${escapeHtml(section.title)}${section.title_en ? `<small lang="en">${escapeHtml(section.title_en)}</small>` : ""}</h2><ol class="page-rows">${rows.join("")}</ol></section>`;
  });

  const main = `<main id="main" class="index-main">
  <header class="index-head">
    <p class="eyebrow">${label} · ${topic.pageCount} ${exercise ? "道题（附解答精讲）" : "页课件"}</p>
    <h1>${escapeHtml(topic.title)}</h1>
    <p class="title-en" lang="en">${escapeHtml(topic.english)}</p>
    <p class="lede">${escapeHtml(topic.summary)}</p>
    <div class="index-actions">
      <a class="button primary" href="p01.html">从第 1 ${unit}开始</a>
      <a class="button" id="resume-link" href="p01.html" data-topic="${topic.id}" data-unit="${unit}" hidden>继续上次的进度</a>
      ${exercise && issues && issues.size ? '<a class="button" href="#issues">原解答问题速览</a>' : ""}
    </div>
    <p class="index-stats">精讲已完成 <b>${writtenCount}</b> / ${topic.pageCount} ${unit} · <span class="toc-progress" data-topic="${topic.id}" data-total="${topic.pageCount}">已看懂 <b>0</b> / ${topic.pageCount} ${unit}</span></p>
  </header>
  ${sections.join("\n")}
  ${exercise ? issuesOverviewHtml(topic, issues) : ""}
</main>`;
  return layout({
    root: "../",
    title: `${label.replace(/\s+/g, "")} ${topic.title} · 高等概率论逐页精讲`,
    bodyClass: "page-index",
    topbar: topbar({ root: "../", topics, currentTopicId: topic.id, showReaderTools: false }),
    main,
    description: `${label} ${topic.title}：${topic.summary}`,
    pagePath: `${topic.id}/index.html`,
  });
}

function topicCardHtml(topic) {
  const unit = unitName(topic);
  return `<li class="topic-card">
    <a href="${topic.id}/index.html">
      <span class="card-num">${topicLabel(topic)}</span>
      <strong>${escapeHtml(topic.title)}</strong>
      <em lang="en">${escapeHtml(topic.english)}</em>
      <p>${escapeHtml(topic.summary)}</p>
      <span class="card-meta">精讲 ${topic.pages.size} / ${topic.pageCount} ${unit}${topic.pages.size === 0 ? " · 即将开始" : ""}</span>
      <span class="meter" aria-hidden="true"><span style="width:${((100 * topic.pages.size) / topic.pageCount).toFixed(1)}%"></span></span>
      <span class="toc-progress card-progress" data-topic="${topic.id}" data-total="${topic.pageCount}">已看懂 <b>0</b> / ${topic.pageCount} ${unit}</span>
    </a>
  </li>`;
}

function homeHtml({ catalog, topics }) {
  const cards = topics.filter((topic) => !isExerciseCollection(topic)).map(topicCardHtml).join("");
  const exerciseTopics = topics.filter(isExerciseCollection);
  const exerciseSection = exerciseTopics.length
    ? `<section class="exercise-home" id="exercises">
    <h2>作业与小测</h2>
    <p class="section-lede">每道题单独一页：左边是解答原页里这道题所在的部分，右边是中文精讲。讲题目在考什么、需要的基础、完整的证明思路，逐行对照并订正原解答，最后有拓展延伸和自测。</p>
    <ol class="topic-cards">${exerciseTopics.map(topicCardHtml).join("")}</ol>
  </section>`
    : "";

  const main = `<main id="main" class="home-main">
  <section class="hero">
    <p class="eyebrow" lang="en">${escapeHtml(catalog.site.english)}</p>
    <h1>${escapeHtml(catalog.site.title)}</h1>
    <p class="lede">${escapeHtml(catalog.site.subtitle)}</p>
    <div class="index-actions"><a class="button primary" href="topic1/p01.html">从第 1 讲第 1 页开始</a><a class="button" id="resume-any" href="topic1/p01.html" hidden>继续上次阅读</a><a class="button" href="index.html#exercises">作业与小测</a><a class="button" href="basics.html">先补数学基础</a></div>
  </section>
  <section class="how">
    <h2>怎么用这个网站</h2>
    <ol class="how-steps">
      <li><b>左右对照。</b>左边固定显示课件原页（点击可放大，看清老师的手写），右边是中文精讲。</li>
      <li><b>每页同一个顺序。</b>这一页在讲什么 → 先补基础 → 课件原文逐句精读 → 老师板书在说什么 → 图解 → 例子 → 推导 → 常见疑问 → 小结与自测。顶部的「本页小标题」可以直接跳转。</li>
      <li><b>做练习。</b>作业与小测每道题一页：先看「这道题在问什么」和「思路」，自己试着写，再对照「完整解答」和「原解答逐行对照」（原解答的笔误与错误都在这里订正）。每个练习的目录页末尾有「原解答问题速览」，讲义页末尾的「相关练习」告诉你这一页的知识在哪些题里用到。</li>
      <li><b>边读边查。</b>正文里带虚线的术语，鼠标停留（手机上点一下）就会弹出白话解释；右上角「搜索」或按 <kbd>/</kbd> 可以搜全站，点开结果会自动定位到匹配的文字。</li>
      <li><b>记录进度。</b>看懂一页就勾选页面底部的「这一页我看懂了」，首页和目录会显示进度，首页的「继续上次阅读」回到你上次看的地方；<kbd>←</kbd> <kbd>→</kbd> 键翻页。晚上看书可以点右上角的「夜间」。</li>
    </ol>
  </section>
  <ol class="topic-cards">${cards}</ol>
  ${exerciseSection}
  <section class="extra-cards">
    <a class="extra-card" href="basics.html"><strong>基础补课</strong><span>集合、函数、上确界、极限、级数、可数性……测度论需要的最少背景，一次讲清。</span></a>
    <a class="extra-card" href="glossary.html"><strong>术语表</strong><span>中英对照 + 白话解释，并标出每个术语第一次出现在哪一页。</span></a>
    <a class="extra-card" href="about.html"><strong>关于本站</strong><span>内容从哪里来、怎样写成、怎样使用和反馈问题，以及隐私说明。</span></a>
  </section>
</main>`;
  return layout({
    root: "",
    title: `${catalog.site.title} · ${catalog.site.english}`,
    bodyClass: "page-home",
    topbar: topbar({ root: "", topics, currentTopicId: "", showReaderTools: false }),
    main,
    pagePath: "",
  });
}

function glossaryHtml({ topics, glossary }) {
  const rows = glossary.entries.map((entry) => {
    const pageLink = entry.page ? `<a href="${glossaryEntryHref(entry)}">${glossaryEntryLabel(entry, topics)}</a>` : "";
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
    description: "高等概率论术语表：中文、英文原词、一句白话解释，以及每个术语第一次出现的页面。",
    pagePath: "glossary.html",
  });
}

function aboutHtml({ topics, rendered }) {
  const chips = rendered && rendered.headings.length
    ? `<nav class="chips" aria-label="小标题"><span class="chips-label">目录</span>${rendered.headings.map((h) => `<a href="#${h.id}">${escapeHtml(h.text)}</a>`).join("")}</nav>`
    : "";
  const main = `<main id="main" class="basics-main">
  <header class="index-head">
    <p class="eyebrow">About</p>
    <h1>关于本站</h1>
    <p class="lede">这个网站是什么、内容从哪里来、怎样使用，以及发现错误时怎样反馈。</p>
    ${chips}
  </header>
  <article class="notes prose basics-prose">
${rendered ? rendered.html : ""}
  </article>
</main>`;
  return layout({
    root: "",
    title: "关于本站 · 高等概率论逐页精讲",
    bodyClass: "page-basics",
    topbar: topbar({ root: "", topics, currentTopicId: "", showReaderTools: false }),
    main,
    pageData: { terms: rendered ? rendered.termData : {} },
    description: "关于高等概率论逐页精讲：内容范围、写作方法、使用方法、反馈渠道与隐私说明。",
    pagePath: "about.html",
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
    description: "基础补课：集合、函数、上确界、极限、级数、可数性……读懂测度论需要的最少数学背景。",
    pagePath: "basics.html",
  });
}

/* ------------------------------------------------------------------ */
/* 总装                                                                */
/* ------------------------------------------------------------------ */

export function buildSite({ catalog, topics, glossary, renderPage, pageTitleMap, checks, paths, kinds, markdown, report, linkTargets }) {
  const { SITE_SRC, CONTENT_DIR, OUTPUT_DIR } = paths;
  assetVersion = computeAssetVersion(SITE_SRC);
  siteInfo = {
    title: catalog.site.title,
    url: catalog.site.url ? String(catalog.site.url).replace(/\/?$/, "/") : "",
    repo: catalog.site.repo ? String(catalog.site.repo).replace(/\/$/, "") : "",
  };
  cleanOutput(OUTPUT_DIR);
  writeFile(path.join(OUTPUT_DIR, ".nojekyll"), "");
  copyDirectory(path.join(SITE_SRC, "assets", "img"), path.join(OUTPUT_DIR, "assets", "img"));

  // 练习页正文的预扫描：① 引用了哪些讲义页（讲义页末尾的「相关练习」）；② 原解答 / 题目的问题（练习目录页的速览）
  const relatedByLecture = new Map();
  const issuesByCollection = new Map();
  for (const collection of topics.filter(isExerciseCollection)) {
    const issues = new Map();
    for (const [number, page] of collection.pages) {
      for (const match of page.body.matchAll(/\[\[t(\d):p:(\d+)(?:\|[^\]]*)?\]\]/g)) {
        const lectureId = `topic${match[1]}`;
        const lecturePage = Number(match[2]);
        if (!relatedByLecture.has(lectureId)) relatedByLecture.set(lectureId, new Map());
        const byPage = relatedByLecture.get(lectureId);
        if (!byPage.has(lecturePage)) byPage.set(lecturePage, []);
        const list = byPage.get(lecturePage);
        if (!list.some((item) => item.topicId === collection.id && item.number === number)) list.push({ topicId: collection.id, number });
      }
      const titles = [...page.body.matchAll(/^:{3,}\s*warn\s+((?:原解答|题目)[^\n]*?)\s*$/gm)].map((match) => match[1]);
      if (titles.length) issues.set(number, { titles, anchor: "" });
    }
    issuesByCollection.set(collection.id, issues);
  }
  const exerciseOrder = new Map(topics.map((topic, index) => [topic.id, index]));
  for (const byPage of relatedByLecture.values()) {
    for (const list of byPage.values()) list.sort((a, b) => exerciseOrder.get(a.topicId) - exerciseOrder.get(b.topicId) || a.number - b.number);
  }

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
          k: isExerciseCollection(topic) ? `${topicLabel(topic)} · 第 ${pageNumber} 题` : `${topicLabel(topic).replace(/\s+/g, "")} · p${pad2(pageNumber)}`,
          h: rendered.headings.map((h) => h.text).join(" / "),
          x: htmlToText(rendered.html).slice(0, 6000),
        });
        const issue = issuesByCollection.get(topic.id)?.get(pageNumber);
        if (issue) issue.anchor = (rendered.headings.find((h) => h.text.includes("原解答逐行对照")) || {}).id || "";
      }
      const related = relatedByLecture.get(topic.id)?.get(pageNumber) || [];
      const html = readerPageHtml({ topic, topics, pageNumber, rendered, kinds, glossary, related });
      writeFile(path.join(OUTPUT_DIR, topic.id, `p${pad2(pageNumber)}.html`), html);
    }
    writeFile(path.join(OUTPUT_DIR, topic.id, "index.html"), topicIndexHtml({ topic, topics, kinds, issues: issuesByCollection.get(topic.id) }));
  }

  writeFile(path.join(OUTPUT_DIR, "index.html"), homeHtml({ catalog, topics }));
  writeFile(path.join(OUTPUT_DIR, "glossary.html"), glossaryHtml({ topics, glossary }));

  /** 站点根目录下的独立页面（基础补课、关于本站）：渲染 content/<name>.md */
  function renderRootPage(fileName) {
    const file = path.join(CONTENT_DIR, fileName);
    if (!fs.existsSync(file)) return null;
    const source = fs.readFileSync(file, "utf8");
    const env = {
      headings: [],
      usedTerms: new Set(),
      glossaryMatchers: glossary.matchers,
      report: (level, needle, message) => report(level, file, 0, message),
      topicId: "topic1",
      linkTargets,
      pageTitles: pageTitleMap(topics[0]),
    };
    const html = markdown.render(source, env);
    const termData = {};
    for (const id of env.usedTerms) {
      const entry = glossary.byId.get(id);
      if (entry) termData[id] = { term: entry.term, en: entry.en || "", plain: entry.plain || "" };
    }
    // 页面在站点根目录：同讲链接补上 topic1/，跨讲链接去掉开头的 ../
    const rootRelativeHtml = html.replace(/href="p(\d\d)\.html"/g, 'href="topic1/p$1.html"').replace(/href="\.\.\//g, 'href="');
    return { html: rootRelativeHtml, headings: env.headings, termData, text: htmlToText(html) };
  }

  const basicsRendered = renderRootPage("basics.md");
  if (basicsRendered) searchIndex.push({ u: "basics.html", t: "基础补课", e: "Prerequisites", k: "基础补课", h: basicsRendered.headings.map((h) => h.text).join(" / "), x: basicsRendered.text.slice(0, 12000) });
  writeFile(path.join(OUTPUT_DIR, "basics.html"), basicsHtml({ topics, rendered: basicsRendered }));

  const aboutRendered = renderRootPage("about.md");
  if (aboutRendered) searchIndex.push({ u: "about.html", t: "关于本站", e: "About", k: "关于本站", h: aboutRendered.headings.map((h) => h.text).join(" / "), x: aboutRendered.text.slice(0, 6000) });
  writeFile(path.join(OUTPUT_DIR, "about.html"), aboutHtml({ topics, rendered: aboutRendered }));

  for (const entry of glossary.entries) {
    searchIndex.push({ u: `glossary.html#term-${entry.id}`, t: entry.term, e: entry.en || "", k: "术语表", h: "", x: entry.plain || "" });
  }
  writeFile(path.join(OUTPUT_DIR, "assets", "search.json"), JSON.stringify(searchIndex));

  console.log(`已生成网站：${path.relative(paths.REPO_ROOT, OUTPUT_DIR)}/（${topics.map((t) => `${t.id} ${t.pages.size}/${t.pageCount} 页精讲`).join("，")}）`);
}
