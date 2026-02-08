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
      class="chat-window" 
      :class="{ 'sidebar-open': isOpen }"
    >
      <!-- Header -->
      <div class="chat-header">
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
          <div class="message-avatar">
            <svg v-if="msg.role !== 'user'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>

          <div class="message-bubble markdown-content" v-html="md.render(msg.content)"></div>
        </div>

        <div v-if="isWaiting" class="message-row message-left">
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
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true
})

// State
const isOpen = ref(false)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const isWaiting = ref(false)
// const position = reactive({ x: 20, y: window.innerHeight - 600 }) // Removed position
// const isDragging = ref(false) // Removed drag
// const dragOffset = reactive({ x: 0, y: 0 }) // Removed drag offset
const chatWindow = ref(null)
const messagesContainer = ref(null)
const chatId = ref('session-' + Date.now())

// Rate limiting - 50 requests per session
const RATE_LIMIT = 50
const STORAGE_KEY = 'chat_request_count'

function getRateLimitData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to read rate limit data:', e)
  }
  return { count: 0, resetDate: new Date().toDateString() }
}

function updateRateLimitCount() {
  const today = new Date().toDateString()
  let data = getRateLimitData()
  
  // Reset count if it's a new day
  if (data.resetDate !== today) {
    data = { count: 0, resetDate: today }
  }
  
  data.count++
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to update rate limit:', e)
  }
  return data.count
}

function checkRateLimit() {
  const data = getRateLimitData()
  const today = new Date().toDateString()
  
  if (data.resetDate !== today) {
    return { allowed: true, remaining: RATE_LIMIT }
  }
  
  return {
    allowed: data.count < RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - data.count)
  }
}

// Adjust initial position on mount
// onMounted(() => {
//   // position.y = window.innerHeight - 520; 
//   // position.x = 20;
// })

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

  // Check rate limit
  const rateLimitCheck = checkRateLimit()
  if (!rateLimitCheck.allowed) {
    messages.value.push({
      role: 'assistant',
      content: `😔 您今天的请求次数已达到上限（${RATE_LIMIT}次）。请明天再试，或联系管理员提升额度。`
    })
    nextTick(() => scrollToBottom())
    return
  }

  // Add user message
  messages.value.push({
    role: 'user',
    content: content
  })
  
  inputMessage.value = ''
  isLoading.value = true
  isWaiting.value = true
  nextTick(() => scrollToBottom())

  try {
    // Update rate limit count
    const currentCount = updateRateLimitCount()
    
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      let errorMsg = '服务器响应异常'
      if (response.status === 429) {
        errorMsg = '🚫 请求过于频繁，请稍后再试'
      } else if (response.status === 500) {
        errorMsg = '⚠️ 服务器内部错误，请稍后重试'
      } else if (response.status === 403) {
        errorMsg = '🔒 访问被拒绝，请检查权限'
      } else if (response.status === 404) {
        errorMsg = '❓ 服务接口不存在'
      } else if (response.status >= 500) {
        errorMsg = '⚠️ 服务器错误，请稍后重试'
      } else if (response.status >= 400) {
        errorMsg = '❌ 请求失败，请检查输入内容'
      }
      throw new Error(errorMsg)
    }

    // Response received, stop waiting animation
    isWaiting.value = false

    // Initialize assistant message
    const assistantMessage = reactive({
      role: 'assistant',
      content: ''
    })
    messages.value.push(assistantMessage)
    
    // Stream verification
    if (!response.body) {
         throw new Error('ReadableStream not supported by browser or response has no body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last partial line
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          if (trimmedLine.startsWith('event:')) {
            currentEvent = trimmedLine.slice(6).trim()
          } else if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.slice(5).trim()
            if (dataStr === '[DONE]') continue
            
            try {
               const data = JSON.parse(dataStr)
               
               // Only process 'answer' events for content
               if (currentEvent === 'answer' || !currentEvent) {
                 // Try standard structure
                 const contentDelta = data.choices?.[0]?.delta?.content
                 if (contentDelta) {
                   assistantMessage.content += contentDelta
                   nextTick(() => scrollToBottom())
                 }
               }
            } catch (e) {
               // Ignore JSON parse errors for intermediate chunks
             }
          }
        }
      }
    } catch (streamError) {
      console.error('Stream processing error:', streamError)
      throw streamError
    }
    
    // Fallback if empty (e.g. non-stream response or error)
    if (!assistantMessage.content) {
       // Check if we can just get text if stream failed immediately? 
       // But we already read the stream.
       // Maybe remove the empty message if it failed?
       if (response.status === 200 && !buffer) { 
           // If we finished successfully but got no content?
           // Maybe the previous logic was better for fallback. 
           // But now we are committed to stream.
           assistantMessage.content = '（未收到回复内容）'
       }
    }

  } catch (error) {
    console.error('Chat error:', error)
    let friendlyMessage = ''
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      friendlyMessage = '🌐 网络连接失败，请检查您的网络连接'
    } else if (error.message.includes('timeout')) {
      friendlyMessage = '⏱️ 请求超时，请稍后重试'
    } else if (error.message.startsWith('🚫') || error.message.startsWith('⚠️') || 
               error.message.startsWith('🔒') || error.message.startsWith('❓') || 
               error.message.startsWith('❌') || error.message.startsWith('😔')) {
      // Already friendly error
      friendlyMessage = error.message
    } else {
      friendlyMessage = `❌ 发生错误：${error.message}`
    }
    
    messages.value.push({
      role: 'assistant',
      content: friendlyMessage
    })
  } finally {
    isLoading.value = false
    isWaiting.value = false
    nextTick(() => scrollToBottom())
  }
}

