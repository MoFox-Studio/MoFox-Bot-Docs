import DefaultTheme from 'vitepress/theme'
import './custom.css'
import './style/sidebar.css'
import Giscus from './Giscus.vue'
import GuideCards from './GuideCards.vue'
import BibleDisplay from './BibleDisplay.vue'
import MoFoxTeamCard from './MoFoxTeamCard.vue'
import PluginStats from './PluginStats.vue'
import ContributePluginGuide from './ContributePluginGuide.vue'
import { h } from 'vue'
import ReadingTime from './ReadingTime.vue'
import BackToTop from './BackToTop.vue'
import ReadingProgress from './ReadingProgress.vue'
import { NolebaseEnhancedReadabilitiesMenu, NolebaseEnhancedReadabilitiesScreenMenu, NolebaseEnhancedReadabilitiesPlugin } from '@nolebase/vitepress-plugin-enhanced-readabilities/client'
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css'
import { 
  NolebaseGitChangelogPlugin ,
} from '@nolebase/vitepress-plugin-git-changelog/client'
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'
import { 
  NolebaseInlineLinkPreviewPlugin, 
} from '@nolebase/vitepress-plugin-inline-link-preview/client'

import '@nolebase/vitepress-plugin-inline-link-preview/client/style.css'
import NotFound from './NotFound.vue'
import BackgroundLogo from './components/BackgroundLogo.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'
import CodeCopyEnhancer from './CodeCopyEnhancer.vue'
import './style/link.scss'

// 动态加载外部脚本的函数
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export default {
  ...DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'not-found': () => h(NotFound),
      'doc-before': () => h(ReadingTime),
      'doc-after': () => h(Giscus),
      'nav-bar-content-after': () => h(NolebaseEnhancedReadabilitiesMenu),
      'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
      'layout-bottom': () => [h(BackToTop), h(BackgroundLogo), h(ReadingProgress), h(KeyboardShortcuts), h(CodeCopyEnhancer)],
    })
  },
  enhanceApp({ app }) {
    if (!import.meta.env.SSR) {
      const iconifyScript = document.createElement('script');
      iconifyScript.src = 'https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js';
      document.head.appendChild(iconifyScript);

      // Load Chatbot Script
      if (!document.getElementById('chatbot-iframe')) {
        const chatbotScript = document.createElement('script');
        chatbotScript.type = 'text/javascript';
        // 依然使用 HTTPS 域名防止 Mixed Content 错误
        const baseUrl = 'https://m.43land.fun';
        // FastGPT/Other bot script path
        chatbotScript.src = `${baseUrl}/js/iframe.js`;
        chatbotScript.id = 'chatbot-iframe';
        // Construct the full chat URL
        chatbotScript.dataset.botSrc = `${baseUrl}/chat/share?shareId=aliqixwlJWkucyWtFgjKGiNH&showHistory=0`;
        chatbotScript.dataset.defaultOpen = 'false';
        chatbotScript.dataset.drag = 'true';
        chatbotScript.dataset.openIcon = "data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTMyNzg1NjY0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQxMzIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDMyQzI0Ny4wNCAzMiAzMiAyMjQgMzIgNDY0QTQxMC4yNCA0MTAuMjQgMCAwIDAgMTcyLjQ4IDc2OEwxNjAgOTY1LjEyYTI1LjI4IDI1LjI4IDAgMCAwIDM5LjA0IDIyLjRsMTY4LTExMkE1MjguNjQgNTI4LjY0IDAgMCAwIDUxMiA4OTZjMjY0Ljk2IDAgNDgwLTE5MiA0ODAtNDMyUzc3Ni45NiAzMiA1MTIgMzJ6IG0yNDQuOCA0MTZsLTM2MS42IDMwMS43NmExMi40OCAxMi40OCAwIDAgMS0xOS44NC0xMi40OGw1OS4yLTIzMy45MmgtMTYwYTEyLjQ4IDEyLjQ4IDAgMCAxLTcuMzYtMjMuMzZsMzYxLjYtMzAxLjc2YTEyLjQ4IDEyLjQ4IDAgMCAxIDE5Ljg0IDEyLjQ4bC01OS4yIDIzMy45MmgxNjBhMTIuNDggMTIuNDggMCAwIDEgOCAyMi4wOHoiIGZpbGw9IiM0ZTgzZmQiIHAtaWQ9IjQxMzMiPjwvcGF0aD48L3N2Zz4=";
        chatbotScript.dataset.closeIcon = "data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTM1NDQxNTI2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjYzNjciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDEwMjRBNTEyIDUxMiAwIDEgMSA1MTIgMGE1MTIgNTEyIDAgMCAxIDAgMTAyNHpNMzA1Ljk1NjU3MSAzNzAuMzk1NDI5TDQ0Ny40ODggNTEyIDMwNS45NTY1NzEgNjUzLjYwNDU3MWE0NS41NjggNDUuNTY4IDAgMSAwIDY0LjQzODg1OCA2NC40Mzg4NThMNTEyIDU3Ni41MTJsMTQxLjYwNDU3MSAxNDEuNTMxNDI5YTQ1LjU2OCA0NS41NjggMCAwIDAgNjQuNDM4ODU4LTY0LjQzODg1OEw1NzYuNTEyIDUxMmwxNDEuNTMxNDI5LTE0MS42MDQ1NzFhNDUuNTY4IDQ1LjU2OCAwIDEgMC02NC40Mzg4NTgtNjQuNDM4ODU4TDUxMiA0NDcuNDg4IDM3MC4zOTU0MjkgMzA1Ljk1NjU3MWE0NS41NjggNDUuNTY4IDAgMCAwLTY0LjQzODg1OCA2NC40Mzg4NTh6IiBmaWxsPSIjNGU4M2ZkIiBwLWlkPSI2MzY4Ij48L3BhdGg+PC9zdmc+";
        chatbotScript.defer = true;
        document.body.appendChild(chatbotScript);
      }

      // Force style for the new chatbot (FastGPT)
      const chatStyle = document.createElement('style');
      chatStyle.textContent = `
        /* Override FastGPT default positioning (bottom-right) to bottom-left */
        #fastgpt-chatbot-button {
           left: 20px !important;
           right: auto !important;
           bottom: 20px !important;
           z-index: 2147483647 !important;
        }
        #fastgpt-chatbot-window {
           left: 20px !important;
           right: auto !important;
           bottom: 80px !important;
           z-index: 2147483647 !important;
           transform-origin: bottom left !important;
        }
      `;
      document.head.appendChild(chatStyle);
    }
    app.use(NolebaseEnhancedReadabilitiesPlugin)
    app.use(NolebaseGitChangelogPlugin)
    app.component('GuideCards', GuideCards)
    app.component('BibleDisplay', BibleDisplay)
    app.component('ReadingTime', ReadingTime)
    app.component('PluginStats', PluginStats)
    app.component('MoFoxTeamCard', MoFoxTeamCard)
    app.component('ContributePluginGuide', ContributePluginGuide)
    app.component('BackToTop', BackToTop)
    app.component('BackgroundLogo', BackgroundLogo)
    app.use(NolebaseInlineLinkPreviewPlugin) 
  }
}
