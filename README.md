# 高等概率论 · 逐页精讲

面向数学基础薄弱同学的课件复习网站：**左边是课件原页，右边是中文精讲**。每一页都按同一个顺序讲：

这一页在讲什么 → 先补基础 → 课件原文逐句精读 → 老师板书在说什么（第 2、3 讲为「补全课件留白」）→ 图解 → 例子 → 推导 → 常见疑问与易错点 → 小结与自测

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

## 仓库结构

```
概率论/                 原始 PDF 课件（三讲）
content/
  topics.yaml           三讲的目录信息
  topicN/_outline.yaml  每讲的逐页大纲（小节、幻灯片编号、标题）
  topicN/pNN.md         第 N 讲第 NN 页的精讲（Markdown + LaTeX）
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

课件版权归授课老师所有，本仓库仅用于个人学习复习。第 2、3 讲补写的内容依据标准教材整理，如与老师课堂写法不同，以老师为准。
