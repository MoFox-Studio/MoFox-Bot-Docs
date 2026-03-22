<template>
    <div class="chat-widget-container">
        <!-- Chat Window -->
        <div class="chat-window" :class="{ 'sidebar-open': isOpen }">
            <!-- Header -->
            <div class="chat-header">
                <div class="chat-header-left">
                    <button
                        @click="resetChat"
                        class="header-btn"
                        title="新对话"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                    <span class="chat-header-title">新对话</span>
                </div>
                <div class="chat-controls">
                    <button @click="resetChat" class="header-btn" title="重置">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path
                                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                            />
                        </svg>
                    </button>
                    <button @click="toggleChat" class="header-btn" title="关闭">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Messages Area -->
            <div class="chat-messages" ref="messagesContainer">
                <!-- Welcome Screen -->
                <div v-if="messages.length === 0" class="welcome-screen">
                    <div class="welcome-illustration">
                        <img
                            src="/mascot.png"
                            alt="MoFox 助手"
                            class="welcome-mascot"
                        />
                    </div>
                    <h2 class="welcome-greeting">{{ greeting }}</h2>
                    <p class="welcome-sub">What are we doing today?</p>

                    <div class="suggestion-grid">
                        <button
                            v-for="s in suggestions"
                            :key="s.title"
                            class="suggestion-card"
                            @click="sendSuggestion(s.prompt)"
                        >
                            <span class="suggestion-icon">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    v-html="s.svgPath"
                                ></svg>
                            </span>
                            <div class="suggestion-text">
                                <span class="suggestion-title">{{
                                    s.title
                                }}</span>
                                <span class="suggestion-sub">{{ s.sub }}</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- User messages -->
                <div
                    v-for="(msg, index) in messages"
                    :key="index"
                    class="message-row"
                    :class="
                        msg.role === 'user' ? 'message-right' : 'message-left'
                    "
                >
                    <!-- User avatar only -->
                    <div v-if="msg.role === 'user'" class="message-avatar">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>

                    <!-- User bubble -->
                    <div v-if="msg.role === 'user'" class="message-bubble">
                        <div
                            class="message-content markdown-content"
                            v-if="msg.content"
                            v-html="md.render(msg.content)"
                        ></div>
                    </div>

                    <!-- Assistant: CF-style layout (no avatar) -->
                    <div
                        v-if="msg.role === 'assistant'"
                        class="cf-assistant-block"
                    >
                        <!-- Thinking header (collapsible) -->
                        <div
                            v-if="
                                msg.details &&
                                msg.details.steps &&
                                msg.details.steps.length > 0
                            "
                            class="cf-thinking-section"
                        >
                            <button
                                class="cf-thinking-toggle"
                                @click="
                                    msg.details._showThinking =
                                        !msg.details._showThinking
                                "
                            >
                                <svg
                                    v-if="msg.details._showThinking"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polyline
                                        points="18 15 12 9 6 15"
                                    ></polyline>
                                </svg>
                                <svg
                                    v-else
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polyline
                                        points="6 9 12 15 18 9"
                                    ></polyline>
                                </svg>
                                <span
                                    v-if="msg.details.isThinking"
                                    class="cf-thinking-label thinking-text"
                                    >{{ getCurrentStepName(msg) }}</span
                                >
                                <span v-else class="cf-thinking-label">{{
                                    msg.details._showThinking
                                        ? "hide thinking"
                                        : "show thinking"
                                }}</span>
                            </button>

                            <!-- Steps list (visible when expanded or still thinking) -->
                            <div
                                v-if="
                                    msg.details._showThinking ||
                                    msg.details.isThinking
                                "
                                class="cf-steps-list"
                            >
                                <div
                                    v-for="(step, sIdx) in msg.details.steps"
                                    :key="sIdx"
                                    class="cf-step-item"
                                    :class="{
                                        'cf-step-running':
                                            step.status === 'running',
                                    }"
                                >
                                    <span class="cf-step-arrow">→</span>
                                    <span class="cf-step-name">{{
                                        step.name
                                    }}</span>
                                    <span
                                        v-if="step.status === 'running'"
                                        class="cf-step-badge cf-step-badge--running"
                                    >
                                        <svg
                                            class="spin"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="10"
                                            height="10"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2.5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path
                                                d="M21 12a9 9 0 1 1-6.219-8.56"
                                            ></path>
                                        </svg>
                                    </span>
                                    <span
                                        v-if="
                                            msg.details.duration &&
                                            !msg.details.isThinking &&
                                            sIdx ===
                                                msg.details.steps.length - 1
                                        "
                                        class="cf-step-duration"
                                        >({{ msg.details.duration }}s)</span
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Answer card -->
                        <div v-if="msg.content" class="cf-answer-card">
                            <div
                                class="message-content markdown-content"
                                v-html="md.render(msg.content)"
                            ></div>
                        </div>

                        <!-- Citations below card -->
                        <div
                            v-if="
                                msg.details &&
                                msg.details.references &&
                                msg.details.references.length > 0
                            "
                            class="cf-citations"
                        >
                            <a
                                v-for="(ref, idx) in msg.details.references"
                                :key="idx"
                                :href="ref.url || '#'"
                                :target="ref.url ? '_blank' : '_self'"
                                class="cf-citation-chip"
                                :title="ref.title || ref.name"
                            >
                                {{
                                    ref.title || ref.name || "文档 " + (idx + 1)
                                }}
                            </a>
                        </div>

                        <!-- Typing indicator -->
                        <div
                            v-if="
                                isLoading &&
                                !msg.content &&
                                (!msg.details ||
                                    !msg.details.steps ||
                                    msg.details.steps.length === 0)
                            "
                            class="typing-indicator"
                        >
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="chat-input-area">
                <div class="privacy-notice">
                    Chats are recorded to improve the service and are processed
                    in accordance with our <a href="#">Privacy Policy</a>.
                    <button class="close-notice">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div
                    class="input-box"
                    :class="{ 'input-box--active': inputMessage.length > 0 }"
                >
                    <textarea
                        v-model="inputMessage"
                        placeholder="What can we help you with?"
                        @keydown.enter.prevent="handleEnter"
                        rows="3"
                        ref="textarea"
                        class="chat-textarea"
                    ></textarea>
                    <div class="input-actions">
                        <button class="settings-btn" title="Settings">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
                                ></path>
                            </svg>
                        </button>
                        <button
                            class="send-btn"
                            @click="sendMessage"
                            :disabled="!inputMessage.trim() || isLoading"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon
                                    points="22 2 15 22 11 13 2 9 22 2"
                                ></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import MarkdownIt from "markdown-it";
