/**
 * 交互演示（纯 SVG + 原生 JS，滚动到附近才初始化，不影响页面流畅度）。
 * 讲义里的写法：  ::: demo 演示名 标题
 *                  （可选）演示下方的说明文字
 *                  :::
 * 可用的演示名见文件末尾的 DEMOS 注册表。
 */
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const COLORS = {
    axis: "#6b7280",
    grid: "#eceae4",
    curve: "#1d4ed8",
    fill: "rgba(194, 65, 12, 0.22)",
    fillStrong: "rgba(194, 65, 12, 0.5)",
    stroke: "#c2410c",
    upper: "rgba(29, 78, 216, 0.14)",
    good: "#15803d",
    bad: "#b91c1c",
    muted: "#9ca3af",
  };

  /* ---------------- 小工具 ---------------- */

  function el(tag, attributes = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (parent) parent.appendChild(node);
    return node;
  }

  function html(tag, attributes = {}, parent = null, text = "") {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  /** 坐标系：把数学坐标映射到 SVG 像素 */
  function makePlot(parent, { width = 600, height = 300, xRange, yRange, pad = { l: 44, r: 16, t: 14, b: 30 } }) {
    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" }, parent);
    const plot = {
      svg, width, height, pad, xRange, yRange,
      sx: (x) => pad.l + ((x - plot.xRange[0]) / (plot.xRange[1] - plot.xRange[0])) * (width - pad.l - pad.r),
      sy: (y) => height - pad.b - ((y - plot.yRange[0]) / (plot.yRange[1] - plot.yRange[0])) * (height - pad.t - pad.b),
      layer: el("g", {}, svg),
    };
    return plot;
  }

  function drawAxes(plot, { xTicks = [], yTicks = [], xLabel = "x", yLabel = "" } = {}) {
    const g = el("g", {}, plot.svg);
    const [x0, x1] = plot.xRange;
    const [y0, y1] = plot.yRange;
    for (const t of yTicks) {
      el("line", { x1: plot.sx(x0), x2: plot.sx(x1), y1: plot.sy(t), y2: plot.sy(t), stroke: COLORS.grid }, g);
      const label = el("text", { x: plot.pad.l - 6, y: plot.sy(t) + 4, "text-anchor": "end", "font-size": 11, fill: COLORS.axis }, g);
      label.textContent = formatTick(t);
    }
    for (const t of xTicks) {
      const label = el("text", { x: plot.sx(t), y: plot.height - plot.pad.b + 16, "text-anchor": "middle", "font-size": 11, fill: COLORS.axis }, g);
      label.textContent = formatTick(t);
    }
    el("line", { x1: plot.sx(x0), x2: plot.sx(x1), y1: plot.sy(Math.max(y0, 0)), y2: plot.sy(Math.max(y0, 0)), stroke: COLORS.axis }, g);
    el("line", { x1: plot.sx(x0), x2: plot.sx(x0), y1: plot.sy(y0), y2: plot.sy(y1), stroke: COLORS.axis }, g);
    const xl = el("text", { x: plot.sx(x1) - 2, y: plot.sy(Math.max(y0, 0)) - 6, "text-anchor": "end", "font-size": 12, fill: COLORS.axis, "font-style": "italic" }, g);
    xl.textContent = xLabel;
    if (yLabel) {
      const yl = el("text", { x: plot.sx(x0) + 6, y: plot.sy(y1) + 12, "font-size": 12, fill: COLORS.axis, "font-style": "italic" }, g);
      yl.textContent = yLabel;
    }
    return g;
  }

  function formatTick(value) {
    if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
    return String(Math.round(value * 100) / 100);
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function pathFromFunction(plot, f, x0, x1, steps = 400, yClip = null) {
    let d = "";
    for (let i = 0; i <= steps; i += 1) {
      const x = x0 + ((x1 - x0) * i) / steps;
      let y = f(x);
      if (!Number.isFinite(y)) continue;
      if (yClip !== null) y = Math.min(y, yClip);
      d += `${d ? "L" : "M"}${plot.sx(x).toFixed(2)},${plot.sy(y).toFixed(2)}`;
    }
    return d;
  }

  function integrate(f, a, b, steps = 4000) {
    const h = (b - a) / steps;
    let total = 0;
    for (let i = 0; i < steps; i += 1) {
      const y = f(a + (i + 0.5) * h);
      if (Number.isFinite(y)) total += y * h;
    }
    return total;
  }

  function controls(root) { return html("div", { class: "demo-controls" }, root); }

  function slider(parent, { label, min, max, step = 1, value, onInput }) {
    const wrap = html("label", {}, parent);
    const text = html("span", {}, wrap, label);
    const input = html("input", { type: "range", min, max, step, value }, wrap);
    const out = html("b", {}, wrap, String(value));
    input.addEventListener("input", () => { out.textContent = input.value; onInput(Number(input.value)); });
    return { input, out, text, set(value) { input.value = value; out.textContent = String(value); } };
  }

  function select(parent, { label, options, onChange }) {
    const wrap = html("label", {}, parent);
    html("span", {}, wrap, label);
    const node = html("select", {}, wrap);
    for (const [value, text] of options) html("option", { value }, node, text);
    node.addEventListener("change", () => onChange(node.value));
    return node;
  }

  function button(parent, text, onClick) {
    const node = html("button", { type: "button" }, parent, text);
    node.addEventListener("click", onClick);
    return node;
  }

  function readout(root) { return html("p", { class: "demo-readout", "aria-live": "polite" }, root); }

  const fmt = (x, digits = 3) => (Number.isFinite(x) ? (Math.round(x * 10 ** digits) / 10 ** digits).toString() : "∞");

  /* ---------------- 1. 尖峰反例 ---------------- */

  function spikeDemo(root) {
    const plot = makePlot(root, { xRange: [0, 1], yRange: [0, 10] });
    const ctl = controls(root);
    const out = readout(root);
    const probeX = 0.3;
    let n = 3;
    function render() {
      clear(plot.svg);
      plot.yRange = [0, Math.max(5, n * 1.15)];
      const step = plot.yRange[1] > 30 ? 10 : plot.yRange[1] > 12 ? 5 : 1;
      const ticks = [];
      for (let t = 0; t <= plot.yRange[1]; t += step) ticks.push(t);
      drawAxes(plot, { xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: ticks, yLabel: "fₙ(x)" });
      el("rect", { x: plot.sx(0), y: plot.sy(n), width: plot.sx(1 / n) - plot.sx(0), height: plot.sy(0) - plot.sy(n), fill: COLORS.fill, stroke: COLORS.stroke }, plot.svg);
      el("line", { x1: plot.sx(1 / n), x2: plot.sx(1), y1: plot.sy(0), y2: plot.sy(0), stroke: COLORS.stroke, "stroke-width": 3 }, plot.svg);
      el("line", { x1: plot.sx(probeX), x2: plot.sx(probeX), y1: plot.sy(0), y2: plot.sy(plot.yRange[1]), stroke: COLORS.curve, "stroke-dasharray": "4 4" }, plot.svg);
      const label = el("text", { x: plot.sx(probeX) + 6, y: plot.sy(plot.yRange[1]) + 14, "font-size": 12, fill: COLORS.curve }, plot.svg);
      label.textContent = `x = ${probeX}`;
      const valueAtProbe = probeX <= 1 / n ? n : 0;
      out.innerHTML = `n = <b>${n}</b>：矩形宽 1/${n} ≈ ${fmt(1 / n)}，高 ${n}，面积 <b>= 1</b>。` +
        `在 x = ${probeX} 处 fₙ(${probeX}) = <b>${valueAtProbe}</b>。` +
        (n > 1 / probeX ? "此后这一点的函数值永远是 0（逐点收敛到 0），但面积始终是 1。" : "继续增大 n，看看这一点的值会怎样。");
    }
    slider(ctl, { label: "n", min: 1, max: 60, value: n, onInput: (v) => { n = v; render(); } });
    render();
  }

  /* ---------------- 2. 二进台阶逼近 sₙ ↑ f ---------------- */

  function dyadicDemo(root) {
    const functions = {
      square: { label: "f(x) = 3x²（最大值 3）", f: (x) => 3 * x * x, yMax: 3.2, integral: 1 },
      wave: { label: "f(x) = 1.5 + sin(2πx)", f: (x) => 1.5 + Math.sin(2 * Math.PI * x), yMax: 2.7, integral: 1.5 },
      root: { label: "f(x) = 1/√x（在 0 附近无界）", f: (x) => 1 / Math.sqrt(Math.max(x, 1e-9)), yMax: 7.5, integral: 2 },
    };
    let choice = "square";
    let n = 2;
    const plot = makePlot(root, { xRange: [0, 1], yRange: [0, 3.2] });
    const ctl = controls(root);
    const out = readout(root);
    function sn(x) {
      const value = functions[choice].f(x);
      const truncated = Math.min(value, n);
      return Math.floor(truncated * 2 ** n) / 2 ** n;
    }
    function render() {
      const spec = functions[choice];
      clear(plot.svg);
      plot.yRange = [0, spec.yMax];
      const ticks = [];
      for (let t = 0; t <= spec.yMax; t += spec.yMax > 5 ? 1 : 0.5) ticks.push(t);
      drawAxes(plot, { xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: ticks, yLabel: "y" });
      // 台阶（填充）
      const steps = 600;
      let d = `M${plot.sx(0)},${plot.sy(0)}`;
      for (let i = 0; i <= steps; i += 1) {
        const x = i / steps;
        d += `L${plot.sx(x).toFixed(2)},${plot.sy(sn(Math.min(x + 1e-9, 1))).toFixed(2)}`;
      }
      d += `L${plot.sx(1)},${plot.sy(0)}Z`;
      el("path", { d, fill: COLORS.fill, stroke: COLORS.stroke, "stroke-width": 1.2 }, plot.svg);
      // 截断线 y = n
      if (n < spec.yMax) {
        el("line", { x1: plot.sx(0), x2: plot.sx(1), y1: plot.sy(n), y2: plot.sy(n), stroke: COLORS.muted, "stroke-dasharray": "5 4" }, plot.svg);
        const t = el("text", { x: plot.sx(1) - 4, y: plot.sy(n) - 5, "text-anchor": "end", "font-size": 11, fill: COLORS.axis }, plot.svg);
        t.textContent = `截断高度 y = n = ${n}`;
      }
      el("path", { d: pathFromFunction(plot, spec.f, 0.0005, 1, 500, spec.yMax), fill: "none", stroke: COLORS.curve, "stroke-width": 2 }, plot.svg);
      const approx = integrate(sn, 0, 1, 6000);
      out.innerHTML = `n = <b>${n}</b>：台阶高度只能是 1/${2 ** n} 的整数倍，而且最高截到 ${n}。` +
        `∫sₙ ≈ <b>${fmt(approx)}</b>，∫f = <b>${fmt(spec.integral)}</b>。n 每加 1，台阶只会变高不会变低（sₙ ↑ f）。`;
    }
    select(ctl, { label: "函数", options: Object.entries(functions).map(([k, v]) => [k, v.label]), onChange: (v) => { choice = v; render(); } });
    slider(ctl, { label: "n", min: 1, max: 7, value: n, onInput: (v) => { n = v; render(); } });
    render();
  }

  /* ---------------- 3. 达布上和与下和 ---------------- */

  function darbouxDemo(root) {
    const functions = {
      square: { label: "f(x) = x²", f: (x) => x * x, yMax: 1.05 },
      jump: { label: "有一个跳跃的函数", f: (x) => (x < 0.5 ? 0.3 + 0.4 * x : 0.8 + 0.2 * x), yMax: 1.05 },
      wiggle: { label: "f(x) = 0.5 + 0.4 sin(8x)", f: (x) => 0.5 + 0.4 * Math.sin(8 * x), yMax: 1.0 },
    };
    let choice = "square";
    let cells = 4;
    const plot = makePlot(root, { xRange: [0, 1], yRange: [0, 1.05] });
    const ctl = controls(root);
    const out = readout(root);
    function render() {
      const spec = functions[choice];
      clear(plot.svg);
      plot.yRange = [0, spec.yMax];
      drawAxes(plot, { xTicks: [0, 0.5, 1], yTicks: [0, 0.5, 1], yLabel: "f(x)" });
      let lower = 0;
      let upper = 0;
      for (let j = 0; j < cells; j += 1) {
        const a = j / cells;
        const b = (j + 1) / cells;
        let m = Infinity;
        let M = -Infinity;
        for (let i = 0; i <= 60; i += 1) {
          const y = spec.f(a + ((b - a) * i) / 60 - (i === 60 ? 1e-9 : 0));
          m = Math.min(m, y);
          M = Math.max(M, y);
        }
        lower += m * (b - a);
        upper += M * (b - a);
        el("rect", { x: plot.sx(a), y: plot.sy(M), width: plot.sx(b) - plot.sx(a), height: plot.sy(m) - plot.sy(M), fill: COLORS.fillStrong, stroke: "none" }, plot.svg);
        el("rect", { x: plot.sx(a), y: plot.sy(m), width: plot.sx(b) - plot.sx(a), height: plot.sy(0) - plot.sy(m), fill: COLORS.upper, stroke: COLORS.curve, "stroke-width": 0.8 }, plot.svg);
      }
      el("path", { d: pathFromFunction(plot, spec.f, 0, 1, 400), fill: "none", stroke: "#111827", "stroke-width": 1.8 }, plot.svg);
      out.innerHTML = `分成 <b>${cells}</b> 段：下和 L = <b>${fmt(lower)}</b>（蓝色），上和 U = <b>${fmt(upper)}</b>（蓝色 + 橙色），` +
        `差 U − L = <b>${fmt(upper - lower)}</b>（橙色部分的面积）。段数越多，橙色越薄；能薄到任意小，就是黎曼可积。`;
    }
    select(ctl, { label: "函数", options: Object.entries(functions).map(([k, v]) => [k, v.label]), onChange: (v) => { choice = v; render(); } });
    slider(ctl, { label: "段数", min: 1, max: 64, value: cells, onInput: (v) => { cells = v; render(); } });
    render();
  }

  /* ---------------- 4. 黎曼竖切 vs 勒贝格横切 ---------------- */

  function riemannLebesgueDemo(root) {
    const f = (x) => 0.55 + 0.35 * Math.sin(2 * Math.PI * 1.5 * x) * Math.cos(2 * Math.PI * 0.4 * x);
    let mode = "lebesgue";
    let levels = 5;
    const plot = makePlot(root, { xRange: [0, 1], yRange: [0, 1], height: 360, pad: { l: 44, r: 16, t: 14, b: 92 } });
    const ctl = controls(root);
    const out = readout(root);
    function render() {
      clear(plot.svg);
      drawAxes(plot, { xTicks: [0, 0.5, 1], yTicks: [0, 0.5, 1], yLabel: "f(x)" });
      if (mode === "riemann") {
        for (let j = 0; j < levels; j += 1) {
          const a = j / levels;
          const b = (j + 1) / levels;
          const y = f((a + b) / 2);
          el("rect", { x: plot.sx(a), y: plot.sy(y), width: plot.sx(b) - plot.sx(a), height: plot.sy(0) - plot.sy(y), fill: COLORS.upper, stroke: COLORS.curve, "stroke-width": 0.8 }, plot.svg);
        }
        out.innerHTML = `黎曼：把 <b>x 轴</b>切成 ${levels} 个等长小区间，每个区间取一个高度。台阶的「底」永远是<b>区间</b>。`;
      } else {
        const colors = ["#fde68a", "#fdba74", "#fca5a5", "#c4b5fd", "#93c5fd", "#86efac", "#f9a8d4", "#a5b4fc", "#fcd34d", "#6ee7b7"];
        // 坐标刻度下方留出一块区域画「每一层的底」：每层一行彩条
        const baseY = plot.height - plot.pad.b + 30;
        const rowHeight = Math.min(5, 34 / levels);
        for (let k = 1; k <= levels; k += 1) {
          const level = k / (levels + 1);
          const color = colors[(k - 1) % colors.length];
          // 水平条带 {f ≥ level} 的部分
          const steps = 400;
          let inside = false;
          let start = 0;
          for (let i = 0; i <= steps; i += 1) {
            const x = i / steps;
            const on = i < steps && f(x) >= level;
            if (on && !inside) { inside = true; start = x; }
            if (!on && inside) {
              inside = false;
              el("rect", { x: plot.sx(start), y: plot.sy(level), width: plot.sx(x) - plot.sx(start), height: plot.sy(level - 1 / (levels + 1)) - plot.sy(level), fill: color, opacity: 0.85 }, plot.svg);
              el("rect", { x: plot.sx(start), y: baseY + (k - 1) * rowHeight, width: plot.sx(x) - plot.sx(start), height: Math.max(2, rowHeight - 1), fill: color }, plot.svg);
            }
          }
          el("line", { x1: plot.sx(0), x2: plot.sx(1), y1: plot.sy(level), y2: plot.sy(level), stroke: COLORS.muted, "stroke-dasharray": "3 4" }, plot.svg);
        }
        const note = el("text", { x: plot.sx(0), y: plot.height - 8, "font-size": 11, fill: COLORS.axis }, plot.svg);
        note.textContent = "坐标轴下方的彩条（第 k 行对应第 k 层）：这一层的底 {x : f(x) ≥ yₖ}，可以是好几段";
        out.innerHTML = `勒贝格：把 <b>y 轴</b>切成 ${levels} 层。每一层的「底」是集合 {x : f(x) ≥ yₖ}——它不一定是一个区间，可以是好几段，甚至很碎。这就是勒贝格要用「可测集」做台阶底的原因。`;
      }
      el("path", { d: pathFromFunction(plot, f, 0, 1, 400), fill: "none", stroke: "#111827", "stroke-width": 2 }, plot.svg);
    }
    select(ctl, { label: "切法", options: [["lebesgue", "勒贝格：按函数值横切"], ["riemann", "黎曼：按 x 轴竖切"]], onChange: (v) => { mode = v; render(); } });
    slider(ctl, { label: "份数", min: 2, max: 10, value: levels, onInput: (v) => { levels = v; render(); } });
    render();
  }

  /* ---------------- 5. 无穷次抛硬币：无穷多次 vs 有限次 ---------------- */

  function coinDemo(root) {
    const total = 80;
    let mode = "fair";
    let N = 20;
    let tosses = [];
    const svg = el("svg", { viewBox: "0 0 600 120", role: "img" }, root);
    const ctl = controls(root);
    const out = readout(root);
    function probability(n) { return mode === "fair" ? 0.5 : Math.min(1, 1 / (n * n) * 2); }
    function toss() { tosses = Array.from({ length: total }, (_, i) => Math.random() < probability(i + 1)); render(); }
    function render() {
      clear(svg);
      const size = 600 / total;
      tosses.forEach((head, i) => {
        const n = i + 1;
        el("rect", { x: i * size + 0.5, y: 30, width: size - 1, height: 34, rx: 2, fill: head ? "#1d4ed8" : "#e5e7eb", opacity: n >= N ? 1 : 0.35 }, svg);
      });
      el("line", { x1: (N - 1) * size, x2: (N - 1) * size, y1: 18, y2: 76, stroke: COLORS.stroke, "stroke-width": 2 }, svg);
      const t = el("text", { x: (N - 1) * size + 4, y: 14, "font-size": 12, fill: COLORS.stroke }, svg);
      t.textContent = `从第 N = ${N} 次起`;
      const label = el("text", { x: 0, y: 96, "font-size": 11, fill: COLORS.axis }, svg);
      label.textContent = "蓝色 = 正面 H，灰色 = 反面 T（只画前 80 次；真实的序列无穷长）";
      const heads = tosses.map((h, i) => (h ? i + 1 : 0)).filter(Boolean);
      const afterN = heads.filter((n) => n >= N);
      const last = heads.length ? heads[heads.length - 1] : null;
      out.innerHTML = (mode === "fair"
        ? "公平硬币：每次正面概率都是 1/2。"
        : "正面概率越来越小：第 n 次为 2/n²（Σ 2/n² < ∞）。") +
        ` 前 80 次共 <b>${heads.length}</b> 次正面，最后一次在第 <b>${last ?? "—"}</b> 次。` +
        `从第 ${N} 次往后还出现正面吗？<b>${afterN.length ? `是（${afterN.length} 次）` : "否"}</b>。` +
        "「无穷多次正面」＝ 对<b>每一个</b> N，从第 N 次往后都还有正面。";
    }
    select(ctl, { label: "硬币", options: [["fair", "公平硬币"], ["fading", "正面概率越来越小"]], onChange: (v) => { mode = v; toss(); } });
    slider(ctl, { label: "N", min: 1, max: total, value: N, onInput: (v) => { N = v; render(); } });
    button(ctl, "重新抛一遍", toss);
    toss();
  }

  /* ---------------- 6. 生成的 σ-代数（Ω = {1,2,3,4}） ---------------- */

  function sigmaDemo(root) {
    const omega = [1, 2, 3, 4];
    const generators = [new Set([1, 2]), new Set()];
    const box = html("div", { class: "sigma-ui" }, root);
    const out = readout(root);
    const listNode = html("div", { class: "sigma-list" }, root);
    function setName(set) { return set.size ? `{${[...set].sort().join(", ")}}` : "∅"; }
    function render() {
      clear(box);
      generators.forEach((generator, index) => {
        const row = html("div", { class: "sigma-row" }, box);
        html("span", { class: "sigma-label" }, row, `生成集 C${index + 1} =`);
        for (const w of omega) {
          const chip = html("button", { type: "button", class: `sigma-chip${generator.has(w) ? " on" : ""}` }, row, String(w));
          chip.addEventListener("click", () => { if (generator.has(w)) generator.delete(w); else generator.add(w); render(); });
        }
        html("span", { class: "sigma-set" }, row, setName(generator));
      });
      // 原子：对每个生成集「属于 / 不属于」的模式相同的点归为一组
      const atoms = new Map();
      for (const w of omega) {
        const key = generators.map((g) => (g.has(w) ? 1 : 0)).join("");
        if (!atoms.has(key)) atoms.set(key, new Set());
        atoms.get(key).add(w);
      }
      const atomList = [...atoms.values()];
      const members = [];
      for (let mask = 0; mask < 2 ** atomList.length; mask += 1) {
        const union = new Set();
        atomList.forEach((atom, i) => { if (mask & (1 << i)) atom.forEach((w) => union.add(w)); });
        members.push(union);
      }
      members.sort((a, b) => a.size - b.size || setName(a).localeCompare(setName(b)));
      out.innerHTML = `「原子」（最小的不可再分的块）：<b>${atomList.map(setName).join("，")}</b>。` +
        `σ(C₁, C₂) 恰好由原子的所有并组成，共 2<sup>${atomList.length}</sup> = <b>${members.length}</b> 个集合：`;
      clear(listNode);
      for (const m of members) html("span", { class: "sigma-member" }, listNode, setName(m));
    }
    render();
  }

  /* ---------------- 7. 收敛定理实验台 ---------------- */

  function convergenceDemo(root) {
    const sequences = {
      mct: {
        label: "MCT：fₙ = min(n, 1/√x) ↑ 1/√x",
        f: (n, x) => Math.min(n, 1 / Math.sqrt(Math.max(x, 1e-12))),
        limit: (x) => 1 / Math.sqrt(Math.max(x, 1e-12)),
        integralN: (n) => 2 - 1 / n,
        limitIntegral: 2, xRange: [0, 1], yMax: 8,
        verdict: "非负且单调递增 ⇒ MCT 适用：∫fₙ ↑ ∫f = 2。",
      },
      spike: {
        label: "尖峰：fₙ = n·𝟏[0,1/n] → 0",
        f: (n, x) => (x <= 1 / n ? n : 0),
        limit: () => 0,
        integralN: () => 1,
        limitIntegral: 0, xRange: [0, 1], yMax: 12,
        verdict: "不单调、也没有可积的上界 ⇒ MCT、DCT 都不适用；Fatou 只给出 0 ≤ 1。",
      },
      fatou: {
        label: "Fatou 严格不等：𝟏[0,½] 与 𝟏(½,1] 交替",
        f: (n, x) => (n % 2 === 0 ? (x <= 0.5 ? 1 : 0) : (x > 0.5 ? 1 : 0)),
        limit: () => 0,
        integralN: () => 0.5,
        limitIntegral: 0, xRange: [0, 1], yMax: 1.4, limitLabel: "lim inf fₙ = 0",
        verdict: "fₙ 不收敛，但 lim inf fₙ = 0：∫ lim inf fₙ = 0 < ½ = lim inf ∫fₙ。Fatou 的不等号可以是严格的。",
      },
      dct: {
        label: "DCT：fₙ = xⁿ，被 g ≡ 1 控制",
        f: (n, x) => x ** n,
        limit: (x) => (x < 1 ? 0 : 1),
        integralN: (n) => 1 / (n + 1),
        limitIntegral: 0, xRange: [0, 1], yMax: 1.2,
        verdict: "|xⁿ| ≤ 1 且 1 在 [0,1] 上可积，fₙ → 0 几乎处处 ⇒ DCT（也是 BCT）适用：∫fₙ → 0。",
      },
      slide: {
        label: "滑走的方块：fₙ = 𝟏[n, n+1]（在整个实数轴上）",
        f: (n, x) => (x >= n && x <= n + 1 ? 1 : 0),
        limit: () => 0,
        integralN: () => 1,
        limitIntegral: 0, xRange: [0, 12], yMax: 1.4,
        verdict: "测度 μ(ℝ) = ∞，没有可积的上界 ⇒ BCT、DCT 都不适用：每个 x 最终都是 0，积分却恒为 1。",
      },
    };
    let choice = "mct";
    let n = 3;
    const plot = makePlot(root, { xRange: [0, 1], yRange: [0, 8] });
    const ctl = controls(root);
    const out = readout(root);
    function render() {
      const spec = sequences[choice];
      clear(plot.svg);
      plot.xRange = spec.xRange;
      plot.yRange = [0, spec.yMax];
      const ticks = [];
      const step = spec.yMax > 5 ? 2 : 0.5;
      for (let t = 0; t <= spec.yMax; t += step) ticks.push(t);
      const xTicks = spec.xRange[1] > 2 ? [0, 2, 4, 6, 8, 10, 12] : [0, 0.5, 1];
      drawAxes(plot, { xTicks, yTicks: ticks, yLabel: "y" });
      const [x0, x1] = spec.xRange;
      const samples = 800;
      let d = `M${plot.sx(x0)},${plot.sy(0)}`;
      for (let i = 0; i <= samples; i += 1) {
        const x = x0 + ((x1 - x0) * i) / samples;
        d += `L${plot.sx(x).toFixed(2)},${plot.sy(Math.min(spec.f(n, Math.max(x, 1e-9)), spec.yMax)).toFixed(2)}`;
      }
      d += `L${plot.sx(x1)},${plot.sy(0)}Z`;
      el("path", { d, fill: COLORS.fill, stroke: COLORS.stroke, "stroke-width": 1.4 }, plot.svg);
      el("path", { d: pathFromFunction(plot, spec.limit, x0 + 1e-4, x1, 500, spec.yMax), fill: "none", stroke: COLORS.curve, "stroke-width": 2, "stroke-dasharray": "6 4" }, plot.svg);
      const legend = el("text", { x: plot.sx(x1) - 4, y: plot.sy(spec.yMax) + 14, "text-anchor": "end", "font-size": 12, fill: COLORS.curve }, plot.svg);
      legend.textContent = `虚线：${spec.limitLabel || "极限函数 f"}`;
      out.innerHTML = `n = <b>${n}</b>：∫fₙ = <b>${fmt(spec.integralN(n))}</b>；∫(极限) = <b>${fmt(spec.limitIntegral)}</b>。${spec.verdict}`;
    }
    select(ctl, { label: "例子", options: Object.entries(sequences).map(([k, v]) => [k, v.label]), onChange: (v) => { choice = v; render(); } });
    slider(ctl, { label: "n", min: 1, max: 40, value: n, onInput: (v) => { n = v; render(); } });
    render();
  }

  /* ---------------- 8. 逆变换抽样（第 2 讲） ---------------- */

  function inverseTransformDemo(root) {
    const laws = {
      exp: {
        label: "指数分布 exp(1)",
        F: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)),
        Q: (u) => -Math.log(1 - u),
        xRange: [-0.5, 5],
      },
      mixed: {
        label: "混合型（第 13 页例 12）",
        F: (x) => (x < 0 ? 0 : x < 1 ? 0.5 : x < 2 ? x / 2 : 1),
        Q: (u) => (u <= 0.5 ? 0 : 2 * u),
        xRange: [-0.5, 2.5],
      },
      discrete: {
        label: "离散：取 0、1、2 的概率为 0.2、0.5、0.3",
        F: (x) => (x < 0 ? 0 : x < 1 ? 0.2 : x < 2 ? 0.7 : 1),
        Q: (u) => (u <= 0.2 ? 0 : u <= 0.7 ? 1 : 2),
        xRange: [-0.5, 2.5],
      },
    };
    let choice = "mixed";
    let u = 0.6;
    const plot = makePlot(root, { xRange: [-0.5, 2.5], yRange: [0, 1.05] });
    const ctl = controls(root);
    const out = readout(root);
    function render() {
      const spec = laws[choice];
      clear(plot.svg);
      plot.xRange = spec.xRange;
      drawAxes(plot, { xTicks: choice === "exp" ? [0, 1, 2, 3, 4, 5] : [0, 1, 2], yTicks: [0, 0.25, 0.5, 0.75, 1], yLabel: "F(x)" });
      // CDF：逐段画，跳跃处留空心 / 实心点
      const [x0, x1] = spec.xRange;
      const steps = 700;
      let d = "";
      let previous = null;
      for (let i = 0; i <= steps; i += 1) {
        const x = x0 + ((x1 - x0) * i) / steps;
        const y = spec.F(x);
        if (previous !== null && Math.abs(y - previous) > 0.02) {
          el("circle", { cx: plot.sx(x), cy: plot.sy(previous), r: 3.5, fill: "#fff", stroke: COLORS.curve, "stroke-width": 1.5 }, plot.svg);
          el("circle", { cx: plot.sx(x), cy: plot.sy(y), r: 3.5, fill: COLORS.curve }, plot.svg);
          d += `M${plot.sx(x).toFixed(2)},${plot.sy(y).toFixed(2)}`;
        } else {
          d += `${d ? "L" : "M"}${plot.sx(x).toFixed(2)},${plot.sy(y).toFixed(2)}`;
        }
        previous = y;
      }
      el("path", { d, fill: "none", stroke: COLORS.curve, "stroke-width": 2 }, plot.svg);
      const q = spec.Q(u);
      el("line", { x1: plot.sx(x0), x2: plot.sx(q), y1: plot.sy(u), y2: plot.sy(u), stroke: COLORS.stroke, "stroke-width": 1.6, "stroke-dasharray": "5 3" }, plot.svg);
      el("line", { x1: plot.sx(q), x2: plot.sx(q), y1: plot.sy(u), y2: plot.sy(0), stroke: COLORS.stroke, "stroke-width": 1.6, "stroke-dasharray": "5 3" }, plot.svg);
      el("circle", { cx: plot.sx(q), cy: plot.sy(0), r: 5, fill: COLORS.stroke }, plot.svg);
      out.innerHTML = `u = <b>${u}</b>：从纵轴 u 处向右走，碰到 F 的图像（跳跃处的竖直缺口也算）再往下落，落点就是 Q(u) = inf{x : F(x) ≥ u} = <b>${fmt(q)}</b>。` +
        "u 在 (0,1) 上均匀地随机取值时，落点 Q(u) 的分布正好是 F。";
    }
    select(ctl, { label: "分布", options: Object.entries(laws).map(([k, v]) => [k, v.label]), onChange: (v) => { choice = v; render(); } });
    slider(ctl, { label: "u", min: 0.01, max: 0.99, step: 0.01, value: u, onInput: (v) => { u = v; render(); } });
    render();
  }

  /* ---------------- 9. 打字机序列（第 3 讲） ---------------- */

  function typewriterDemo(root) {
    let n = 5;
    let omega = 0.3;
    const svg = el("svg", { viewBox: "0 0 600 190", role: "img" }, root);
    const ctl = controls(root);
    const out = readout(root);
    function interval(index) {
      const m = Math.floor(Math.log2(index));
      const k = index - 2 ** m;
      return { m, k, a: k / 2 ** m, b: (k + 1) / 2 ** m };
    }
    function render() {
      clear(svg);
      const left = 30;
      const right = 570;
      const sx = (x) => left + x * (right - left);
      const { m, k, a, b } = interval(n);
      el("line", { x1: sx(0), x2: sx(1), y1: 40, y2: 40, stroke: COLORS.axis }, svg);
      el("rect", { x: sx(a), y: 28, width: sx(b) - sx(a), height: 24, fill: COLORS.fillStrong, stroke: COLORS.stroke }, svg);
      el("line", { x1: sx(omega), x2: sx(omega), y1: 18, y2: 62, stroke: COLORS.curve, "stroke-width": 2 }, svg);
      const lw = el("text", { x: sx(omega) + 4, y: 16, "font-size": 12, fill: COLORS.curve }, svg);
      lw.textContent = `ω = ${omega}`;
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const label = el("text", { x: sx(t), y: 76, "text-anchor": "middle", "font-size": 11, fill: COLORS.axis }, svg);
        label.textContent = String(t);
      }
      // 固定 ω 的取值序列 X_1(ω), ..., X_63(ω)
      const count = 63;
      const w = (right - left) / count;
      for (let i = 1; i <= count; i += 1) {
        const iv = interval(i);
        const value = omega >= iv.a && omega < iv.b ? 1 : 0;
        el("rect", { x: left + (i - 1) * w + 0.5, y: value ? 110 : 140, width: w - 1, height: value ? 36 : 6, fill: value ? COLORS.curve : "#d1d5db", opacity: i === n ? 1 : 0.75 }, svg);
      }
      el("line", { x1: left + (n - 0.5) * w, x2: left + (n - 0.5) * w, y1: 100, y2: 152, stroke: COLORS.stroke, "stroke-width": 1.5 }, svg);
      const cap = el("text", { x: left, y: 172, "font-size": 11, fill: COLORS.axis }, svg);
      cap.textContent = "下方：固定这个 ω，X₁(ω), X₂(ω), …, X₆₃(ω) 的取值（高条 = 1，矮条 = 0）";
      out.innerHTML = `n = <b>${n}</b> = 2<sup>${m}</sup> + ${k}：Xₙ 是区间 [${k}/${2 ** m}, ${k + 1}/${2 ** m}) 的示性函数，P(Xₙ ≠ 0) = 1/${2 ** m} → 0，所以<b>依概率收敛到 0</b>。` +
        "但固定任何 ω，每一「层」里都恰好有一次取 1，所以 Xₙ(ω) 无穷多次等于 1：<b>处处不收敛</b>。";
    }
    slider(ctl, { label: "n", min: 1, max: 63, value: n, onInput: (v) => { n = v; render(); } });
    slider(ctl, { label: "ω", min: 0, max: 0.99, step: 0.01, value: omega, onInput: (v) => { omega = v; render(); } });
    render();
  }

  /* ---------------- 注册与懒加载 ---------------- */

  const DEMOS = {
    spike: spikeDemo,
    dyadic: dyadicDemo,
    darboux: darbouxDemo,
    "riemann-lebesgue": riemannLebesgueDemo,
    coins: coinDemo,
    sigma: sigmaDemo,
    convergence: convergenceDemo,
    "inverse-transform": inverseTransformDemo,
    typewriter: typewriterDemo,
  };

  function mount(box) {
    if (box.dataset.mounted) return;
    box.dataset.mounted = "1";
    const factory = DEMOS[box.dataset.demo];
    const body = box.querySelector(".box-body");
    if (!factory || !body) return;
    const root = document.createElement("div");
    root.className = "demo-ui";
    body.insertBefore(root, body.firstChild);
    try { factory(root); } catch (error) { root.textContent = `演示加载失败：${error.message}`; }
  }

  function init() {
    const boxes = document.querySelectorAll(".box-demo[data-demo]");
    if (!boxes.length) return;
    if (!("IntersectionObserver" in window)) { boxes.forEach(mount); return; }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { mount(entry.target); observer.unobserve(entry.target); }
      }
    }, { rootMargin: "600px 0px" });
    boxes.forEach((box) => observer.observe(box));
  }

  window.APT_DEMOS = DEMOS;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
