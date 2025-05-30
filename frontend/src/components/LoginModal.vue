<template>
  <Teleport to="body">
    <Transition name="modal-outer">
      <div 
        v-show="modalActive" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300" 
        @click="closeModal"
      >
        <Transition name="modal-inner">
          <div 
            v-if="modalActive" 
            class="bg-card/95 backdrop-blur-xl text-card-foreground rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-border/50 ring-1 ring-black/5 dark:ring-white/10" 
            @click.stop
          >
            <slot></slot>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps({
  modalActive: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close-modal'])

const closeModal = () => {
  emit('close-modal')
}
</script>

<style scoped>
/* Modal backdrop transitions */
.modal-outer-enter-active,
.modal-outer-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-outer-enter-from,
.modal-outer-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.modal-outer-enter-to,
.modal-outer-leave-from {
  opacity: 1;
  backdrop-filter: blur(4px);
}

/* Modal content transitions */
.modal-inner-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-inner-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.modal-inner-enter-from {
  transform: scale(0.9) translateY(-10px);
  opacity: 0;
}

.modal-inner-leave-to {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.modal-inner-enter-to,
.modal-inner-leave-from {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* Enhanced backdrop filter support */
@supports (backdrop-filter: blur(20px)) {
  .backdrop-blur-xl {
    backdrop-filter: blur(20px);
  }
  
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }
}

/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(20px)) {
  .bg-card\/95 {
    background-color: hsl(var(--card));
  }
  
  .bg-background\/80 {
    background-color: hsl(var(--background) / 0.9);
  }
}
</style>
