/**
 * Markdown → HTML 渲染器（在构建时运行，不在浏览器里运行）
 *
 * 在 markdown-it 的基础上增加了：
 *   1. 公式：$...$（行内）与 $$...$$（独立成行）。构建时直接用 KaTeX 排版成 HTML，
 *      浏览器不需要再现场计算公式，打开和滚动都更流畅。
 *   2. 卡片容器：::: def 定义 1（……） ... :::，种类见 CONTAINER_KINDS。
 *   3. 页间链接：[[p:12]]、[[p:12|从上连续]]、[[t2:p:5]]（跨讲）、[[hw1:p:3]]、[[quiz2:p:1]]（作业、小测的第几题）。
 *   4. 术语自动提示：每页第一次出现词汇表里的术语时，加上悬浮解释。
 *   5. 中文断行不产生多余空格；表格外包横向滚动容器；小标题自动加锚点。
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const MarkdownIt = require("../vendor/markdown-it.min.cjs");
const markdownItContainer = require("../vendor/markdown-it-container.min.cjs");
const katex = require("../vendor/katex.min.cjs");

/** 全站通用的 LaTeX 宏：写讲义时可以直接用 \R、\ind 等简写 */
export const KATEX_MACROS = Object.freeze({
  "\\R": "\\mathbb{R}",
  "\\N": "\\mathbb{N}",
  "\\Q": "\\mathbb{Q}",
  "\\Z": "\\mathbb{Z}",
  "\\P": "\\mathbb{P}",
  "\\E": "\\mathbb{E}",
  "\\F": "\\mathcal{F}",
  "\\ind": "\\mathbf{1}",
  "\\eps": "\\varepsilon",
  "\\dd": "\\,\\mathrm{d}",
  "\\Leb": "\\operatorname{Leb}",
});

/**
 * ::: 容器种类。
 *   label       卡片左上角的小标签
 *   className   对应 CSS 里的 .box-<className>
 *   collapsible 是否渲染成可折叠的 <details>
 */
export const CONTAINER_KINDS = Object.freeze({
  original: { label: "课件原文", className: "original" },
  zh: { label: "中文翻译", className: "zh" },
  board: { label: "老师板书", className: "board" },
  def: { label: "定义", className: "def" },
  thm: { label: "定理", className: "thm" },
  prop: { label: "命题", className: "thm" },
  lemma: { label: "引理", className: "thm" },
  cor: { label: "推论", className: "thm" },
  idea: { label: "人话版", className: "idea" },
  ex: { label: "例子", className: "ex" },
  proof: { label: "推导", className: "proof" },
  warn: { label: "易错点", className: "warn" },
  basics: { label: "基础补课", className: "basics" },
  fig: { label: "图解", className: "fig" },
  sum: { label: "小结", className: "sum" },
  quiz: { label: "自测", className: "quiz" },
  note: { label: "补充", className: "note" },
  answer: { label: "点开看答案", className: "answer", collapsible: true },
  more: { label: "展开更多细节", className: "more", collapsible: true },
  demo: { label: "动手试一试", className: "demo" },
});

