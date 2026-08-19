<template>
  <div
    v-if="!isHomePage"
    class="ai-assistant"
    :class="{
      'ai-assistant--expanded': focused || hasConversation,
      'ai-assistant--chat': hasConversation,
    }"
  >
    <div v-if="hasConversation" ref="panelEl" class="ai-assistant-panel">
      <div ref="messagesEl" class="ai-assistant-messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="ai-msg"
          :class="`ai-msg--${message.role}`"
        >
          <div v-if="message.role === 'user'" class="ai-msg-bubble">
            {{ message.content }}
          </div>
          <div v-else class="ai-msg-body">
            <div
              class="ai-msg-markdown"
              v-html="renderMarkdown(message.content)"
            />
            <div
              v-if="message.phase === 'thinking'"
              class="ai-msg-status"
            >AI 正在思考…</div>
            <div
              v-else-if="message.phase === 'searching'"
              class="ai-msg-status"
            >正在搜索文档…</div>
            <div
              v-if="message.status === 'streaming'"
              class="ai-msg-cursor"
              :aria-hidden="true"
            />
            <div v-if="message.sources.length" class="ai-msg-sources">
              <span class="ai-msg-sources-title">参考来源</span>
              <a
                v-for="(source, i) in message.sources"
                :key="`${source.url}-${i}`"
                class="ai-msg-source"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
              >{{ source.title || source.url }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form class="ai-assistant-input" @submit.prevent="send">
      <textarea
        ref="inputEl"
        v-model="input"
        class="ai-assistant-textarea"
        :rows="1"
        :placeholder="streaming ? 'AI 正在回答…' : '向 MoFox AI 提问'"
        :disabled="streaming"
        @focus="focused = true"
        @blur="focused = false"
        @keydown="onKeydown"
        @input="autosize"
      />
      <button
        class="ai-assistant-send"
        type="submit"
        :disabled="streaming || !input.trim()"
        :aria-label="'发送问题'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed, nextTick, onUnmounted, ref } from "vue";
import { useData } from "vitepress";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "done" | "streaming";
  phase: "thinking" | "searching" | "streaming" | "done";
  sources: { url: string; title?: string }[];
}

interface AgentChunk {
  type: string;
  messageId?: string;
  delta?: string;
  text?: string;
  url?: string;
  title?: string;
  errorText?: string;
  response?: {
    messages?: { role?: string; parts?: { type?: string; url?: string; title?: string }[] }[];
  };
}

const { frontmatter, theme } = useData();

const isHomePage = computed(() => frontmatter.value?.layout === "home");

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

const appId = computed(
  () => (theme.value.search?.options as { appId?: string } | undefined)?.appId ?? "",
);
const apiKey = computed(
  () => (theme.value.search?.options as { apiKey?: string } | undefined)?.apiKey ?? "",
);
const agentId = computed(() => {
  const askAi = (theme.value.search?.options as { askAi?: { agentId?: string } } | undefined)
    ?.askAi;
  return typeof askAi === "string" ? askAi : (askAi?.agentId ?? "");
});

const input = ref("");
const focused = ref(false);
const streaming = ref(false);
const hasConversation = ref(false);
const messages = ref<ChatMessage[]>([]);

const inputEl = ref<HTMLTextAreaElement | null>(null);
const panelEl = ref<HTMLDivElement | null>(null);
const messagesEl = ref<HTMLDivElement | null>(null);

let abortController: AbortController | null = null;

function renderMarkdown(source: string) {
  if (!source) return "";
  return md.render(source);
}

function autosize() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send();
  }
}

function scrollToBottom() {
  void nextTick(() => {
    const panel = panelEl.value;
    const list = messagesEl.value;
    if (panel) panel.scrollTop = panel.scrollHeight;
    if (list) list.scrollTop = list.scrollHeight;
  });
}

function buildRequest() {
  return {
    id: crypto.randomUUID(),
    messages: messages.value
      .filter((m) => m.status === "done")
      .map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      })),
    algolia: {},
  };
}

async function send() {
  const question = input.value.trim();
  if (!question || streaming.value || !appId.value || !apiKey.value || !agentId.value) {
    return;
  }

  messages.value.push({
    id: crypto.randomUUID(),
    role: "user",
    content: question,
    status: "done",
    phase: "done",
    sources: [],
  });
  const assistantId = crypto.randomUUID();
  messages.value.push({
    id: assistantId,
    role: "assistant",
    content: "",
    status: "streaming",
    phase: "thinking",
    sources: [],
  });

  input.value = "";
  if (inputEl.value) inputEl.value.style.height = "auto";
  streaming.value = true;
  hasConversation.value = true;
  scrollToBottom();

  abortController = new AbortController();
  try {
    const response = await fetch(
      `https://${appId.value}.algolia.net/agent-studio/1/agents/${agentId.value}/completions?stream=true&compatibilityMode=ai-sdk-5`,
      {
        method: "POST",
        headers: {
          "x-algolia-application-id": appId.value,
          "x-algolia-api-key": apiKey.value,
          "content-type": "application/json",
        },
        body: JSON.stringify(buildRequest()),
        signal: abortController.signal,
      },
    );

    if (!response.ok || !response.body) {
      let message = `请求失败 (${response.status})`;
      try {
        const error = await response.json();
        if (error?.message) message = error.message;
      } catch {
        /* 忽略解析失败 */
      }
      throw new Error(message);
    }

    const decoder = new TextDecoder();
    let buffer = "";
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separator: number;
      while ((separator = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
        if (!dataLine) continue;
        const json = dataLine.slice(5).trim();
        if (!json) continue;
        try {
          handleChunk(JSON.parse(json) as AgentChunk);
        } catch {
          /* 忽略无法解析的块 */
        }
      }
    }

    const assistant = messages.value.find((m) => m.id === assistantId);
    if (assistant) {
      assistant.status = "done";
      assistant.phase = "done";
    }
  } catch (error) {
    const assistant = messages.value.find((m) => m.id === assistantId);
    if (!abortController?.signal.aborted && assistant) {
      assistant.status = "done";
      assistant.phase = "done";
      if (!assistant.content) {
        const message =
          error instanceof Error && error.message ? error.message : "请求失败，请稍后重试。";
        assistant.content = `> ⚠️ ${message}`;
      }
    } else if (assistant) {
      assistant.status = "done";
      assistant.phase = "done";
    }
  } finally {
    streaming.value = false;
    scrollToBottom();
  }
}

