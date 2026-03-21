import { ref } from 'vue'

// Module-level shared state (singleton pattern)
const isOpen = ref(false)
const pendingMessage = ref('')

export function useChatState() {
  function toggle() {
    isOpen.value = !isOpen.value
  }

  function open(msg = '') {
    if (msg) pendingMessage.value = msg
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, pendingMessage, toggle, open, close }
}
