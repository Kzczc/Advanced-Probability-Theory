import { defineConfig, type DefaultTheme } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { setupMarkdown } from './md-setup.mjs'

const docsRoot = path.resolve(__dirname, '..')

const TOPICS = [
  { dir: 'topic1', title: 'Topic 1 · 测度与积分' },
  { dir: 'topic2', title: 'Topic 2 · 随机变量、期望与不等式' },
  { dir: 'topic3', title: 'Topic 3 · Borel–Cantelli、收敛与 Radon–Nikodym' }
]

function readFront(file: string) {
  try {
    return matter(fs.readFileSync(file, 'utf8')).data as Record<string, any>
  } catch {
    return {}
  }
}

function topicSidebar(dir: string, title: string): DefaultTheme.SidebarItem[] {
  const abs = path.join(docsRoot, dir)
  const files = fs.existsSync(abs)
    ? fs.readdirSync(abs).filter((f) => /^p\d+\.md$/.test(f)).sort()
    : []
  const groups: DefaultTheme.SidebarItem[] = []
  let cur: DefaultTheme.SidebarItem | null = null
  for (const f of files) {
    const data = readFront(path.join(abs, f))
    const sec = data.section || '未分组'
    if (!cur || cur.text !== sec) {
      cur = { text: sec, collapsed: false, items: [] }
      groups.push(cur)
    }
    const num = f.slice(1, 3)
    cur.items!.push({
      text: `<span class="sb-num">${num}</span>${data.short || data.title || f}`,
      link: `/${dir}/${f.replace(/\.md$/, '')}`
    })
  }
  return [{ text: title, items: [{ text: '本讲导览', link: `/${dir}/` }] }, ...groups]
}

function basicsSidebar(): DefaultTheme.SidebarItem[] {
  const abs = path.join(docsRoot, 'basics')
  const files = fs.existsSync(abs)
    ? fs.readdirSync(abs).filter((f) => f.endsWith('.md') && f !== 'index.md').sort()
    : []
  return [
    {
      text: '零基础数学补课',
      items: [
        { text: '从这里开始', link: '/basics/' },
        ...files.map((f) => ({
          text: readFront(path.join(abs, f)).short || readFront(path.join(abs, f)).title || f,
          link: `/basics/${f.replace(/\.md$/, '')}`
        }))
      ]
    }
  ]
}

const sidebar: DefaultTheme.Sidebar = {
  '/basics/': basicsSidebar()
}
for (const t of TOPICS) sidebar[`/${t.dir}/`] = topicSidebar(t.dir, t.title)

export default defineConfig({
  lang: 'zh-CN',
  title: '高等概率论 · 逐页精讲',
  description: '零基础也能看懂的高等概率论课件逐页讲解',
  base: '/Advanced-Probability-Theory/',
  cleanUrls: true,
  lastUpdated: false,
  ignoreDeadLinks: true,
  head: [['meta', { name: 'theme-color', content: '#3730a3' }]],
  markdown: {
    config: (md) => setupMarkdown(md),
    image: { lazyLoading: true }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '数学补课', link: '/basics/' },
      { text: 'Topic 1', link: '/topic1/' },
      { text: 'Topic 2', link: '/topic2/' },
      { text: 'Topic 3', link: '/topic3/' },
      { text: '符号与术语', link: '/glossary' }
    ],
    sidebar,
    outline: { level: [2, 3], label: '本页小标题' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '深色模式',
    lightModeSwitchTitle: '切换到浅色',
    darkModeSwitchTitle: '切换到深色',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    socialLinks: [{ icon: 'github', link: 'https://github.com/Kzczc/Advanced-Probability-Theory' }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        },
        miniSearch: {
          options: {
            tokenize: (text: string) => {
              const out: string[] = []
              const parts = text.match(/[\u3400-\u9fff]+|[A-Za-z0-9\u0370-\u03ff\u2010-\u2015'’-]+/g) || []
              for (const p of parts) {
                if (/[\u3400-\u9fff]/.test(p)) {
                  if (p.length === 1) out.push(p)
                  for (let i = 0; i < p.length - 1; i++) out.push(p.slice(i, i + 2))
                } else {
                  out.push(p.toLowerCase())
                }
              }
              return out
            }
          },
          searchOptions: { fuzzy: 0.15, prefix: true, combineWith: 'AND', boost: { title: 4, text: 2, titles: 1 } }
        }
      }
    }
  }
})
