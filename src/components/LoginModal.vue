<template>
  <Teleport to="body">
    <Transition name="modal-outer">
      <div
        v-show="modalActive"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity"
        @click="closeModal"
      >
        <Transition name="modal-inner">
          <div
            v-if="modalActive"
            class="bg-card text-card-foreground rounded-xl p-6 max-w-lg w-full shadow-lg"
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
    default: false,
  },
});
const emit = defineEmits(["close-modal"]);

const closeModal = () => {
  emit("close-modal");
};
</script>

<style scoped>
.modal-outer-enter-active,
.modal-outer-leave-active {
  transition: opacity 0.3s ease;
}

.modal-outer-enter-from,
.modal-outer-leave-to {
  opacity: 0;
}

.modal-inner-enter-active {
  transition: transform 0.3s ease;
}

.modal-inner-leave-active {
  transition: transform 0.3s ease;
}

.modal-inner-enter-from {
  transform: scale(0.9);
  opacity: 0;
}

.modal-inner-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>