import { useChatState } from "./useChatState";

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    typographer: true,
});

// Shared state from composable
const { isOpen, pendingMessage, toggle, close } = useChatState();

// State
const inputMessage = ref("");
const messages = ref([]);
const isLoading = ref(false);
const isWaiting = ref(false);
// const position = reactive({ x: 20, y: window.innerHeight - 600 }) // Removed position
// const isDragging = ref(false) // Removed drag
// const dragOffset = reactive({ x: 0, y: 0 }) // Removed drag offset
const chatWindow = ref(null);
const messagesContainer = ref(null);
const chatId = ref("session-" + Date.now());

// Rate limiting - 50 requests per session
const RATE_LIMIT = 50;
const STORAGE_KEY = "chat_request_count";

function getCurrentStepName(msg) {
    if (!msg.details || !msg.details.steps) return "思考中...";
    const runningStep = msg.details.steps.find((s) => s.status === "running");
    if (runningStep) return runningStep.name + "...";
    const lastStep = msg.details.steps[msg.details.steps.length - 1];
    return lastStep ? lastStep.name : "思考中...";
}

function getRateLimitData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Failed to read rate limit data:", e);
    }
    return { count: 0, resetDate: new Date().toDateString() };
}

function updateRateLimitCount() {
    const today = new Date().toDateString();
    let data = getRateLimitData();

    // Reset count if it's a new day
    if (data.resetDate !== today) {
        data = { count: 0, resetDate: today };
    }

    data.count++;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to update rate limit:", e);
    }
    return data.count;
}

function checkRateLimit() {
    const data = getRateLimitData();
    const today = new Date().toDateString();

    if (data.resetDate !== today) {
        return { allowed: true, remaining: RATE_LIMIT };
    }

    return {
        allowed: data.count < RATE_LIMIT,
        remaining: Math.max(0, RATE_LIMIT - data.count),
    };
}

// Adjust initial position on mount
// onMounted(() => {
//   // position.y = window.innerHeight - 520;
//   // position.x = 20;
// })

