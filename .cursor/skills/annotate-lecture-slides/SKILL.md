---
name: annotate-lecture-slides
description: 把高等概率论课件（PDF）逐页整理成零基础也能自学的中文交互式讲义网页（VitePress + KaTeX）。在为本仓库新增/修改任何一页讲解、补全留白课件、或新增一讲课件时使用。
---

# 逐页讲义写作规范（annotate-lecture-slides）

## 0. 读者画像（最重要）

- 读者是**数学基础非常差、英语也不好**的研究生。上课完全没听懂。
- 目标：**只看我们的网页就能自学看懂课件**。不是翻译 PPT，而是"一个耐心的助教坐在旁边，一句一句讲给你听"。
- 失败的标准：只放翻译、只复述课件、跳步骤、用"显然""易知"、符号不解释就用、没有例子。

## 1. 仓库结构

```
docs/
  .vitepress/config.mts      站点配置（侧边栏按 frontmatter 自动生成）
  .vitepress/md-setup.mjs    KaTeX 宏 + 彩色知识框容器
  .vitepress/theme/          主题、样式、组件（SlideFrame、widgets/）
  public/slides/t{1,2,3}/pNN.webp   课件每页图片（PDF 页码，两位数）
  topic1/ topic2/ topic3/    每个 PDF 页一个文件 pNN.md，另有 index.md（本讲导览）
  basics/                    零基础数学补课
  glossary.md                符号读法与中英术语表
概率论/                      原始 PDF
scripts/check-md.mjs         Markdown 快速检查
```

## 2. 每页文件的固定格式

文件名：`docs/topic{T}/p{NN}.md`，`NN` = **PDF 页码**（两位数）。

```markdown
---
title: 中文标题（准确、通俗，可带一个冒号副标题）
short: 侧边栏短标题（不超过 12 个汉字）
en: 课件上的英文原标题
topic: 1
page: 5          # PDF 页码
slide: 5         # 课件右下角印的页码；没有（纯手写附页）则写 null
section: 一、概率空间与可测事件   # 必须与分配给你的章节名完全一致
---

# 中文标题

<p class="en-title">English slide title</p>

<SlideFrame t="1" p="5" />

::: roadmap 30 秒看懂这一页
2–4 句话：这一页想解决什么问题、结论是什么、和前后页的关系。
:::

## 课件原文与翻译
## 老师手写批注整理        （Topic 1 有手写批注的页必须有）
## 板书补全                （Topic 2/3 课件留白的页必须有）
## 逐句精讲
## 例子                    （可以穿插在逐句精讲中，但至少要有 1–2 个带具体数字的完整例子）
## 图示讲解                （课件或批注里有图/示意时必须有）
## 易错点
## 本页小结
## 自测
## 英文词汇
```

- 所有 `##` 小标题会出现在右侧"本页小标题"导航里；**课件自己的小标题（如 "Sometimes it works" / "Why the translates work" / "Proof"）必须保留**，用 `###` 或放在知识框标题里，不能丢。
- 纯目录页 / "Where we are" 页可以精简，但仍要讲清楚：这一节要学什么、为什么学、和前面有什么关系；并把该页的手写批注（如有）完整整理和讲解。

### 参考样板

**动笔前先完整阅读 `docs/topic1/p05.md`**，它是质量标准：深度、语气、结构、框的用法都照它来。

## 3. 知识框（容器）

写法：`::: 类型 标题（可选，可含 $公式$）` …… `:::`

| 类型 | 标签 | 用途 |
|---|---|---|
| `slide` | 课件原文 | 课件上的英文原文，公式用 KaTeX 规范重排（不要截图） |
| `trans` | 中文翻译 | 紧跟在 slide 后面的逐句中文翻译 |
| `handnote` | 手写批注整理 | Topic 1 老师的手写内容，按位置分组、规范重排 |
| `fill` | 板书补全 | 课件留白处老师课上会写的完整内容（定义/定理/证明/例子） |
| `def` | 定义 | 数学定义（精讲中重述时用） |
| `thm` | 定理 | 定理/命题/引理/推论（标题里写清楚是哪一种） |
| `proof` | 证明 | 证明（每一步都要写出理由，自动在末尾加 ∎） |
| `example` | 例子 | 带具体数字的例子 |
| `intuition` | 直观理解 | 比喻、图像化理解 |
| `prereq` | 基础补课 | 就地补讲需要的基础知识（集合、函数、极限、求和、上确界……） |
| `figure` | 图示讲解 | 解释课件/批注里的图、箭头、框图、示意 |
| `pitfall` | 易错点 | 常见误解 |
| `remark` | 补充说明 | 延伸内容、背景 |
| `summary` | 本页小结 | 3–5 条要点 |
| `quiz` | 自测 | 题目 + 折叠答案 |
| `vocab` | 英文词汇 | 表格：英文 / 中文 / 说明 |
| `roadmap` | 学习路线 | 页首 "30 秒看懂这一页" |

