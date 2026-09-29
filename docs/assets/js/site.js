/**
 * 高等概率论逐页精讲 · 页面交互
 *   目录抽屉、键盘翻页、阅读进度、「看懂了」记录、专注阅读、字号、
 *   课件放大、术语悬浮解释、全站搜索、术语表筛选。
 * 所有进度只保存在本机浏览器（localStorage），不上传任何数据。
 */
(function () {
  "use strict";

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (error) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (error) { /* 隐私模式下忽略 */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (error) { /* 忽略 */ } },
  };

  const siteRoot = (() => {
    const script = document.querySelector('script[src*="assets/js/site.js"]');
    return script ? script.getAttribute("src").replace(/assets\/js\/site\.js(\?.*)?$/, "") : "";
  })();

  const pageData = (() => {
    const node = document.getElementById("page-data");
    if (!node) return {};
    try { return JSON.parse(node.textContent); } catch (error) { return {}; }
  })();

  const isTyping = (target) => target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  const doneKey = (topic, page) => `apt-done:${topic}:${page}`;

  /* ---------------- 目录抽屉 ---------------- */
  const tocToggle = document.getElementById("toc-toggle");
  const tocScrim = document.getElementById("toc-scrim");
  function setTocOpen(open) {
    document.body.classList.toggle("toc-open", open);
    if (tocScrim) tocScrim.hidden = !open;
    if (open) {
      const current = document.querySelector(".toc li.current");
      if (current) current.scrollIntoView({ block: "center" });
    }
  }
  if (tocToggle) tocToggle.addEventListener("click", () => setTocOpen(!document.body.classList.contains("toc-open")));
  if (tocScrim) tocScrim.addEventListener("click", () => setTocOpen(false));
  const currentTocItem = document.querySelector(".toc li.current");
  if (currentTocItem && window.matchMedia("(min-width: 1560px)").matches) currentTocItem.scrollIntoView({ block: "center" });

  /* ---------------- 「看懂了」与进度 ---------------- */
  function refreshProgress() {
    document.querySelectorAll(".toc-progress[data-topic]").forEach((node) => {
      const topic = node.dataset.topic;
      const total = Number(node.dataset.total || 0);
      let count = 0;
      for (let page = 1; page <= total; page += 1) if (storage.get(doneKey(topic, page))) count += 1;
      const bold = node.querySelector("b");
      if (bold) bold.textContent = String(count);
    });
    const main = document.querySelector("[data-topic]");
    const topic = main ? main.dataset.topic : pageData.topic;
    document.querySelectorAll(".toc li[data-page], .page-row[data-page]").forEach((item) => {
      const scopeTopic = item.closest("[data-topic]") ? item.closest("[data-topic]").dataset.topic : topic;
      const itemTopic = scopeTopic || topic || (document.querySelector(".toc-progress[data-topic]") || {}).dataset?.topic;
      item.classList.toggle("done", Boolean(storage.get(doneKey(itemTopic, item.dataset.page))));
    });
  }
  const doneBox = document.getElementById("done-box");
  if (doneBox) {
    const key = doneKey(doneBox.dataset.topic, doneBox.dataset.page);
    doneBox.checked = Boolean(storage.get(key));
    doneBox.addEventListener("change", () => {
      if (doneBox.checked) storage.set(key, "1");
      else storage.remove(key);
      refreshProgress();
    });
  }
  // 目录页的行：记录所属讲次，方便 refreshProgress 判断
  document.querySelectorAll(".index-main").forEach((main) => {
    const progress = main.querySelector(".toc-progress[data-topic]");
    if (progress) main.dataset.topic = progress.dataset.topic;
  });
  refreshProgress();

  // 记住上次读到哪一页，目录页显示「继续上次的进度」
  const readerMain = document.querySelector(".reader-main");
  if (readerMain) storage.set(`apt-last:${readerMain.dataset.topic}`, readerMain.dataset.page);
  const resumeLink = document.getElementById("resume-link");
  if (resumeLink) {
    const last = storage.get(`apt-last:${resumeLink.dataset.topic}`);
    if (last && Number(last) > 1) {
      resumeLink.href = `p${String(last).padStart(2, "0")}.html`;
      resumeLink.textContent = `继续上次的进度（第 ${last} 页）`;
      resumeLink.hidden = false;
    }
  }

  /* ---------------- 专注阅读 ---------------- */
  const layoutToggle = document.getElementById("layout-toggle");
  function applyLayout() {
    const focus = document.documentElement.classList.contains("focus-mode");
    if (layoutToggle) {
      layoutToggle.setAttribute("aria-pressed", String(focus));
      const label = layoutToggle.querySelector(".layout-label");
      if (label) label.textContent = focus ? "左右对照" : "专注阅读";
    }
  }
  if (layoutToggle) {
    layoutToggle.addEventListener("click", () => {
      const focus = !document.documentElement.classList.contains("focus-mode");
      document.documentElement.classList.toggle("focus-mode", focus);
      storage.set("apt-layout", focus ? "focus" : "split");
      applyLayout();
    });
    applyLayout();
  }

  /* ---------------- 字号 ---------------- */
  function changeFont(delta) {
    const current = Number(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) || 1;
    const next = Math.min(1.35, Math.max(0.85, Math.round((current + delta) * 100) / 100));
    document.documentElement.style.setProperty("--font-scale", String(next));
    storage.set("apt-font-scale", String(next));
  }
  const fontDown = document.getElementById("font-down");
  const fontUp = document.getElementById("font-up");
  if (fontDown) fontDown.addEventListener("click", () => changeFont(-0.05));
  if (fontUp) fontUp.addEventListener("click", () => changeFont(0.05));

  /* ---------------- 阅读进度条 ---------------- */
  const progressBar = document.querySelector(".read-progress span");
  if (progressBar) {
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener("scroll", () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- 课件放大 ---------------- */
  const lightbox = document.getElementById("lightbox");
  function openLightbox(src) {
    if (!lightbox) return;
    lightbox.querySelector("img").src = src;
    lightbox.classList.remove("zoomed");
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }
  document.querySelectorAll(".slide-zoom").forEach((button) => {
    button.addEventListener("click", () => openLightbox(button.dataset.full));
  });
  document.querySelectorAll(".crop img").forEach((image) => {
    image.style.cursor = "zoom-in";
    image.addEventListener("click", () => openLightbox(image.getAttribute("src")));
  });
  if (lightbox) {
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector("img").addEventListener("click", (event) => {
      event.stopPropagation();
      lightbox.classList.toggle("zoomed");
    });
    lightbox.querySelector(".lightbox-stage").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeLightbox();
    });
  }

  /* ---------------- 术语悬浮解释 ---------------- */
  const termPop = document.getElementById("term-pop");
  const termData = pageData.terms || {};
  let hideTimer = null;
  function escapeText(text) {
    return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function showTerm(element) {
    const entry = termData[element.dataset.term];
    if (!termPop || !entry) return;
    clearTimeout(hideTimer);
    termPop.innerHTML = `<strong>${escapeText(entry.term)}</strong>${entry.en ? `<span class="pop-en">${escapeText(entry.en)}</span>` : ""}` +
      `<p>${escapeText(entry.plain)}</p>` +
      `<p><a href="${siteRoot}glossary.html#term-${encodeURIComponent(element.dataset.term)}">在术语表中查看</a></p>`;
    termPop.hidden = false;
    const rect = element.getBoundingClientRect();
    const popRect = termPop.getBoundingClientRect();
    let left = Math.min(window.innerWidth - popRect.width - 10, Math.max(10, rect.left));
    let top = rect.bottom + 8;
    if (top + popRect.height > window.innerHeight - 10) top = rect.top - popRect.height - 8;
    termPop.style.left = `${left}px`;
    termPop.style.top = `${Math.max(10, top)}px`;
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (termPop) termPop.hidden = true; }, 180);
  }
  document.querySelectorAll(".term[data-term]").forEach((element) => {
    element.addEventListener("mouseenter", () => showTerm(element));
    element.addEventListener("mouseleave", scheduleHide);
    element.addEventListener("focus", () => showTerm(element));
    element.addEventListener("blur", scheduleHide);
    element.addEventListener("click", (event) => { event.preventDefault(); showTerm(element); });
  });
  if (termPop) {
    termPop.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    termPop.addEventListener("mouseleave", scheduleHide);
    window.addEventListener("scroll", () => { if (!termPop.hidden) termPop.hidden = true; }, { passive: true });
  }

  /* ---------------- 全站搜索 ---------------- */
  const searchPanel = document.getElementById("search-panel");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  let searchIndex = null;
  let activeResult = -1;

  async function loadIndex() {
    if (searchIndex) return searchIndex;
    try {
      const response = await fetch(`${siteRoot}assets/search.json`);
      searchIndex = await response.json();
    } catch (error) {
      searchIndex = [];
    }
    return searchIndex;
  }
  function highlight(text, terms) {
    let html = escapeText(text);
    for (const term of terms) {
      if (!term) continue;
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(safe, "gi"), (match) => `<mark>${match}</mark>`);
    }
    return html;
  }
  function snippetOf(text, terms) {
    const lower = text.toLowerCase();
    let position = -1;
    for (const term of terms) {
      position = lower.indexOf(term.toLowerCase());
      if (position >= 0) break;
    }
    if (position < 0) return text.slice(0, 90);
    const start = Math.max(0, position - 40);
    return (start > 0 ? "…" : "") + text.slice(start, position + 80) + "…";
  }
  async function runSearch() {
    const query = searchInput.value.trim();
    const index = await loadIndex();
    searchResults.innerHTML = "";
    activeResult = -1;
    if (!query) return;
    const terms = query.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const item of index) {
      let score = 0;
      for (const term of terms) {
        const needle = term.toLowerCase();
        const inTitle = `${item.t} ${item.e}`.toLowerCase().includes(needle);
        const inHeadings = (item.h || "").toLowerCase().includes(needle);
        const inText = (item.x || "").toLowerCase().includes(needle);
        if (!inTitle && !inHeadings && !inText) { score = 0; break; }
        score += (inTitle ? 10 : 0) + (inHeadings ? 4 : 0) + (inText ? 1 : 0);
      }
      if (score > 0) scored.push({ item, score });
    }
    scored.sort((a, b) => b.score - a.score);
    for (const { item } of scored.slice(0, 30)) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${siteRoot}${item.u}"><span class="r-kicker">${escapeText(item.k)}</span>` +
        `<span class="r-title">${highlight(item.t, terms)}</span>` +
        `<span class="r-snippet">${highlight(snippetOf(item.x || item.e || "", terms), terms)}</span></a>`;
      searchResults.appendChild(li);
    }
    if (!scored.length) searchResults.innerHTML = '<li><span class="r-snippet" style="padding:10px 12px;display:block">没有找到。换个关键词试试（中文、英文都可以）。</span></li>';
  }
  function openSearch() {
    if (!searchPanel) return;
    searchPanel.hidden = false;
    searchInput.focus();
    searchInput.select();
    loadIndex();
  }
  function closeSearch() { if (searchPanel) searchPanel.hidden = true; }
  function moveActive(step) {
    const items = [...searchResults.querySelectorAll("li")].filter((li) => li.querySelector("a"));
    if (!items.length) return;
    activeResult = (activeResult + step + items.length) % items.length;
    items.forEach((li, i) => li.classList.toggle("active", i === activeResult));
    items[activeResult].scrollIntoView({ block: "nearest" });
  }
  const searchOpen = document.getElementById("search-open");
  if (searchOpen) searchOpen.addEventListener("click", openSearch);
  if (searchPanel) {
    searchPanel.addEventListener("click", (event) => { if (event.target === searchPanel) closeSearch(); });
    let debounce = null;
    searchInput.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(runSearch, 120); });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); moveActive(1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); moveActive(-1); }
      else if (event.key === "Enter") {
        const items = [...searchResults.querySelectorAll("li a")];
        const target = items[Math.max(0, activeResult)];
        if (target) window.location.href = target.href;
      }
    });
  }

  /* ---------------- 术语表筛选 ---------------- */
  const glossaryFilter = document.getElementById("glossary-filter");
  if (glossaryFilter) {
    glossaryFilter.addEventListener("input", () => {
      const needle = glossaryFilter.value.trim().toLowerCase();
      document.querySelectorAll(".glossary-row").forEach((row) => {
        row.hidden = Boolean(needle) && !row.dataset.search.includes(needle);
      });
    });
  }

  /* ---------------- 键盘 ---------------- */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
      closeSearch();
      setTocOpen(false);
      if (termPop) termPop.hidden = true;
      return;
    }
    if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "/") { event.preventDefault(); openSearch(); return; }
    if (!readerMain || (lightbox && !lightbox.hidden) || (searchPanel && !searchPanel.hidden)) return;
    if (event.key === "ArrowLeft" && readerMain.dataset.prev) window.location.href = readerMain.dataset.prev;
    if (event.key === "ArrowRight" && readerMain.dataset.next) window.location.href = readerMain.dataset.next;
  });
})();
