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

      // Dify Chatbot Configuration
      window.difyChatbotConfig = {
        token: 'Y0HDud0VUAFXopti',
        baseUrl: 'http://m.43land.fun:8088',
      }

      // Load Dify Script
      // Check if script already exists to avoid duplicates
      if (!document.getElementById('Y0HDud0VUAFXopti')) {
        const difyScript = document.createElement('script');
        difyScript.src = 'http://m.43land.fun:8088/embed.min.js';
        difyScript.id = 'Y0HDud0VUAFXopti';
        difyScript.defer = true;
        document.body.appendChild(difyScript);
      }

      // Dify Styles
      const difyStyle = document.createElement('style');
      difyStyle.textContent = `
        #dify-chatbot-bubble-button {
          background-color: #1C64F2 !important;
          position: fixed !important;
          bottom: 20px !important;
          left: 20px !important;
          top: auto !important;
          right: auto !important;
          z-index: 2147483647 !important; /* Max Z-Index */
          transform: none !important; /* Prevent parent transform issues */
        }
      `;
      document.head.appendChild(difyStyle);

      // Force style application via JS interval (in case of dynamic overrides)
      // This is a robust fallback if CSS is being overridden by the external script
      if (!import.meta.env.SSR) {
        const checkInterval = setInterval(() => {
          const button = document.getElementById('dify-chatbot-bubble-button');
          const windowEl = document.getElementById('dify-chatbot-bubble-window');

          if (button) {
            // Move to body to avoid transform/filter creating a new containing block
            if (button.parentElement !== document.body) {
              document.body.appendChild(button);
            }
            button.style.setProperty('position', 'fixed', 'important');
            button.style.setProperty('bottom', '20px', 'important');
            button.style.setProperty('left', '20px', 'important');
            button.style.setProperty('top', 'auto', 'important');
            button.style.setProperty('right', 'auto', 'important');
            button.style.setProperty('z-index', '2147483647', 'important');
            button.style.setProperty('transform', 'none', 'important');
          }

          if (windowEl) {
             if (windowEl.parentElement !== document.body) {
                document.body.appendChild(windowEl);
             }
             windowEl.style.setProperty('position', 'fixed', 'important');
             windowEl.style.setProperty('z-index', '2147483647', 'important');
             // Adjust window position to match button (bottom-left)
             windowEl.style.setProperty('bottom', '80px', 'important');
             windowEl.style.setProperty('left', '20px', 'important');
             windowEl.style.setProperty('right', 'auto', 'important');
             windowEl.style.setProperty('top', 'auto', 'important');
          }
        }, 500);
      }
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