function handleChunk(chunk: AgentChunk) {
  const assistant = messages.value[messages.value.length - 1];
  if (!assistant || assistant.role !== "assistant") return;

  switch (chunk.type) {
    case "start-step":
      assistant.phase = "thinking";
      break;
    case "tool-input-start":
    case "tool-input-available":
    case "tool-output-available":
      assistant.phase = "searching";
      break;
    case "text-start":
      assistant.phase = "streaming";
      if (chunk.delta) assistant.content += chunk.delta;
      break;
    case "text-delta":
      if (chunk.delta) assistant.content += chunk.delta;
      break;
    case "source-url":
      if (chunk.url && !assistant.sources.some((s) => s.url === chunk.url)) {
        assistant.sources.push({ url: chunk.url, title: chunk.title });
      }
      break;
    case "finish":
      assistant.status = "done";
      assistant.phase = "done";
      const parts = chunk.response?.messages?.[0]?.parts ?? [];
      for (const part of parts) {
        if (part.type === "source-url" && part.url) {
          if (!assistant.sources.some((s) => s.url === part.url)) {
            assistant.sources.push({ url: part.url, title: part.title });
          }
        }
      }
      break;
    case "error":
      throw new Error(chunk.errorText || "AI 回答失败，请稍后重试。");
  }
  scrollToBottom();
}

onUnmounted(() => {
  abortController?.abort();
});
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 250;
  display: flex;
  flex-direction: column;
  width: 320px;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 100px;
  background: var(--vp-c-bg);
  box-shadow: 0 4px 18px rgb(0 0 0 / 8%);
  transition: width 0.25s ease, border-radius 0.25s ease, border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.ai-assistant--expanded {
  width: 520px;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 24px rgb(0 0 0 / 14%);
}

.ai-assistant--chat {
  border-radius: 16px;
}

.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.ai-assistant--chat .ai-assistant-panel {
  max-height: min(60vh, 520px);
  opacity: 1;
  overflow-y: auto;
  border-bottom: 1px solid var(--vp-c-divider);
}

.ai-assistant-messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 10px;
}

.ai-msg {
  display: flex;
}

.ai-msg--user {
  justify-content: flex-end;
}

.ai-msg-bubble {
  max-width: 86%;
  padding: 8px 13px;
  border-radius: 14px 14px 4px 14px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-size: 13.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-msg-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.ai-msg-markdown {
  width: 100%;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

.ai-msg-markdown :deep(p) {
  margin: 0 0 6px;
}

.ai-msg-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-msg-markdown :deep(pre) {
  margin: 6px 0;
  padding: 10px 12px;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  font-size: 12.5px;
}

.ai-msg-markdown :deep(code) {
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--vp-c-bg-alt);
  font-size: 0.92em;
}

.ai-msg-markdown :deep(pre code) {
  padding: 0;
  background: transparent;
}

.ai-msg-markdown :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ai-msg-markdown :deep(ul),
.ai-msg-markdown :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

.ai-msg-status {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  animation: ai-msg-blink 1.2s ease-in-out infinite;
}

.ai-msg-cursor {
  display: inline-block;
  width: 2px;
  height: 1.05em;
  margin-top: 2px;
  background: var(--vp-c-brand-1);
  animation: ai-msg-blink 0.8s step-end infinite;
}

@keyframes ai-msg-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.ai-msg-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
}

.ai-msg-sources-title {
  width: 100%;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.ai-msg-source {
  padding: 3px 9px;
  border-radius: 100px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-brand-1);
  font-size: 11.5px;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.ai-msg-source:hover {
  border-color: var(--vp-c-brand-1);
}

.ai-assistant-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  padding: 8px 8px 8px 14px;
}

.ai-assistant-textarea {
  flex: 1;
  min-width: 0;
  max-height: 96px;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 13.5px;
  line-height: 1.55;
  padding: 5px 0;
}

.ai-assistant-textarea::placeholder {
  color: var(--vp-c-text-3);
}

.ai-assistant-send {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.ai-assistant-send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ai-assistant-send:not(:disabled):hover {
  transform: scale(1.08);
}

@media (max-width: 640px) {
  .ai-assistant {
    bottom: 14px;
    width: calc(100vw - 32px);
  }

  .ai-assistant--expanded {
    width: calc(100vw - 24px);
  }
}
</style>