**嵌套规则**：外层用 4 个冒号，内层 3 个冒号。答案用 VitePress 自带的折叠块：

```markdown
:::: quiz 动手试一试
**第 1 题** ……

::: details 点击查看答案
……
:::
::::
```

## 4. 公式（KaTeX，构建时预渲染）

- 行内 `$...$`，独立公式 `$$...$$`（`$$` 单独占一行）。多行对齐用 `\begin{aligned} ... \end{aligned}`，分段函数用 `\begin{cases} ... \end{cases}`。
- 可用宏：`\R \N \Q \Z`（黑板体数集）、`\P \E`（概率、期望）、`\1`（示性函数的粗体 1，写 `\1_A`）、`\dd`（直立的 d，如 `\int f\,\dd\mu`）、`\Var \Cov \Leb`。
- 集合花括号写 `\{ \}`；集合构造用 `\{x : f(x)>a\}` 或 `\{x \mid \dots\}`。
- **公式里不要出现汉字或全角标点**；需要文字时用 `\text{...}`（`\text{}` 里可以写中文）。
- **数学公式之外不要出现 `{{` 或 `}}`**（Vue 会当成插值导致构建失败）。
- 所有数学符号都放进公式里：写 $\omega\in\Omega$，不要写 ω∈Ω 的纯文本。
- 追求美观：`\,` 调间距、`\left( \right)` 配大括号、`\underbrace{}_{\text{说明}}` 标注、`\overset{}{}`/`\stackrel` 标注推理依据（如 $\overset{\text{MCT}}{=}$）。长推导用 `aligned` 分行并在右侧用 `&\quad(\text{理由})` 写理由。

## 5. 准确性要求

- 课件图片高清版：`/tmp/work/hires/t{T}/p-NN.png`（Topic 1 为 220dpi，Topic 2/3 为 400dpi）。网页用图：`docs/public/slides/t{T}/pNN.webp`。
- **必须亲自看图**。手写字迹要放大看：用 Python/Pillow 裁剪局部并放大 2–3 倍后再用 Read 工具查看，例如
  `python3 -c "from PIL import Image; im=Image.open('/tmp/work/hires/t1/p-05.png'); w,h=im.size; im.crop((0,int(h*.2),w,int(h*.6))).save('/tmp/crop.png')"`
