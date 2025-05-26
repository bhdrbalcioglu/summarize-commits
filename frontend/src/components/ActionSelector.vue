<template>
  <div class="flex gap-4 my-3 justify-center items-center">
    <Button @click="handleCommitSummary" :disabled="selectedAction === 'commit-summary'" :variant="selectedAction === 'commit-summary' ? 'default' : 'outline'"> Commit Summary </Button>
    <Button @click="handleDocumentationGeneration" :disabled="selectedAction === 'documentation-generation'" :variant="selectedAction === 'documentation-generation' ? 'default' : 'outline'"> Documentation Generation </Button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { defineEmits } from 'vue'

const emit = defineEmits(['onSelectAction'])
const selectedAction = ref<string | null>(null)

const handleCommitSummary = () => {
  selectedAction.value = 'commit-summary'
  emit('onSelectAction', 'commit-summary')
}

const handleDocumentationGeneration = () => {
  selectedAction.value = 'documentation-generation'
  emit('onSelectAction', 'documentation-generation')
}
</script>
