<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import mediumZoom, { type Zoom } from 'medium-zoom'

const route = useRoute()
let zoom: Zoom | null = null

function initZoom() {
  zoom?.detach()
  zoom = mediumZoom('.vp-doc .slide-frame img, .vp-doc img.zoomable', {
    background: 'rgba(15, 23, 42, 0.88)',
    margin: 16
  })
}

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}

function onKey(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || isTyping(e.target)) return
  if (document.querySelector('.VPLocalSearchBox, .medium-zoom--opened')) return
  if (e.key === 'ArrowRight') {
    ;(document.querySelector('.VPDocFooter .pager-link.next') as HTMLElement | null)?.click()
  } else if (e.key === 'ArrowLeft') {
    ;(document.querySelector('.VPDocFooter .pager-link.prev') as HTMLElement | null)?.click()
  }
}

onMounted(() => {
  initZoom()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  zoom?.detach()
})
watch(
  () => route.path,
  () => nextTick(initZoom)
)
</script>

<template>
  <DefaultTheme.Layout />
</template>