function resetChat() {
    messages.value = [];
    chatId.value = "session-" + Date.now();
    inputMessage.value = "";
}

function toggleChat() {
    toggle();
    if (isOpen.value) {
        nextTick(() => scrollToBottom());
    }
}

// Watch for pending messages from BottomInput
watch(isOpen, async (newVal) => {
    if (newVal) {
        await nextTick();
        scrollToBottom();
        if (pendingMessage.value) {
            inputMessage.value = pendingMessage.value;
            pendingMessage.value = "";
            await nextTick();
            await sendMessage();
        }
    }
});

function handleEnter(e) {
    if (!e.shiftKey) {
        sendMessage();
    }
}

// ← 在这里修改你的 Worker 地址
const WORKER_URL = "https://red-frost-5db0.x18982400258.workers.dev/";

// 获取当前页面上下文，发送给 Agent 的 step ②
function getPageContext() {
    if (typeof window === "undefined") return null;
    return {
        url: window.location.href,
        title: document.title,
        // 优先取 VitePress 正文容器，避免把导航栏/侧边栏内容带进去
        content:
            (
                document.querySelector(".vp-doc") ||
                document.querySelector("main") ||
                document.querySelector("article")
            )?.innerText?.slice(0, 2000) || "",
    };
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop =
            messagesContainer.value.scrollHeight;
    }
}

async function sendMessage() {
    const content = inputMessage.value.trim();
    if (!content || isLoading.value) return;

    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
        messages.value.push({
            role: "assistant",
            content: `😔 您今天的请求次数已达到上限（${RATE_LIMIT}次）。请明天再试，或联系管理员提升额度。`,
        });
        nextTick(() => scrollToBottom());
        return;
    }

    // Add user message
    messages.value.push({
        role: "user",
        content: content,
    });

    inputMessage.value = "";
    isLoading.value = true;

    // Initialize assistant message immediately
    const assistantMsg = reactive({
        role: "assistant",
        content: "",
        details: {
            steps: [],
            responses: [],
            references: [],
            duration: 0,
            isThinking: true,
            _showThinking: true,
        },
    });
    messages.value.push(assistantMsg);
    nextTick(() => scrollToBottom());

    try {
        // Update rate limit count
        updateRateLimitCount();

        // Construct payload
        const payload = {
            chatId: chatId.value,
            messages: messages.value
                .slice(0, -1)
                .map((m) => ({
                    // Exclude the empty assistant message we just added
                    role: m.role,
                    content: m.content,
                }))
                .filter((m) => m.content), // Filter out any empty messages just in case
            pageContext: getPageContext(), // 当前页面上下文，供 Agent 理解用户所在位置
        };

        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorMsg = "服务器响应异常";
            if (response.status === 429)
                errorMsg = "🚫 请求过于频繁，请稍后再试";
            else if (response.status >= 500)
                errorMsg = "⚠️ 服务器错误，请稍后重试";
            else if (response.status === 403) errorMsg = "🔒 访问被拒绝";
            else if (response.status === 404) errorMsg = "❓ 服务接口不存在";

            throw new Error(errorMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let isStream = false;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                isStream = true;
                buffer += decoder.decode(value, { stream: true });

                // Split by double newline to get events
                const lines = buffer.split("\n\n");
                buffer = lines.pop(); // Keep the last incomplete chunk in buffer

                for (const line of lines) {
                    const eventMatch = line.match(/^event: (.*)$/m);
                    const dataMatch = line.match(/^data: (.*)$/m);

                    if (eventMatch && dataMatch) {
                        const eventType = eventMatch[1].trim();
                        let data = null;
                        try {
                            if (dataMatch[1].trim() === "[DONE]") break;
                            data = JSON.parse(dataMatch[1].trim());
                        } catch (e) {
                            console.warn(
                                "Failed to parse SSE data:",
                                dataMatch[1],
                            );
                            continue;
                        }

                        if (!data) continue;

                        if (eventType === "flowNodeStatus") {
                            const existingStep =
                                assistantMsg.details.steps.find(
                                    (s) => s.name === data.name,
                                );
                            if (existingStep) {
                                existingStep.status = data.status;
                            } else {
                                assistantMsg.details.steps.push({
                                    name: data.name,
                                    status: data.status,
                                    timestamp: Date.now(),
                                });
                            }
                        } else if (eventType === "answer") {
                            if (
                                data.choices &&
                                data.choices[0] &&
                                data.choices[0].delta &&
                                data.choices[0].delta.content
                            ) {
                                assistantMsg.content +=
                                    data.choices[0].delta.content;
                                assistantMsg.details.isThinking = false; // Start showing content
                                nextTick(() => scrollToBottom());
                            }
                        } else if (eventType === "flowResponses") {
                            assistantMsg.details.responses.push(data);
                            if (data.quoteList && data.quoteList.length > 0) {
                                data.quoteList.forEach((quote) => {
                                    if (
                                        !assistantMsg.details.references.find(
                                            (r) => r.id === quote.id,
                                        )
                                    ) {
                                        assistantMsg.details.references.push(
                                            quote,
                                        );
                                    }
                                });
                            }
                        } else if (eventType === "workflowDuration") {
                            assistantMsg.details.duration =
                                data.durationSeconds;
                        }
                    }
                }
            }
        } catch (streamError) {
            console.error("Stream processing error:", streamError);
        } finally {
            // Mark all running steps as finished
            if (assistantMsg.details && assistantMsg.details.steps) {
                assistantMsg.details.steps.forEach((step) => {
                    if (step.status === "running") step.status = "success";
                });
            }
        }

        assistantMsg.details.isThinking = false;

        // If no content received (and no error thrown), maybe it was a plain JSON response?
        if (!isStream && buffer.trim().startsWith("{")) {
            try {
                const data = JSON.parse(buffer);
                let msg =
                    data.content ||
                    data.message ||
                    data.reply ||
                    (data.choices && data.choices[0]?.message?.content);
                if (msg) assistantMsg.content = msg;
            } catch (e) {}
        }
    } catch (error) {
        console.error("Chat error:", error);
        let friendlyMessage = "";
        if (error.message.includes("Failed to fetch"))
            friendlyMessage = "🌐 网络连接失败";
        else friendlyMessage = error.message; // Use the error message directly as we formatted it above

        if (
            !friendlyMessage.startsWith("🚫") &&
            !friendlyMessage.startsWith("⚠️") &&
            !friendlyMessage.startsWith("🔒")
        ) {
            friendlyMessage = `❌ 发生错误：${error.message}`;
        }

        // Update the existing bubble instead of pushing new one
        assistantMsg.content = friendlyMessage;
        assistantMsg.details.isThinking = false;
    } finally {
        isLoading.value = false;
        isWaiting.value = false;
        nextTick(() => scrollToBottom());
    }
}

