import container from 'markdown-it-container'
import { katex } from '@mdit/plugin-katex'

export const KATEX_MACROS = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Q': '\\mathbb{Q}',
  '\\Z': '\\mathbb{Z}',
  '\\P': '\\mathbb{P}',
  '\\E': '\\mathbb{E}',
  '\\1': '\\mathbf{1}',
  '\\dd': '\\mathrm{d}',
  '\\Var': '\\operatorname{Var}',
  '\\Leb': '\\operatorname{Leb}',
  '\\Cov': '\\operatorname{Cov}'
}

// 容器名 -> 默认标签。写法：::: def 定义 1（样本空间）
export const BOXES = {
  slide: '课件原文',
  trans: '中文翻译',
  handnote: '手写批注整理',
  fill: '板书补全',
  def: '定义',
  thm: '定理',
  proof: '证明',
  example: '例子',
  intuition: '直观理解',
  prereq: '基础补课',
  figure: '图示讲解',
  pitfall: '易错点',
  remark: '补充说明',
  summary: '本页小结',
  quiz: '自测',
  vocab: '英文词汇',
  roadmap: '学习路线'
}

export function setupMarkdown(md) {
  md.use(katex, {
    output: 'html',
    throwOnError: false,
    strict: 'ignore',
    macros: { ...KATEX_MACROS },
    logger: () => 'ignore'
  })

  for (const [name, label] of Object.entries(BOXES)) {
    md.use(container, name, {
      render(tokens, idx) {
        const tok = tokens[idx]
        if (tok.nesting === 1) {
          const info = tok.info.trim().slice(name.length).trim()
          const title = info ? `<span class="box-name">${md.renderInline(info)}</span>` : ''
          return `<div class="box box-${name}"><div class="box-head"><span class="box-label">${label}</span>${title}</div><div class="box-body">\n`
        }
        return '</div></div>\n'
      }
    })
  }
}
