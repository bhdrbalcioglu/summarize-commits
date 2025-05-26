<!-- C:\Projects\Vue Projects\summarize-commits\src\components\ui\textarea\Textarea.vue -->

<template>
  <textarea ref="textareaRef" v-model="modelValue" :class="cn('flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-in-out', props.class)" :style="{ overflow: 'hidden', resize: 'none' }" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '../../lib/utils'

interface TextareaProps {
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
}

const props = defineProps<TextareaProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emit, {
  passive: true,
  defaultValue: props.defaultValue
})

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const adjustHeight = () => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }
}

onMounted(adjustHeight)
watch(modelValue, adjustHeight)
</script>