// ── 问候语（按时段） ────────────────────────────────────────────
const greeting = computed(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning.";
    if (h >= 12 && h < 18) return "Good afternoon.";
    return "Good evening.";
});

// ── 快捷建议卡片 ───────────────────────────────────────────────
const suggestions = [
    {
        svgPath:
            '<path d="M13.5 10.5 21 3"/><path d="M16 3h5v5"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/><path d="m11 10-6.5 6.5A2.12 2.12 0 0 0 7.5 19.5L14 13"/>',
        title: "快速开始",
        sub: "Help me get started",
        prompt: "如何快速开始使用 MoFox Bot？",
    },
    {
        svgPath:
            '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
        title: "插件开发",
        sub: "How to create plugins",
        prompt: "如何开发一个 MoFox Bot 插件？",
    },
    {
        svgPath:
            '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        title: "配置说明",
        sub: "Show my configuration",
        prompt: "MoFox Bot 有哪些配置项？",
    },
    {
        svgPath:
            '<path d="M17.5 19c2.5 0 4.5-2 4.5-4.5a4.5 4.5 0 0 0-4.1-4.5h-.1a5.5 5.5 0 0 0-10.7-1C5.2 9.2 4 10.5 4 12c0 1.7 1.3 3 3 3h10.5z"/>',
        title: "Docker 部署",
        sub: "What is the process?",
        prompt: "如何使用 Docker 部署 MoFox Bot？",
    },
];

function sendSuggestion(prompt) {
    inputMessage.value = prompt;
    sendMessage();
}

// Drag functionality removed
</script>

<style scoped>
.chat-widget-container {
    font-family: var(
        --vp-font-family-base,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif
    );
    z-index: 1000;
}