- PDF 文字层（`pdftotext -f N -l N -layout 文件.pdf -`）在 Topic 1 中**大量乱码**：`⌦`=Ω，`!`=ω，`2`=∈，`✓`=⊆，`\`=∩，`[`=∪，`⇤`=*，`⇠`=∼，`()`=⟺，`≤` 等符号经常丢失；手写部分 OCR 基本不可用。只能作参考，**以图片为准**。
- 手写字迹确实认不清时，写出最合理的数学推测，并标注"（字迹不清，按上下文推测为……）"。老师手写的笔误要在讲解中温和指出并给出正确写法。
- Topic 2/3 的留白页：根据标题、定义编号和上下文，**补全老师在课上会写的完整、严谨的内容**（与标准研究生教材一致：Durrett、Billingsley、Williams、Folland 等），记号与课件保持一致，放在 `::: fill` 里，并在前面说明"课件此处留白，以下为按标准教材补全的板书内容"。证明要完整，不能只给结论。
- 数学必须正确。每个定理的条件都要写全，并解释**每个条件为什么需要**（最好给出去掉条件后的反例）。

## 6. 讲解要求（写给零基础的人）

1. **每个符号第一次出现就解释**：怎么读、是什么意思、为什么用它（例如 $\sup$、$\bigcup_{n\ge1}$、$\uparrow$、a.e.、$:=$、$\iff$）。
2. **逐句讲**：课件上的每一句话、每一个公式、每一条手写批注，都要有对应的中文讲解，不能跳过。
3. **先直观、后严格**：先用比喻/图像/小例子说清楚"它想干什么"，再解释严格表述。
4. **每个推导都拆成小步**，每一步写理由（用了哪个定义/性质/前面哪一页的结论，可链接到对应页，如 `[第 13 页](/topic1/p13)`）。禁止"显然""易证"。
5. **例子**：至少 1–2 个带具体数字、可以手算的例子；抽象定理要配"满足条件的例子 + 不满足条件时失效的反例"。
6. **图示**：课件和批注里的图（Venn 图、箭头、曲线、框图）要逐一讲清楚画的是什么、说明了什么。必要时自己用文字/表格/公式重新"画"一遍，或嵌入交互组件。
7. **基础补课就地进行**：遇到读者可能不会的基础（集合运算、函数、极限、级数、上下确界、可数性、ε-δ……），就地放一个 `::: prereq` 讲清楚，不要只说"见某某教材"。也可链接到 `/basics/` 下的补课页。
8. 语气亲切但准确，用"我们""你可以这样想"。中文为主，关键术语第一次出现时写"中文（English）"。
9. 篇幅：内容多的页通常 250–600 行 Markdown；宁可讲透，不要注水。

## 7. 交互组件（可选嵌入）

`docs/.vitepress/theme/components/widgets/` 下的 `.vue` 文件会按文件名自动注册，直接在 Markdown 里写 `<组件名 />` 即可（单独一行，前后空行）。计划中的组件：

| 组件 | 内容 | 适用页 |
|---|---|---|
| `<VennEvents />` | 两个事件的 Venn 图：并、交、补、差、De Morgan | T1 p06 p09 |
| `<InfiniteTosses />` | 无穷次抛硬币：$H_n$、"无穷多次正面"（limsup）与"最终都是反面"（liminf） | T1 p07 |
| `<ContinuityOfMeasure />` | 测度的上/下连续性，及 $[n,\infty)$ 反例 | T1 p13 p14 |
| `<RationalCover />` | 用长度 $\varepsilon/2^n$ 的区间覆盖有理数：可数覆盖 vs 有限覆盖 | T1 p17 p18 |
| `<TailSupInf />` | 数列的尾部上/下确界 → limsup/liminf | T1 p40，T3 p03 |
| `<DarbouxSums />` | 上/下 Darboux 和随分割加细 | T1 p25 |
| `<RiemannVsLebesgue />` | 竖切（Riemann）vs 横切（Lebesgue） | T1 p26 |
| `<DyadicApprox />` | 二进简单函数 $s_n\uparrow f$ | T1 p34 |
| `<MonotoneConvergence />` | 单调收敛：$f_n\uparrow f$ 时积分也收敛 | T1 p36 |
| `<SpikeDemo />` | 尖峰 $n\1_{(0,1/n)}$：逐点趋于 0 但面积恒为 1 | T1 p39，T3 p19 |
| `<CdfExplorer />` | CDF 图像、跳跃、$\E X=\int_0^\infty(1-F)-\int_{-\infty}^0F$ 的面积 | T2 p08–p13 |
| `<InverseTransform />` | 逆变换抽样 $X=Q_F(U)$（指数分布） | T2 p14 p15 |
| `<CantorSet />` | Cantor 集的迭代与 Cantor 函数（魔鬼阶梯） | T2 p18 p19 |
| `<JensenDemo />` | 凸函数、支撑线与 Jensen 不等式 | T2 p23 p24 |
| `<TailBounds />` | 真实尾概率 vs Markov/Chebyshev/Cantelli 界 | T2 p28–p32 |
| `<BorelCantelliSim />` | 独立事件 $\P(A_n)=n^{-p}$ 的模拟：有限次 vs 无穷多次 | T3 p04–p08 |
| `<TypewriterSeq />` | 打字机序列：依概率收敛但不几乎必然收敛 | T3 p15 p16 |
| `<DensityConvergence />` | 密度收敛与 Scheffé：$\sup_A|P_n(A)-P(A)|=\tfrac12\int|f_n-f|$ | T3 p22–p25 |
| `<ImportanceSampling />` | 均匀抽样 vs 重要性抽样估计 $\int_0^1 x^{-\alpha}e^{-x}\dd x$ | T3 p36–p40 |
| `<GaussianTilt />` | 高斯平移换测度与稀有事件抽样 | T3 p41–p45 |

组件不存在时不会导致构建失败（只是不显示），所以可以放心引用上表中的组件。

## 8. 检查与协作规则

- 写完每个文件都运行：`node scripts/check-md.mjs docs/topicT/pNN.md`，必须全部通过。
- 需要验证真实构建时，在隔离副本里构建（不要在 /workspace 里直接 build，不要开 dev 服务器）：
  ```bash
  W=/tmp/wk-$RANDOM; mkdir -p $W && cp -r /workspace/docs /workspace/package.json $W/ && ln -s /workspace/node_modules $W/node_modules && cd $W && npx vitepress build docs 2>&1 | tail -5; rm -rf $W
  ```
- 只修改分配给你的文件；不要改配置、主题、别人的页面；不要 git commit / push。
