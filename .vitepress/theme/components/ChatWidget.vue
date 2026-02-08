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
          <div class="message-avatar">
            <svg v-if="msg.role !== 'user'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>

          <div class="message-bubble">
            <div v-if="msg.details && ((msg.details.steps && msg.details.steps.length > 0) || (msg.details.references && msg.details.references.length > 0))" class="message-details">
              <!-- Thinking Process / Dynamic Status -->
              <details class="thinking-process" v-if="msg.details.steps && msg.details.steps.length > 0">
                <summary>
                  <div class="summary-content">
                    <!-- Loading / Success Icon -->
                    <svg v-if="msg.details.isThinking" class="spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    
                    <!-- Dynamic Text -->
                    <span v-if="msg.details.isThinking" class="thinking-text">{{ getCurrentStepName(msg) }}</span>
                    <span v-else>思考过程</span>
                    
                    <span v-if="!msg.details.isThinking && msg.details.duration" class="duration-badge">{{ msg.details.duration }}s</span>
                  </div>
                </summary>
                <div class="steps-list">
                  <div v-for="(step, sIdx) in msg.details.steps" :key="sIdx" class="step-item">
                    <span class="step-icon" :class="step.status">
                      <svg v-if="step.status === 'running'" class="spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span class="step-name">{{ step.name }}</span>
                  </div>
                </div>
              </details>

              <!-- Citations -->
              <div v-if="msg.details.references && msg.details.references.length > 0" class="citation-area">
                  <div class="citation-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>引用文档</span>
                  </div>
                  <div class="citation-list">
                    <a v-for="(ref, idx) in msg.details.references" :key="idx" :href="ref.url || '#'" :target="ref.url ? '_blank' : '_self'" class="citation-item" :title="ref.title || ref.name">
                       {{ ref.title || ref.name || '文档 ' + (idx + 1) }}
                    </a>
                  </div>
              </div>
            </div>
            
            <!-- Message Content -->
            <div class="message-content" v-if="msg.content">{{ msg.content }}</div>
            
            <!-- Standalone Typing Indicator (Only showed when no steps are visible and no content) -->
            <div v-if="isLoading && msg.role === 'assistant' && !msg.content && (!msg.details || !msg.details.steps || msg.details.steps.length === 0)" class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
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

// Rate limiting - 50 requests per session
const RATE_LIMIT = 50
const STORAGE_KEY = 'chat_request_count'

