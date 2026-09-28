<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import sizes from '../slide-sizes.json'

const props = defineProps<{
  t: string | number
  p: string | number
  caption?: string
}>()

const pad = computed(() => String(props.p).padStart(2, '0'))
const src = computed(() => withBase(`/slides/t${props.t}/p${pad.value}.webp`))
const dims = computed<[number, number]>(() => {
  const table = (sizes as Record<string, Record<string, [number, number]>>)[`t${props.t}`] || {}
  return table[String(Number(props.p))] || [1600, 1280]
})
const pinned = ref(false)
</script>

<template>
  <figure class="slide-frame">
    <img
      :src="src"
      :width="dims[0]"
      :height="dims[1]"
      loading="lazy"
      decoding="async"
      :alt="`Topic ${t} 课件 PDF 第 ${p} 页`"
    />
    <figcaption>
      <span class="slide-cap-text">{{ caption || `Topic ${t} 课件 · PDF 第 ${p} 页` }}</span>
      <span class="slide-actions">
        <span class="slide-hint">点图放大</span>
        <button type="button" class="slide-btn" @click="pinned = !pinned">
          {{ pinned ? '取消悬浮' : '悬浮课件（边看讲解边对照）' }}
        </button>
        <a class="slide-btn" :href="src" target="_blank" rel="noopener">原图</a>
      </span>
    </figcaption>
    <Teleport to="body">
      <div v-if="pinned" class="slide-float">
        <div class="slide-float-bar">
          <span>课件 PDF 第 {{ p }} 页</span>
          <button type="button" @click="pinned = false">关闭</button>
        </div>
        <img :src="src" :width="dims[0]" :height="dims[1]" alt="悬浮课件" />
      </div>
    </Teleport>
  </figure>
</template>