:global(body) {
    --chat-sidebar-width: 400px;
}

/* ── Window ─────────────────────────────────────────────────── */
.chat-window {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--chat-sidebar-width);
    height: 100vh;
    max-height: 100vh;
    background: #fdfdfc;
    box-shadow: -2px 0 24px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    overflow: hidden;
    border-left: 1px solid rgba(0, 0, 0, 0.06);
    z-index: 2000;
    transition:
        transform 0.32s cubic-bezier(0.25, 0.8, 0.25, 1),
        box-shadow 0.3s ease;
    transform: translateX(100%);
}

.chat-window.sidebar-open {
    transform: translateX(0);
    box-shadow: -4px 0 40px rgba(0, 0, 0, 0.12);
}

:global(.dark) .chat-window {
    background: #111111;
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: -2px 0 24px rgba(0, 0, 0, 0.4);
}

/* ── Header ─────────────────────────────────────────────────── */
.chat-header {
    height: 56px;
    flex-shrink: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

:global(.dark) .chat-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.chat-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.chat-header-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-1);
}

.chat-controls {
    display: flex;
    align-items: center;
    gap: 2px;
}

.header-btn {
    background: transparent;
    border: none;
    color: var(--vp-c-text-3);
    cursor: pointer;
    padding: 7px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        background 0.18s,
        color 0.18s;
}

.header-btn:hover {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
}

/* ── Messages ────────────────────────────────────────────────── */
.chat-messages {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;
    background: var(--vp-c-bg-alt);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* ── Welcome Screen ──────────────────────────────────────────── */
.welcome-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 8px 16px;
    gap: 0;
}

.welcome-illustration {
    margin-bottom: 12px;
}

.welcome-mascot {
    width: 120px;
    height: 120px;
    object-fit: contain;
    filter: drop-shadow(0 6px 20px rgba(100, 150, 255, 0.2));
    animation: mascot-float 3s ease-in-out infinite;
    user-select: none;
    pointer-events: none;
}

@keyframes mascot-float {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-6px);
    }
}

.welcome-greeting {
    font-size: 24px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    margin: 0 0 8px;
    letter-spacing: -0.3px;
}

.welcome-sub {
    font-size: 15px;
    color: var(--vp-c-text-2);
    margin: 0 0 32px;
}

.suggestion-grid {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.suggestion-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    font-family: inherit;
}

:global(.dark) .suggestion-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.suggestion-card:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.1);
    transform: scale(1.01);
}

:global(.dark) .suggestion-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
}

.suggestion-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--vp-c-text-2);
    opacity: 0.7;
}

.suggestion-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.suggestion-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    line-height: 1.4;
}

.suggestion-sub {
    font-size: 14px;
    color: var(--vp-c-text-2);
    line-height: 1.4;
}

/* ── Message Rows ────────────────────────────────────────────── */
.message-row {
    display: flex;
    align-items: flex-start;
    max-width: 100%;
    gap: 8px;
}

.message-row.message-left {
    gap: 0;
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
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--vp-c-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--vp-c-text-2);
    flex-shrink: 0;
    border: 1px solid var(--vp-c-divider);
}

.message-right .message-avatar {
    background: var(--vp-c-brand-1);
    color: white;
    border: none;
}

.message-bubble {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.65;
    max-width: 85%;
    word-wrap: break-word;
}

.message-right .message-bubble {
    background: var(--vp-c-brand-1);
    color: white;
    border-top-right-radius: 4px;
}

/* ── Input Area ──────────────────────────────────────────────── */
.chat-input-area {
    padding: 16px;
    background: transparent;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.privacy-notice {
    font-size: 12px;
    color: var(--vp-c-text-2);
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    padding: 12px 32px 12px 16px;
    position: relative;
    line-height: 1.4;
}

:global(.dark) .privacy-notice {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.privacy-notice a {
    color: var(--vp-c-text-1);
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.2);
    text-underline-offset: 2px;
}

:global(.dark) .privacy-notice a {
    text-decoration-color: rgba(255, 255, 255, 0.2);
}

.close-notice {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--vp-c-text-3);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

.close-notice:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--vp-c-text-2);
}