const CJK_CHARACTER = /[\u2e80-\u2fff\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
/** 不允许出现在行首的中文标点 */
const TRAILING_CJK_PUNCTUATION = /^[，。、；：？！）」』》〉】”’…]+/;
/** KaTeX 行内公式 HTML 的结尾：依次关闭最后一个 .base、.katex-html、.katex */
const KATEX_TAIL = "</span></span></span>";

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/* 公式                                                                */
/* ------------------------------------------------------------------ */

/** 用 KaTeX 把一段 LaTeX 排版成 HTML；出错时记录问题并原样显示源码。 */
export function renderTex(tex, displayMode, env = {}) {
  const report = env.report || (() => {});
  try {
    return katex.renderToString(tex, {
      displayMode,
      output: "html",
      throwOnError: true,
      macros: { ...KATEX_MACROS },
      strict: (errorCode) => {
        if (errorCode === "unicodeTextInMathMode") {
          report("warn", tex, `公式里直接写了中文或特殊文字，请放进 \\text{…}：${tex.slice(0, 60)}`);
        }
        return "ignore";
      },
    });
  } catch (error) {
    const reason = String(error.message || error).replace(/^KaTeX parse error:\s*/, "");
    report("error", tex, `公式无法渲染（${reason}）：${tex.slice(0, 90)}`);
    return `<code class="math-error" title="${escapeHtml(reason)}">${escapeHtml(tex)}</code>`;
  }
}

/** 判断位置 pos 上的 $ 能否作为开 / 闭定界符（与 Pandoc 规则一致）。 */
function dollarDelimiterState(src, pos) {
  const previous = pos > 0 ? src.charCodeAt(pos - 1) : -1;
  const next = pos + 1 < src.length ? src.charCodeAt(pos + 1) : -1;
  const isSpace = (code) => code === 0x20 || code === 0x09 || code === 0x0a;
  return {
    canOpen: !isSpace(next),
    canClose: !isSpace(previous) && !(next >= 0x30 && next <= 0x39),
  };
}

/** 行内公式 $...$ */
function mathInlineRule(state, silent) {
  const src = state.src;
  if (src[state.pos] !== "$") return false;
  if (src[state.pos + 1] === "$") return false; // $$ 交给块级规则或当普通字符

  if (!dollarDelimiterState(src, state.pos).canOpen) {
    if (!silent) state.pending += "$";
    state.pos += 1;
    return true;
  }

  const contentStart = state.pos + 1;
  let closing = contentStart;
  while ((closing = src.indexOf("$", closing)) !== -1) {
    // 前面有奇数个反斜杠说明这个 $ 被转义了
    let backslashes = 0;
    for (let i = closing - 1; i >= 0 && src[i] === "\\"; i -= 1) backslashes += 1;
    if (backslashes % 2 === 0 && closing <= state.posMax) break;
    closing += 1;
  }

  if (closing === -1 || closing > state.posMax || closing === contentStart ||
      !dollarDelimiterState(src, closing).canClose) {
    if (!silent) state.pending += "$";
    state.pos = contentStart;
    return true;
  }

  if (!silent) {
    const token = state.push("math_inline", "math", 0);
    token.markup = "$";
    token.content = src.slice(contentStart, closing);
  }
  state.pos = closing + 1;
  return true;
}

/** 独立公式 $$ ... $$（可以跨多行，也可以写在一行里） */
function mathBlockRule(state, startLine, endLine, silent) {
  const lineStart = state.bMarks[startLine] + state.tShift[startLine];
  const lineEnd = state.eMarks[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (lineStart + 2 > lineEnd || state.src.slice(lineStart, lineStart + 2) !== "$$") return false;
  if (silent) return true;

  const firstRest = state.src.slice(lineStart + 2, lineEnd);
  let content;
  let closed = false;
  let lastConsumedLine = startLine;

  if (firstRest.trim().length >= 2 && firstRest.trim().endsWith("$$")) {
    content = firstRest.trim().slice(0, -2);
    closed = true;
  } else {
    const collected = [firstRest];
    for (let line = startLine + 1; line < endLine; line += 1) {
      const start = state.bMarks[line] + state.tShift[line];
      const end = state.eMarks[line];
      // 缩进比当前块还浅的非空行：说明列表等结构已经结束，不再吞进来
      if (start < end && state.sCount[line] < state.blkIndent) break;
      const text = state.src.slice(start, end).trimEnd();
      lastConsumedLine = line;
      if (text.endsWith("$$")) {
        collected.push(text.slice(0, -2));
        closed = true;
        break;
      }
      collected.push(text);
    }
    content = collected.join("\n");
  }

  const token = state.push("math_block", "math", 0);
  token.block = true;
  token.content = content.trim();
  token.map = [startLine, lastConsumedLine + 1];
  token.meta = { closed };
  state.line = lastConsumedLine + 1;
  return true;
}

/* ------------------------------------------------------------------ */
/* 页间链接 [[p:12|文字]]                                              */
/* ------------------------------------------------------------------ */

/** 链接前缀 → 目录名：t3 → topic3；hw1、quiz2 原样使用 */
function linkTargetId(prefix) {
  return /^t\d$/.test(prefix) ? `topic${prefix.slice(1)}` : prefix;
}

function pageLinkRule(state, silent) {
  const src = state.src;
  const start = state.pos;
  if (src.charCodeAt(start) !== 0x5b || src.charCodeAt(start + 1) !== 0x5b) return false;
  const end = src.indexOf("]]", start + 2);
  if (end < 0 || end > state.posMax) return false;
  const match = src.slice(start + 2, end).match(/^(?:(t\d|hw\d|quiz\d):)?p:(\d{1,2})(?:\|([\s\S]+))?$/);
  if (!match) return false;
  if (!silent) {
    const token = state.push("page_link", "a", 0);
    token.meta = { target: match[1] ? linkTargetId(match[1]) : null, page: Number(match[2]), label: match[3] };
  }
  state.pos = end + 2;
  return true;
}

/* ------------------------------------------------------------------ */
/* 术语自动提示                                                         */
/* ------------------------------------------------------------------ */

/**
 * 每页只给某个术语的「第一次出现」加提示，避免满屏下划线。
 * 跳过：小标题、英文原文框、链接文字。
 */
function glossaryAutolinkRule(state) {
  const matchers = state.env.glossaryMatchers;
  if (!matchers || matchers.length === 0) return;
  const used = state.env.usedTerms || (state.env.usedTerms = new Set());
  let insideHeading = false;
  let englishDepth = 0;

  for (const blockToken of state.tokens) {
    if (blockToken.type === "heading_open") insideHeading = true;
    else if (blockToken.type === "heading_close") insideHeading = false;
    else if (blockToken.type === "container_original_open") englishDepth += 1;
    else if (blockToken.type === "container_original_close") englishDepth -= 1;
    else if (blockToken.type === "inline" && !insideHeading && englishDepth === 0 && blockToken.children) {
      blockToken.children = linkTermsInChildren(blockToken.children, matchers, used, state);
    }
  }
}

function linkTermsInChildren(children, matchers, used, state) {
  const result = [];
  let linkDepth = 0;
  for (const child of children) {
    if (child.type === "link_open") linkDepth += 1;
    if (child.type === "link_close") linkDepth -= 1;
    if (child.type !== "text" || linkDepth > 0) {
      result.push(child);
      continue;
    }
    result.push(...splitTextByTerms(child, matchers, used, state));
  }
  return result;
}

/** 找术语在文本里的位置；前一个字在 notAfter 里时跳过（例如「不相交集合」里的「交集」） */
function findTermIndex(text, matcher) {
  let from = 0;
  while (from <= text.length) {
    const index = text.indexOf(matcher.text, from);
    if (index < 0) return -1;
    const previous = index > 0 ? text[index - 1] : "";
    if (!matcher.notAfter || !matcher.notAfter.includes(previous)) return index;
    from = index + 1;
  }
  return -1;
}

function splitTextByTerms(textToken, matchers, used, state) {
  let pieces = [textToken];
  for (const matcher of matchers) {
    if (used.has(matcher.id)) continue;
    for (let i = 0; i < pieces.length; i += 1) {
      const piece = pieces[i];
      if (piece.type !== "text") continue;
      const index = findTermIndex(piece.content, matcher);
      if (index < 0) continue;
      const before = new state.Token("text", "", 0);
      before.content = piece.content.slice(0, index);
      const mark = new state.Token("html_inline", "", 0);
      mark.content = `<span class="term" tabindex="0" data-term="${escapeHtml(matcher.id)}">${escapeHtml(matcher.text)}</span>`;
      const after = new state.Token("text", "", 0);
      after.content = piece.content.slice(index + matcher.text.length);
      pieces.splice(i, 1, before, mark, after);
      used.add(matcher.id);
      break;
    }
  }
  return pieces.filter((piece) => piece.type !== "text" || piece.content.length > 0);
}

/* ------------------------------------------------------------------ */
/* 卡片容器                                                            */
/* ------------------------------------------------------------------ */

/**
 * 解析容器标题行：「标题 | crop=0.1,0.2,0.9,0.8 | page=26」。
 * 只有「| 键=值」才算参数；其余的 | 属于标题本身（例如公式里的绝对值 $|f|$）。
 */
function parseContainerInfo(info) {
  const [firstPart, ...rest] = info.split("|");
  const titleParts = [firstPart];
  const options = {};
  for (const part of rest) {
    const option = part.match(/^\s*([A-Za-z]+)\s*=\s*(.*?)\s*$/);
    if (option) options[option[1]] = option[2];
    else titleParts.push(part);
  }
  return { title: titleParts.join("|").trim(), options };
}

function renderCropFigure(options, env) {
  const numbers = String(options.crop).split(",").map(Number);
  if (numbers.length !== 4 || numbers.some((n) => Number.isNaN(n) || n < 0 || n > 1)) {
    env.report?.("error", options.crop, `crop 参数应为 0–1 之间的四个数 x0,y0,x1,y1：${options.crop}`);
    return "";
  }
  const [x0, y0, x1, y1] = numbers;
  if (x1 <= x0 || y1 <= y0) {
    env.report?.("error", options.crop, `crop 区域为空（需要 x1>x0 且 y1>y0）：${options.crop}`);
    return "";
  }
  const pageNumber = options.page ? Number(options.page) : env.pageNumber;
  const image = env.slideImage ? env.slideImage(pageNumber) : null;
  if (!image) return "";
  const cropWidth = (x1 - x0) * image.width;
  const cropHeight = (y1 - y0) * image.height;
  const imageStyle = [
    `width:${(100 / (x1 - x0)).toFixed(3)}%`,
    `left:${(-100 * x0 / (x1 - x0)).toFixed(3)}%`,
    `top:${(-100 * y0 / (y1 - y0)).toFixed(3)}%`,
  ].join(";");
  return `<div class="crop" style="aspect-ratio:${cropWidth.toFixed(0)} / ${cropHeight.toFixed(0)}">` +
    `<img src="${image.src}" alt="课件局部" loading="lazy" decoding="async" style="${imageStyle}"></div>`;
}

function containerOpenHtml(kind, info, env, md) {
  const spec = CONTAINER_KINDS[kind];
  const { title, options } = parseContainerInfo(info);
  const titleEnv = { ...env, glossaryMatchers: null };
  const titleHtml = title ? md.renderInline(title, titleEnv) : "";

  if (spec.collapsible) {
    const summary = titleHtml || spec.label;
    return `<details class="box box-${spec.className}"><summary>${summary}</summary><div class="box-body">\n`;
  }

  if (kind === "demo") {
    const demoName = (options.name || title.split(/\s+/)[0] || "").trim();
    const demoTitle = options.name ? titleHtml : md.renderInline(title.slice(demoName.length).trim(), titleEnv);
    return `<section class="box box-demo" data-demo="${escapeHtml(demoName)}">` +
      `<header class="box-head"><span class="box-kind">${spec.label}</span>${demoTitle ? `<span class="box-title">${demoTitle}</span>` : ""}</header>` +
      `<div class="box-body">\n`;
  }

  // 标题本身已经以「定义 / 定理 / 例 / 人话版」等开头时，不再重复显示种类标签
  const titleRepeatsLabel = Boolean(title) && (
    title.startsWith(spec.label) ||
    (["def", "thm", "prop", "lemma", "cor", "ex"].includes(kind) && title.startsWith(spec.label.slice(0, 1)))
  );
  const kindChip = titleRepeatsLabel ? "" : `<span class="box-kind">${spec.label}</span>`;
  const titleSpan = titleHtml ? `<span class="box-title">${titleHtml}</span>` : "";
  const crop = kind === "fig" && options.crop ? renderCropFigure(options, env) : "";
  return `<section class="box box-${spec.className}"><header class="box-head">${kindChip}${titleSpan}</header>${crop}<div class="box-body">\n`;
}

function containerCloseHtml(kind) {
  return CONTAINER_KINDS[kind].collapsible ? "</div></details>\n" : "</div></section>\n";
}

/* ------------------------------------------------------------------ */
/* 组装渲染器                                                          */
/* ------------------------------------------------------------------ */

/**
 * 让粗体 / 斜体在中文里正常工作。
 * CommonMark 规定：「**」紧挨着标点、另一侧又是文字时不能开合，所以
 * 「**在那里。**试着」这种中文常见写法不会加粗。这里把汉字和全角标点视为标点，
 * 使标点另一侧的汉字满足开合条件；纯英文文本的行为不变。
 */
function enableCjkFriendlyEmphasis(md) {
  const { isWhiteSpace, isPunctChar, isMdAsciiPunct } = md.utils;
  const isPunctuationLike = (code) =>
    isMdAsciiPunct(code) || isPunctChar(String.fromCharCode(code)) || CJK_CHARACTER.test(String.fromCharCode(code));
  md.inline.State.prototype.scanDelims = function scanDelims(start, canSplitWord) {
    const max = this.posMax;
    const marker = this.src.charCodeAt(start);
    const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;
    let pos = start;
    while (pos < max && this.src.charCodeAt(pos) === marker) pos += 1;
    const nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;
    const isLastPunct = isPunctuationLike(lastChar);
    const isNextPunct = isPunctuationLike(nextChar);
    const isLastSpace = isWhiteSpace(lastChar);
    const isNextSpace = isWhiteSpace(nextChar);
    const leftFlanking = !isNextSpace && (!isNextPunct || isLastSpace || isLastPunct);
    const rightFlanking = !isLastSpace && (!isLastPunct || isNextSpace || isNextPunct);
    return {
      can_open: leftFlanking && (canSplitWord || !rightFlanking || isLastPunct),
      can_close: rightFlanking && (canSplitWord || !leftFlanking || isNextPunct),
      length: pos - start,
    };
  };
}

export function createMarkdownRenderer() {
  const md = new MarkdownIt({ html: true, linkify: false, typographer: false, breaks: false });
  enableCjkFriendlyEmphasis(md);

  md.inline.ruler.after("escape", "math_inline", mathInlineRule);
  md.block.ruler.after("blockquote", "math_block", mathBlockRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.inline.ruler.before("link", "page_link", pageLinkRule);
  md.core.ruler.push("glossary_autolink", glossaryAutolinkRule);

  // 行内公式后面紧跟的中文标点放进公式的最后一块里，避免「。」被单独挤到下一行
  md.renderer.rules.math_inline = (tokens, idx, options, env) => {
    const html = renderTex(tokens[idx].content, false, env);
    const next = tokens[idx + 1];
    const punctuation = next && next.type === "text" ? next.content.match(TRAILING_CJK_PUNCTUATION) : null;
    if (!punctuation || !html.endsWith(KATEX_TAIL)) return html;
    next.content = next.content.slice(punctuation[0].length);
    return `${html.slice(0, -KATEX_TAIL.length)}<span class="cjk-punct">${escapeHtml(punctuation[0])}</span>${KATEX_TAIL}`;
  };
  md.renderer.rules.math_block = (tokens, idx, options, env) => {
    const token = tokens[idx];
    if (!token.meta?.closed) env.report?.("error", token.content, "独立公式 $$ 没有闭合");
    return `<div class="math-display">${renderTex(token.content, true, env)}</div>\n`;
  };

  md.renderer.rules.page_link = (tokens, idx, options, env) => {
    const { target, page, label } = tokens[idx].meta;
    const pageTag = `p${String(page).padStart(2, "0")}`;
    const targetId = target || env.topicId;
    const sameTopic = targetId === env.topicId;
    const href = sameTopic ? `${pageTag}.html` : `../${targetId}/${pageTag}.html`;
    const targetInfo = env.linkTargets ? env.linkTargets.get(targetId) : null;
    if (env.linkTargets && !targetInfo) {
      env.report?.("error", `[[`, `页面链接指向不存在的讲次或练习：${targetId}`);
    } else if (targetInfo && (page < 1 || page > targetInfo.pageCount)) {
      env.report?.("error", `p:${page}`, `页面链接超出范围：${targetId} 只有 ${targetInfo.pageCount} ${targetInfo.unit}，却链接到第 ${page} ${targetInfo.unit}`);
    }
    const titles = targetInfo ? targetInfo.titles : sameTopic ? env.pageTitles : null;
    const title = titles ? titles.get(page) : "";
    const isProblem = targetInfo && targetInfo.unit === "题";
    const defaultLabel = isProblem ? `${sameTopic ? "" : `${targetInfo.label} `}第 ${page} 题` : `第 ${page} 页`;
    const labelHtml = label ? md.renderInline(label, { ...env, glossaryMatchers: null }) : defaultLabel;
    return `<a class="page-link" href="${href}"${title ? ` title="${escapeHtml(title)}"` : ""}>${labelHtml}</a>`;
  };

  // 中文与中文之间的换行不应变成空格
  md.renderer.rules.softbreak = (tokens, idx) => {
    const previous = tokens[idx - 1];
    const next = tokens[idx + 1];
    const previousChar = previous && previous.content ? previous.content.slice(-1) : "";
    const nextChar = next && next.content ? next.content.slice(0, 1) : "";
    return CJK_CHARACTER.test(previousChar) || CJK_CHARACTER.test(nextChar) ? "" : "\n";
  };

  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
  md.renderer.rules.table_close = () => "</table></div>\n";

  // 小标题：加锚点，并把二级标题收集起来做「本页小标题」导航
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const inline = tokens[idx + 1];
    env.headingCounter = (env.headingCounter || 0) + 1;
    const id = `s${env.headingCounter}`;
    token.attrSet("id", id);
    if (token.tag === "h1") {
      env.report?.("warn", inline.content, "讲义正文不要用一级标题 #，已按二级标题处理");
      token.tag = "h2";
    }
    if (token.tag === "h2" && env.headings) {
      const plain = (inline.children || [])
        .map((child) => (child.type === "text" || child.type === "code_inline" ? child.content : ""))
        .join("")
        .trim();
      env.headings.push({ id, text: plain || inline.content });
    }
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
    if (tokens[idx].tag === "h1") tokens[idx].tag = "h2";
    return self.renderToken(tokens, idx, options);
  };

  // 外部链接新窗口打开
  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet("href") || "";
    if (/^https?:\/\//.test(href)) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener");
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  for (const kind of Object.keys(CONTAINER_KINDS)) {
    md.use(markdownItContainer, kind, {
      validate: (params) => params.trim().split(/\s+/, 1)[0] === kind,
      render: (tokens, idx, options, env) => {
        const token = tokens[idx];
        if (token.nesting === 1) {
          const info = token.info.trim().slice(kind.length).trim();
          return containerOpenHtml(kind, info, env, md);
        }
        return containerCloseHtml(kind);
      },
    });
  }

  return md;
}