// Drag functionality removed
</script>

<style scoped>
.chat-widget-container {
  font-family: var(--vp-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  z-index: 1000;
  /* position: fixed; pointer-events: none; top: 0; left: 0; width: 100vw; height: 100vh; */
  /* Remove container overlay to avoid blocking clicks when closed */
}

/* Global Transition for Layout Squeeze */
:global(body) {
  --chat-sidebar-width: 400px;
}

.chat-toggle-btn {
  position: fixed;
  bottom: 25px;
  right: 25px; /* Moved to right */
  left: auto;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var( --vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 2100; /* Higher than window */
}

.chat-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  background: var(--vp-c-bg-soft);
}

.chat-window {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--chat-sidebar-width);
  height: 100vh;
  max-height: 100vh;
  background: var(--vp-c-bg, #ffffff);
  box-shadow: -5px 0 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
  border-left: 1px solid var(--vp-c-divider, #e2e2e2);
  z-index: 2000;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
  transform: translateX(100%); /* Hidden by default */
}

.chat-window.sidebar-open {
  transform: translateX(0); /* Slide in */
  box-shadow: -5px 0 50px rgba(0,0,0,0.2);
}

:global(.dark) .chat-window {
  box-shadow: -5px 0 30px rgba(0,0,0,0.3);
}

.chat-header {
  height: 60px;
  flex-shrink: 0;
  background: var(--vp-c-bg);
  color: var( --vp-c-text-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  /* user-select: none; */
  border-bottom: 1px solid var(--vp-c-divider);
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
  margin-right: 10px;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.chat-controls .close-btn {
  background: transparent;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  transition: all 0.2s;
}

.chat-controls .close-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: var(--vp-c-bg-alt); /* Slightly different bg for sidebar content */
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-message {
  text-align: center;
  color: var(--vp-c-text-2, #666);
  font-size: 14px;
  margin-top: 40px;
  padding: 0 20px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  max-width: 100%;
  gap: 12px;
}

.message-left {
  align-self: flex-start;
  flex-direction: row; 
}

.message-right {
  align-self: flex-end;
  flex-direction: row-reverse; 
  justify-content: flex-end;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px; /* Square-ish for copilot feel? Or keep circle. Keep circle but smaller. */
  border-radius: 50%;
  background: var(--vp-c-bg, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2, #555);
  flex-shrink: 0;
  border: 1px solid var(--vp-c-divider, #eee);
}

.message-right .message-avatar {
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 8px; /* Less rounded for sidebar look */
  font-size: 14px;
  line-height: 1.6;
  max-width: 100%; /* In sidebar, bubble can take avail width */
  flex: 1;
  word-wrap: break-word;
}

.message-left .message-bubble {
  background: transparent; /* Copilot style: blend in or slight bg */
  /* Let's keep bubble but make it subtle */
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.message-right .message-bubble {
  background: var(--vp-c-brand-soft); /* Softer brand color */
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-brand-1);
  /* Or just brand block */
  background: var(--vp-c-brand-1);
  color: white;
}

.chat-input-area {
  padding: 15px;
  background: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.chat-input-area textarea {
  flex: 1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  background: var(--vp-c-bg-mute); /* Input bg */
  color: var(--vp-c-text-1);
  max-height: 150px;
  outline: none;
  transition: all 0.2s;
}

.chat-input-area textarea:focus {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.send-btn:disabled {
  background: var(--vp-c-divider);
  cursor: not-allowed;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 3px;
}

/* Markdown Content Styles */
.markdown-content :deep(p) {
  margin: 0 0 8px 0;
}
.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-content :deep(ul), .markdown-content :deep(ol) {
  margin: 4px 0 8px 18px;
  padding: 0;
}
.markdown-content :deep(pre) {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  padding: 10px;
  border-radius: 6px;
  margin: 8px 0;
  font-size: 12px;
}
.markdown-content :deep(code) {
  background: var(--vp-c-bg-alt);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--vp-c-text-1);
}

/* Specific overrides for right bubble markdown to be readable on blue */
.message-right .markdown-content :deep(code),
.message-right .markdown-content :deep(pre) {
  background: rgba(255,255,255,0.2) !important;
  color: white;
  border: none;
}
.message-right .markdown-content :deep(a) {
  color: white;
  text-decoration: underline;
}
</style>
