#!/usr/bin/env node
// 快速检查 Markdown 讲义：KaTeX 报错、容器是否配对、Vue 插值隐患、frontmatter 字段。
// 用法：node scripts/check-md.mjs docs/topic1/p05.md [更多文件...]
import fs from 'node:fs'
import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import { setupMarkdown, BOXES } from '../docs/.vitepress/md-setup.mjs'

const files = process.argv.slice(2)
if (!files.length) {
  console.log('用法: node scripts/check-md.mjs <file.md> ...')
  process.exit(1)
}

const md = new MarkdownIt({ html: true, linkify: false })
setupMarkdown(md)
// VitePress 内置容器，这里只为让检查不报错
for (const name of ['tip', 'info', 'warning', 'danger', 'details']) {
  md.use((await import('markdown-it-container')).default, name)
}

const REQUIRED = ['title', 'short', 'en', 'topic', 'page', 'section']
let totalProblems = 0

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  const problems = []
  const isPage = /\/p\d+\.md$/.test(file)

  if (isPage) {
    for (const k of REQUIRED) if (data[k] === undefined || data[k] === '') problems.push(`frontmatter 缺少字段: ${k}`)
    if (!/<SlideFrame\s[^>]*\/>/.test(content)) problems.push('没有找到 <SlideFrame t=".." p=".." /> 课件图片')
  }

  const html = md.render(content)
  const errRe = /<span class="katex-error" title="([^"]*)"[^>]*>([\s\S]*?)<\/span>/g
  let m
  while ((m = errRe.exec(html))) {
    const msg = m[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    const src = m[2].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    problems.push(`KaTeX 错误: ${msg}\n      公式: ${src.slice(0, 160)}`)
  }

  // 容器配对（粗略）：按行统计开/闭
  const lines = content.split('\n')
  const stack = []
  let inFence = false
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) return
    const open = line.match(/^\s*(:{3,})\s*([A-Za-z-]+)/)
    const close = line.match(/^\s*(:{3,})\s*$/)
    if (open) {
      const name = open[2]
      if (!(name in BOXES) && !['tip', 'info', 'warning', 'danger', 'details'].includes(name)) {
        problems.push(`第 ${i + 1} 行: 未知容器名 "${name}"`)
      }
      stack.push({ colons: open[1].length, name, line: i + 1 })
    } else if (close) {
      const c = close[1].length
      const top = stack[stack.length - 1]
      if (!top) problems.push(`第 ${i + 1} 行: 多余的闭合 ${close[1]}`)
      else if (top.colons !== c) problems.push(`第 ${i + 1} 行: 闭合冒号数(${c})与第 ${top.line} 行的开头(${top.colons})不一致`)
      else stack.pop()
    }
  })
  for (const s of stack) problems.push(`第 ${s.line} 行的容器 "${s.name}" 没有闭合`)

  // Vue 插值隐患：数学以外出现 {{ 或 }}
  const noMath = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$\n]*\$/g, '')
  if (/\{\{|\}\}/.test(noMath)) problems.push('数学公式之外出现了 {{ 或 }}，会被 Vue 当成插值导致构建失败')

  // 公式内出现中文全角标点/汉字会导致 KaTeX 警告或排版异常（\text{} 内除外，这里只做提示）
  const inlineMath = content.match(/\$[^$\n]+\$/g) || []
  for (const im of inlineMath) {
    const stripped = im.replace(/\\text\{[^}]*\}|\\mathrm\{[^}]*\}|\\textbf\{[^}]*\}/g, '')
    if (/[\u3400-\u9fff，。；：（）]/.test(stripped)) {
      problems.push(`行内公式里有中文（请放进 \\text{} 或移出公式）: ${im.slice(0, 80)}`)
      break
    }
  }

  // 使用到的组件
  const comps = [...new Set((content.match(/<([A-Z][A-Za-z0-9]+)/g) || []).map((s) => s.slice(1)))]

  const tag = problems.length ? '✗' : '✓'
  console.log(`${tag} ${file}  (${lines.length} 行${comps.length ? '，组件: ' + comps.join(', ') : ''})`)
  for (const p of problems) console.log('    - ' + p)
  totalProblems += problems.length
}

if (totalProblems) {
  console.log(`\n共 ${totalProblems} 个问题`)
  process.exit(1)
} else {
  console.log('\n全部通过')
}