.input-box {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid #f97316; /* Orange border like CF */
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

:global(.dark) .input-box {
    background: #111111;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.input-box:focus-within {
    box-shadow: 0 6px 24px rgba(249, 115, 22, 0.15);
}

.chat-textarea {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 15px;
    color: var(--vp-c-text-1);
    resize: none;
    max-height: 140px;
    min-height: 60px;
    line-height: 1.5;
}

.chat-textarea::placeholder {
    color: var(--vp-c-text-3);
}

.input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
}

.settings-btn {
    background: transparent;
    border: none;
    color: var(--vp-c-text-3);
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.settings-btn:hover {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-2);
}

.send-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f3f3f3;
    color: #a1a1aa;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

:global(.dark) .send-btn {
    background: #222;
    color: #555;
}

.send-btn:not(:disabled) {
    background: var(--vp-c-text-1);
    color: var(--vp-c-bg);
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
    transform: scale(0.96);
}

.send-btn:disabled {
    background: var(--vp-c-divider);
    cursor: not-allowed;
    opacity: 0.6;
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
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
    margin: 4px 0 8px 18px;
    padding: 0;
}
.markdown-content :deep(pre) {
    background: var(--vp-c-bg-alt);
    border: 1px solid var(--vp-c-divider);
    padding: 10px;
    overflow-x: auto;
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

.markdown-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    display: block;
    overflow-x: auto;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
    border: 1px solid var(--vp-c-divider);
    padding: 8px 12px;
    text-align: left;
    min-width: 100px; /* Ensure columns don't get too narrow, triggering scroll for many columns */
}

.markdown-content :deep(th) {
    background: var(--vp-c-bg-soft);
    font-weight: 600;
}

/* Specific overrides for right bubble markdown to be readable on blue */
.message-right .markdown-content :deep(code),
.message-right .markdown-content :deep(pre) {
    background: rgba(255, 255, 255, 0.2) !important;
    color: white;
    border: none;
}
.message-right .markdown-content :deep(a) {
    color: white;
    text-decoration: underline;
}

/* ── CF-style Assistant Block ────────────────────────────────── */
.cf-assistant-block {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* ── Thinking Section ────────────────────────────────────────── */
.cf-thinking-section {
    margin-bottom: 6px;
}

.cf-thinking-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    color: var(--vp-c-text-3, #999);
    transition: color 0.15s;
    user-select: none;
}

.cf-thinking-toggle:hover {
    color: var(--vp-c-text-2);
}

.cf-thinking-label {
    font-size: 13px;
}

.thinking-text {
    font-size: 13px;
    animation: pulse-text 2s infinite;
}

@keyframes pulse-text {
    0% {
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.6;
    }
}

/* ── Steps List ──────────────────────────────────────────────── */
.cf-steps-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 4px 0 2px;
}

.cf-step-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--vp-c-text-2, #666);
    line-height: 1.5;
}

.cf-step-item.cf-step-running {
    color: var(--vp-c-text-1);
}

.cf-step-arrow {
    color: var(--vp-c-text-3, #aaa);
    flex-shrink: 0;
    font-size: 12px;
}

.cf-step-name {
    min-width: 0;
    word-break: break-word;
}

.cf-step-badge--running {
    display: inline-flex;
    align-items: center;
    color: var(--vp-c-brand-1, #367bf0);
    flex-shrink: 0;
}

.cf-step-duration {
    font-size: 11px;
    color: var(--vp-c-text-3, #aaa);
    flex-shrink: 0;
}

/* ── Answer Card ─────────────────────────────────────────────── */
.cf-answer-card {
    background: var(--vp-c-bg);
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 14px;
    padding: 20px 22px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--vp-c-text-1);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

:global(.dark) .cf-answer-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* ── Citations ───────────────────────────────────────────────── */
.cf-citations {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    padding-left: 2px;
}

.cf-citation-chip {
    font-size: 11px;
    padding: 3px 10px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 999px;
    color: var(--vp-c-brand-1, #367bf0);
    text-decoration: none;
    transition: all 0.18s;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid transparent;
}

.cf-citation-chip:hover {
    background: rgba(54, 123, 240, 0.08);
    border-color: rgba(54, 123, 240, 0.2);
    text-decoration: underline;
}

:global(.dark) .cf-citation-chip {
    background: rgba(255, 255, 255, 0.04);
}

:global(.dark) .cf-citation-chip:hover {
    background: rgba(54, 123, 240, 0.12);
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
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

.typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {
    0%,
    80%,
    100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}
</style>
