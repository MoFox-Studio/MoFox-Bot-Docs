<template>
  <div class="chat-widget-container">
    <!-- Toggle Button -->
    <div 
      v-if="!isOpen" 
      class="chat-toggle-btn" 
      @click="toggleChat"
      title="Open Chat"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>

    <!-- Chat Window -->
    <div 
      v-show="isOpen" 
      ref="chatWindow" 
      class="chat-window" 
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
    >
      <!-- Header (Draggable) -->
      <div class="chat-header" @mousedown="startDrag">
        <div class="chat-title">
          <span class="status-dot"></span>
          AI 助手
        </div>
        <div class="chat-controls">
          <button @click="toggleChat" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <p>有什么可以帮您的吗？</p>
        </div>
        
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          class="message-row" 
          :class="msg.role === 'user' ? 'message-right' : 'message-left'"
        >
          <div class="message-avatar" v-if="msg.role !== 'user'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div class="message-bubble">
            {{ msg.content }}
          </div>
          <div class="message-avatar user-avatar" v-if="msg.role === 'user'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </div>

        <div v-if="isLoading" class="message-row message-left">
           <div class="message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div class="message-bubble loading-bubble">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <textarea 
          v-model="inputMessage" 
          placeholder="输入消息..." 
          @keydown.enter.prevent="handleEnter"
          rows="1"
          ref="textarea"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isLoading">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'

// State
const isOpen = ref(false)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const position = reactive({ x: 20, y: window.innerHeight - 600 }) // Initial position
const isDragging = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })
const chatWindow = ref(null)
const messagesContainer = ref(null)
const chatId = ref('session-' + Date.now())

// Adjust initial position on mount
onMounted(() => {
  // Set initial position to be somewhere reasonable (bottom leftish but draggable)
  // Actually fixed bottom-left toggle is requested.
  // Window can be initially positioned relative to that.
  position.y = window.innerHeight - 520; // 500 height + margin
  position.x = 20;
})

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => scrollToBottom())
  }
}