function getCurrentStepName(msg) {
  if (!msg.details || !msg.details.steps) return '思考中...'
  const runningStep = msg.details.steps.find(s => s.status === 'running')
  if (runningStep) return runningStep.name + '...'
  const lastStep = msg.details.steps[msg.details.steps.length - 1]
  return lastStep ? lastStep.name : '思考中...'
}

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
  
  // Initialize assistant message immediately
  const assistantMsg = reactive({
    role: 'assistant',
    content: '',
    details: {
      steps: [],
      responses: [],
      references: [],
      duration: 0,
      isThinking: true
    }
  })
  messages.value.push(assistantMsg)
  nextTick(() => scrollToBottom())

  try {
    // Update rate limit count
    updateRateLimitCount()
    
    // Construct payload
    const payload = {
      chatId: chatId.value,
      messages: messages.value.slice(0, -1).map(m => ({ // Exclude the empty assistant message we just added
        role: m.role,
        content: m.content
      })).filter(m => m.content) // Filter out any empty messages just in case
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
      if (response.status === 429) errorMsg = '🚫 请求过于频繁，请稍后再试'
      else if (response.status >= 500) errorMsg = '⚠️ 服务器错误，请稍后重试'
      else if (response.status === 403) errorMsg = '🔒 访问被拒绝'
      else if (response.status === 404) errorMsg = '❓ 服务接口不存在'
      
      throw new Error(errorMsg)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let isStream = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        isStream = true
        buffer += decoder.decode(value, { stream: true })
        
        // Split by double newline to get events
        const lines = buffer.split('\n\n')
        buffer = lines.pop() // Keep the last incomplete chunk in buffer
        
        for (const line of lines) {
          const eventMatch = line.match(/^event: (.*)$/m)
          const dataMatch = line.match(/^data: (.*)$/m)
          
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1].trim()
            let data = null
            try {
              if (dataMatch[1].trim() === '[DONE]') break;
              data = JSON.parse(dataMatch[1].trim())
            } catch (e) {
              console.warn('Failed to parse SSE data:', dataMatch[1])
              continue
            }

            if (!data) continue

            if (eventType === 'flowNodeStatus') {
              const existingStep = assistantMsg.details.steps.find(s => s.name === data.name)
              if (existingStep) {
                 existingStep.status = data.status
              } else {
                 assistantMsg.details.steps.push({
                  name: data.name,
                  status: data.status,
                  timestamp: Date.now()
                })
              }
            } else if (eventType === 'answer') {
              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                assistantMsg.content += data.choices[0].delta.content
                assistantMsg.details.isThinking = false // Start showing content
                nextTick(() => scrollToBottom())
              }
            } else if (eventType === 'flowResponses') {
              assistantMsg.details.responses.push(data)
              if (data.quoteList && data.quoteList.length > 0) {
                 data.quoteList.forEach(quote => {
                     if (!assistantMsg.details.references.find(r => r.id === quote.id)) {
                         assistantMsg.details.references.push(quote)
                     }
                 })
              }
            } else if (eventType === 'workflowDuration') {
              assistantMsg.details.duration = data.durationSeconds
            }
          }
        }
      }
    } catch (streamError) {
      console.error('Stream processing error:', streamError)
    } finally {
      // Mark all running steps as finished
      if (assistantMsg.details && assistantMsg.details.steps) {
        assistantMsg.details.steps.forEach(step => {
             if (step.status === 'running') step.status = 'success'
        })
      }
    }
    
    assistantMsg.details.isThinking = false

    // If no content received (and no error thrown), maybe it was a plain JSON response?
    if (!isStream && buffer.trim().startsWith('{')) {
       try {
         const data = JSON.parse(buffer)
          let msg = data.content || data.message || data.reply || (data.choices && data.choices[0]?.message?.content)
          if (msg) assistantMsg.content = msg
       } catch(e) {}
    }


  } catch (error) {
    console.error('Chat error:', error)
    let friendlyMessage = ''
    if (error.message.includes('Failed to fetch')) friendlyMessage = '🌐 网络连接失败'
    else friendlyMessage = error.message // Use the error message directly as we formatted it above
    
    if (!friendlyMessage.startsWith('🚫') && !friendlyMessage.startsWith('⚠️') && !friendlyMessage.startsWith('🔒')) {
         friendlyMessage = `❌ 发生错误：${error.message}`
    }

    // Update the existing bubble instead of pushing new one
    assistantMsg.content = friendlyMessage
    assistantMsg.details.isThinking = false
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
  font-family: var(--vp-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  z-index: 1000;
  position: fixed;
  pointer-events: none;
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
  background: var( --vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 2000;
}

.chat-toggle-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  background: var(--vp-c-bg-soft);
}

.chat-window {
  position: absolute;
  width: 380px;
  height: 600px;
  max-height: 80vh;
  background: var(--vp-c-bg, #ffffff);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider, #e2e2e2);
  z-index: 2000;
  transition: box-shadow 0.3s ease;
  backdrop-filter: blur(10px);
}

:global(.dark) .chat-window {
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}

.chat-header {
  height: 60px;
  background: var(--vp-c-bg);
  color: var( --vp-c-text-1, white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  cursor: move;
  user-select: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.chat-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  animation: pulse 2s infinite;
}

.chat-controls .close-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  transition: all 0.2s;
}

.chat-controls .close-btn:hover {
  background: rgba(255,255,255,0.25);
  color: white;
  transform: rotate(90deg);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: var(--vp-c-bg-soft, #f9f9f9);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-message {
  text-align: center;
  color: var(--vp-c-text-2, #666);
  font-size: 14px;
  margin-top: 30px;
  background: var(--vp-c-bg, #fff);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  align-self: center;
  max-width: 80%;
}

.message-row {
  display: flex;
  align-items: flex-end;
  max-width: 100%;
  gap: 10px;
}

.message-left {
  align-self: flex-start;
  flex-direction: row; /* Default */
}

.message-right {
  align-self: flex-end;
  flex-direction: row-reverse; /* Avatar on right of bubble */
  justify-content: flex-end; /* Align group to right */
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--vp-c-bg, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2, #555);
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  border: 1px solid var(--vp-c-divider, #eee);
  transition: transform 0.2s;
}

.message-avatar:hover {
  transform: scale(1.1);
}

.message-right .message-avatar {
  background: var(--vp-c-brand-2, #5C96F5);
  color: white;
  border: none;
}

.message-bubble {
  padding: 7px 10px;
  border-radius: 16px;
  font-size: 14.5px;
  line-height: 1.6;
  max-width: 260px;
  word-wrap: break-word;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.message-left .message-bubble {
  background: var(--vp-c-bg, #ffffff);
  color: var(--vp-c-text-1, #333);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--vp-c-divider, #eee);
}

.message-right .message-bubble {
  background: var(--vp-c-brand-1, #367BF0);
  color: white;
  border-bottom-right-radius: 4px; /* Point towards avatar (on right) */
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 18px;
}

.dot {
  width: 6px;
  height: 6px;
  background: var(--vp-c-text-3, #999);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}

.chat-input-area {
  padding: 15px;
  background: var(--vp-c-bg, white);
  border-top: 1px solid var(--vp-c-divider, #eee);
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.chat-input-area textarea {
  flex: 1;
  border: 2px solid transparent;
  border-radius: 24px;
  padding: 7px 18px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  background: var(--vp-c-bg-soft, #f9f9f9);
  color: var(--vp-c-text-1, #333);
  max-height: 120px;
  outline: none;
  transition: all 0.2s;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
}

.chat-input-area textarea:focus {
  background: var(--vp-c-bg, white);
  border-color: var(--vp-c-brand-1, #367BF0);
  box-shadow: 0 0 0 3px rgba(54, 123, 240, 0.15);
}

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--vp-c-brand-1, #367BF0);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(54, 123, 240, 0.3);
}

.send-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2, #5C96F5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(92, 150, 245, 0.4);
}

.send-btn:disabled {
  background: var(--vp-c-text-3, #ccc);
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider, rgba(0,0,0,0.1));
  border-radius: 3px;
}
.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3, rgba(0,0,0,0.2));
}

/* Message Details & Thinking Process */
.message-details {
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 4px;
}

.thinking-text {
  font-size: 13px;
  animation: pulse-text 2s infinite;
}

@keyframes pulse-text {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.thinking-process summary {
  cursor: pointer;
  list-style: none;
  font-size: 12px;
  color: var(--vp-c-text-2, #666);
  user-select: none;
  outline: none;
}

.thinking-process summary::-webkit-details-marker {
  display: none;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.summary-content:hover {
  opacity: 1;
}

.duration-badge {
  background: rgba(0,0,0,0.05);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
}

.steps-list {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.citation-area {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed rgba(0,0,0,0.08);
}

.citation-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-2, #666);
  margin-bottom: 6px;
}

.citation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.citation-item {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0,0,0,0.04);
  border-radius: 4px;
  color: var(--vp-c-brand-1, #367BF0);
  text-decoration: none;
  transition: all 0.2s;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.citation-item:hover {
  background: rgba(54, 123, 240, 0.1);
  text-decoration: underline;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2, #555);
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.step-icon.running {
  color: var(--vp-c-brand-1, #367BF0);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 4px;
  height: 4px;
  background: var(--vp-c-text-3, #ccc);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-content {
  white-space: pre-wrap;
}
</style>
