import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import 'katex/dist/katex.min.css'
import './custom.css'
import Layout from './Layout.vue'
import SlideFrame from './components/SlideFrame.vue'

// components/widgets/ 下的每个 .vue 文件按文件名自动注册为全局组件，例如 DyadicApprox.vue -> <DyadicApprox />
const widgets = import.meta.glob('./components/widgets/*.vue', { eager: true }) as Record<string, any>

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('SlideFrame', SlideFrame)
    for (const [file, mod] of Object.entries(widgets)) {
      const name = file.split('/').pop()!.replace(/\.vue$/, '')
      app.component(name, mod.default)
    }
  }
} satisfies Theme