function handleEnter(e) {
  if (!e.shiftKey) {
    sendMessage()
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content || isLoading.value) return

  // Add user message
  messages.value.push({
    role: 'user',
    content: content
  })
  
  inputMessage.value = ''
  isLoading.value = true
  nextTick(() => scrollToBottom())

  try {
    // Prepare API payload
    // Note: sending full history as requested/implied by "messages": [] structure
    // Or just sending the last one depending on API requirement.
    // The prompt showed "messages": [ { "role": "user", "content": "..." } ]
    // I will send the full conversation history.
    
    // Construct payload
    const payload = {
      chatId: chatId.value,
      messages: messages.value.map(m => ({
        role: m.role,
        content: m.content
      }))
    }

    const response = await fetch('https://doc.may1.eu.org', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Origin":"https://doc.may1.eu.org"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    // Handling response. Assuming JSON.
    // If it's a stream, this needs TextDecoder.
    // For now, assume simple JSON with { content: "...", ... } or just raw text?
    // Let's try to parse as JSON first.
    const responseText = await response.text()
    
    let assistantMessage = ''
    try {
      const data = JSON.parse(responseText)
      // Look for common fields
      assistantMessage = data.content || data.message || data.reply || (typeof data === 'string' ? data : JSON.stringify(data))
      
      // Special case: if backend returns OpenAI style
      if (data.choices && data.choices[0] && data.choices[0].message) {
          assistantMessage = data.choices[0].message.content
      }
    } catch (e) {
      // If not JSON, use text
      assistantMessage = responseText
    }

    if (assistantMessage) {
      messages.value.push({
        role: 'assistant',
        content: assistantMessage
      })
    } else {
        messages.value.push({
            role: 'assistant',
            content: '(No content received)'
        })
    }

  } catch (error) {
    console.error('Chat error:', error)
    messages.value.push({
      role: 'assistant',
      content: `Error: ${error.message}. Please try again later.`
    })
  } finally {
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

// Drag functionality
function startDrag(e) {
  // Only drag from header
  isDragging.value = true
  dragOffset.x = e.clientX - position.x
  dragOffset.y = e.clientY - position.y
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return
  
  let newX = e.clientX - dragOffset.x
  let newY = e.clientY - dragOffset.y
  
  // Boundary checks
  const winWidth = window.innerWidth
  const winHeight = window.innerHeight
  const boxWidth = 350
  const boxHeight = 500
  
  if (newX < 0) newX = 0
  if (newX + boxWidth > winWidth) newX = winWidth - boxWidth
  if (newY < 0) newY = 0
  if (newY + boxHeight > winHeight) newY = winHeight - boxHeight
  
  position.x = newX
  position.y = newY
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.chat-widget-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  z-index: 1000;
  position: fixed;
  pointer-events: none; /* Let clicks pass through container area, re-enable on children */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.chat-toggle-btn {
  position: fixed;
  bottom: 25px;
  left: 25px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--vp-c-brand-1, #367BF0);
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 2000;
}

.chat-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.chat-window {
  position: absolute;
  width: 380px;
  height: 550px;
  background: var(--vp-c-bg, #ffffff);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider, #e2e2e2);
  z-index: 2000;
}

/* Dark mode adjustment */
:global(.dark) .chat-window {
    background: #1e1e20;
    border-color: #38383a;
}

.chat-header {
  height: 50px;
  background: var(--vp-c-brand-1, #367BF0);
  background: linear-gradient(135deg, var(--vp-c-brand-1, #367BF0), var(--vp-c-brand-2, #5C96F5));
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  cursor: move;
  user-select: none;
}

.chat-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 4px rgba(74, 222, 128, 0.5);
}

.chat-controls .close-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
}

.chat-controls .close-btn:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: var(--vp-c-bg-soft, #f9f9f9);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:global(.dark) .chat-messages {
    background: #161618;
}

.welcome-message {
  text-align: center;
  color: var(--vp-c-text-2, #666);
  font-size: 14px;
  margin-top: 20px;
}

.message-row {
  display: flex;
  align-items: flex-end;
  max-width: 100%;
}

.message-left {
  align-self: flex-start;
}

.message-right {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  margin-left: 0;
  color: #555;
  flex-shrink: 0;
}

.message-right .message-avatar {
  margin-right: 0;
  margin-left: 8px;
  background: var(--vp-c-brand-2, #5C96F5);
  color: white;
  display: none; /* Often hide user avatar in compact chats */
}

.message-right .user-avatar {
    display: flex;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 240px;
  word-wrap: break-word;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.message-left .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 2px;
}

:global(.dark) .message-left .message-bubble {
  background: #2f2f32;
  color: #e2e2e4;
}

.message-right .message-bubble {
  background: var(--vp-c-brand-1, #367BF0);
  color: white;
  border-bottom-right-radius: 2px;
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-area {
  padding: 10px;
  background: white;
  border-top: 1px solid var(--vp-c-divider, #eee);
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

:global(.dark) .chat-input-area {
    background: #1e1e20;
    border-color: #38383a;
}

.chat-input-area textarea {
  flex: 1;
  border: 1px solid var(--vp-c-divider, #ddd);
  border-radius: 20px;
  padding: 10px 15px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  background: var(--vp-c-bg-soft, #f9f9f9);
  color: var(--vp-c-text-1, #333);
  max-height: 100px;
  outline: none;
  transition: border-color 0.2s;
}

:global(.dark) .chat-input-area textarea {
    background: #252529;
    border-color: #3e3e42;
    color: #fff;
}

.chat-input-area textarea:focus {
  border-color: var(--vp-c-brand-1, #367BF0);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--vp-c-brand-1, #367BF0);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.send-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2, #5C96F5);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Scrollbar for messages */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
}
:global(.dark) .chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
}
</style>
