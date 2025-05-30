<!-- frontend/src/components/EnhancedTextDisplay.vue -->
<template>
  <div class="group relative bg-card/80 backdrop-blur-xl border border-border/50 p-6 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30" style="min-height: 400px" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-10 absolute inset-0 bg-background/90 backdrop-blur-sm rounded-xl border border-border/30">
      <div class="flex flex-col items-center gap-4">
        <div class="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="text-muted-foreground font-medium">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- Text Display Area -->
    <div v-else class="relative flex-1 flex flex-col">
      <!-- Editable Mode -->
      <textarea v-if="isEditing" v-model="editableText" class="font-mono text-base leading-relaxed w-full h-full bg-transparent border-none focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none overflow-y-auto text-foreground placeholder:text-muted-foreground" @keydown.escape="cancelEdit" @keydown.ctrl.enter="saveEdit" ref="editTextarea" placeholder="Enter your text here..." />

      <!-- Display Mode -->
      <textarea v-else v-model="displayedText" class="font-mono text-base leading-relaxed w-full h-full bg-transparent border-none focus:ring-0 resize-none cursor-default overflow-y-auto text-foreground" readonly :class="{ 'select-none': isTyping }" />

      <!-- Floating Action Buttons -->
      <div v-if="canShowButtons" class="absolute top-2 right-2 flex items-center gap-2 transition-all duration-200 ease-in-out" :class="[isHovered && !isTyping ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none']">
        <!-- Edit Mode Buttons -->
        <template v-if="isEditing">
          <button @click="saveEdit" class="flex items-center justify-center w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105" title="Save changes (Ctrl+Enter)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button @click="cancelEdit" class="flex items-center justify-center w-8 h-8 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105" title="Cancel editing (Escape)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </template>

        <!-- Normal Mode Buttons -->
        <template v-else>
          <button @click="copyToClipboard" class="flex items-center justify-center w-8 h-8 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105" title="Copy to clipboard" :disabled="!displayedText">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor" />
            </svg>
          </button>
          <button @click="startEdit" class="flex items-center justify-center w-8 h-8 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105" title="Edit text" :disabled="!displayedText">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M13.2929 4.29291C15.0641 2.52167 17.9359 2.52167 19.7071 4.2929C21.4784 6.06414 21.4784 8.93588 19.7071 10.7071L18.7073 11.7069L11.6135 18.8007C10.8766 19.5376 9.92793 20.0258 8.89999 20.1971L4.16441 20.9864C3.84585 21.0395 3.52127 20.9355 3.29291 20.7071C3.06454 20.4788 2.96053 20.1542 3.01362 19.8356L3.80288 15.1C3.9742 14.0721 4.46243 13.1234 5.19932 12.3865L13.2929 4.29291ZM13 7.41422L6.61353 13.8007C6.1714 14.2428 5.87846 14.8121 5.77567 15.4288L5.21656 18.7835L8.57119 18.2244C9.18795 18.1216 9.75719 17.8286 10.1993 17.3865L16.5858 11L13 7.41422ZM18 9.5858L14.4142 6.00001L14.7071 5.70712C15.6973 4.71693 17.3027 4.71693 18.2929 5.70712C19.2831 6.69731 19.2831 8.30272 18.2929 9.29291L18 9.5858Z" fill="currentColor" />
            </svg>
          </button>
        </template>
      </div>

      <!-- Copy Success Message -->
      <div v-if="copiedMessageVisible" class="absolute top-12 right-2 bg-primary text-primary-foreground text-sm rounded-lg px-3 py-2 shadow-lg animate-fade-in border border-primary/20"><i class="fas fa-check mr-2"></i> Copied to Clipboard</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'

// Props
interface Props {
  text: string | null
  isLoading: boolean
  loadingMessage: string
}

const props = withDefaults(defineProps<Props>(), {
  text: null,
  isLoading: false,
  loadingMessage: 'Loading...'
})

// Emits
const emit = defineEmits<{
  textUpdated: [text: string]
}>()

// State
const displayedText = ref('')
const editableText = ref('')
const isHovered = ref(false)
const isEditing = ref(false)
const isTyping = ref(false)
const copiedMessageVisible = ref(false)
const editTextarea = ref<HTMLTextAreaElement>()
const hasBeenEdited = ref(false) // Track if text has been manually edited
const lastProcessedText = ref('') // Track the last text we processed

let typewriterInterval: number | null = null

// Computed
const canShowButtons = computed(() => displayedText.value && !props.isLoading)

// Methods
const typeWriterEffect = (text: string | null) => {
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval)
  }

  displayedText.value = ''
  if (text === null || text === undefined) return

  isTyping.value = true
  let index = 0
  const typingSpeed = 15

  typewriterInterval = window.setInterval(() => {
    if (index < text.length) {
      displayedText.value += text.charAt(index)
      index++
    } else {
      if (typewriterInterval !== null) clearInterval(typewriterInterval)
      typewriterInterval = null
      isTyping.value = false
    }
  }, typingSpeed)
}

const copyToClipboard = async () => {
  if (!displayedText.value) return

  try {
    await navigator.clipboard.writeText(displayedText.value)
    copiedMessageVisible.value = true
    setTimeout(() => {
      copiedMessageVisible.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

const startEdit = () => {
  editableText.value = displayedText.value
  isEditing.value = true
  nextTick(() => {
    editTextarea.value?.focus()
  })
}

const saveEdit = () => {
  displayedText.value = editableText.value
  isEditing.value = false
  hasBeenEdited.value = true // Mark as edited
  lastProcessedText.value = editableText.value // Update last processed text
  emit('textUpdated', editableText.value)
}

const cancelEdit = () => {
  editableText.value = ''
  isEditing.value = false
}

// Watchers
watch(
  () => props.text,
  (newText) => {
    // Only trigger typewriter effect if:
    // 1. There's new text
    // 2. Not currently editing
    // 3. Text hasn't been manually edited OR this is genuinely new text (different from last processed)
    if (newText && !isEditing.value && (!hasBeenEdited.value || newText !== lastProcessedText.value)) {
      typeWriterEffect(newText)
      lastProcessedText.value = newText
    }
  },
  { immediate: true }
)

// Cleanup
onUnmounted(() => {
  if (typewriterInterval !== null) {
    clearInterval(typewriterInterval)
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s forwards;
}

/* Custom scrollbar styling */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.1);
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Disable text selection during typing */
.select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
