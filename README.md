# 高等概率论 · 逐页精讲

面向数学基础薄弱同学的课件复习网站：**左边是课件原页，右边是中文精讲**。每一页都按同一个顺序讲：

这一页在讲什么 → 先补基础 → 课件原文逐句精读 → 老师板书在说什么（第 2–4 讲为「补全课件留白」）→ 图解 → 例子 → 推导 → 常见疑问与易错点 → 小结与自测

在线阅读：<https://kzczc.github.io/Advanced-Probability-Theory/>

## 网站功能

- 课件原页固定在左侧，点击可放大看清手写笔记；`←` `→` 键翻页
- 公式在构建时由 KaTeX 排好版，打开和滚动都不卡
- 正文字体：Times New Roman（西文）+ 宋体（中文）
- 「本页小标题」导航、全站搜索（按 `/`）、术语悬浮解释、术语表、基础补课
- 「这一页我看懂了」进度记录（只存在你自己的浏览器里）
- 「专注阅读」模式与字号调节

## 内容进度

| 讲 | 课件 | 说明 |
| --- | --- | --- |
| 第 1 讲 测度与积分 | 47 页（含老师手写批注） | 逐页转写并讲解老师的手写 |
| 第 2 讲 随机变量、期望与不等式 | 32 页（课堂空白版） | 留白处的定义、定理、证明由本站补写 |
| 第 3 讲 Borel–Cantelli、收敛与 Radon–Nikodym | 47 页（课堂空白版） | 同上 |
| 第 4 讲 乘积测度与独立性 | 21 页（课堂空白版） | 同上 |

### 作业与小测（逐题精讲）

| 练习 | 题数 | 内容 |
| --- | --- | --- |
| 作业 1 | 12 题 | Borel–Cantelli 引理的应用、依测度收敛、积分的收敛定理与不等式 |
| 作业 2 | 12 题 | Lᵖ 收敛、大数定律与中心极限定理、Glivenko–Cantelli、鞅与可选停止 |
| 小测 1 | 4 题 | Fatou 引理与控制收敛定理、L¹ 与 Lᵖ 收敛 |
| 小测 2 | 4 题 | 三种收敛、一致可积、Kolmogorov 0-1 律 |

左边显示解答原页中这道题所在的部分，右边按「这道题在问什么 → 先补基础 → 题目与原解答 → 思路 → 完整解答 → 原解答逐行对照 → 例子与数值验证 → 拓展延伸 → 常见疑问 → 小结与自测」讲解。原解答中的笔误、跳步与错误都在「原解答逐行对照」中指出并改正。

## 仓库结构

```
概率论/                 原始 PDF 课件（每讲一份）与作业、小测的解答
content/
  topics.yaml           各讲的目录信息
  topicN/_outline.yaml  每讲的逐页大纲（小节、幻灯片编号、标题）
  topicN/pNN.md         第 N 讲第 NN 页的精讲（Markdown + LaTeX）
  hw1/ hw2/ quiz1/ quiz2/  作业与小测：_outline.yaml 标出每道题在解答 PDF 中的位置，pNN.md 是第 NN 题的精讲
  glossary.yaml         术语表
  basics.md             基础补课
authoring/GUIDE.md      写作规范
site-src/
  build.mjs             构建脚本（含校验）
  lib/                  Markdown 渲染与页面模板
  assets/               样式、交互脚本、KaTeX 样式与字体
  vendor/               内置依赖（markdown-it、KaTeX 等），无需 npm install
tools/
  render_slides.py      把 PDF 渲染成网页用的页图
  zoom.py               放大课件局部，辨认手写
docs/                   生成的网站（GitHub Pages 直接发布这个目录）
```

## 本地构建与预览

只需要 Node.js（18 以上）和 Python 3：

```bash
node site-src/build.mjs                          # 生成 docs/
node site-src/build.mjs --check --pages 6-14     # 只检查第 1 讲第 6–14 页的公式与格式
python3 -m http.server 8791 --directory docs     # 浏览器打开 http://127.0.0.1:8791/
```

重新渲染课件页图（需要 poppler 的 `pdftoppm` 与 Pillow）：

```bash
python3 tools/render_slides.py
```

## 说明

课件版权归授课老师所有，本仓库仅用于个人学习复习。第 2–4 讲补写的内容依据标准教材整理，如与老师课堂写法不同，以老师为准。
