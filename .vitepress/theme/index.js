import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Giscus from './Giscus.vue'
import GuideCards from './GuideCards.vue'
import BibleDisplay from './BibleDisplay.vue'
import MoFoxTeamCard from './MoFoxTeamCard.vue'
import { h } from 'vue'
import ReadingTime from './ReadingTime.vue'
import BackToTop from './BackToTop.vue'
import CollapsibleSidebar from './CollapsibleSidebar.vue'
import ReadingProgress from './ReadingProgress.vue'
import CodeCopyEnhancer from './CodeCopyEnhancer.vue'
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
      'layout-top': () => [h(ReadingProgress), h(CodeCopyEnhancer)],
      'layout-bottom': () => [h(BackToTop), h(CollapsibleSidebar)],
    })
  },
  enhanceApp({ app }) {
    app.use(NolebaseEnhancedReadabilitiesPlugin)
    app.use(NolebaseGitChangelogPlugin)
    app.component('GuideCards', GuideCards)
    app.component('BibleDisplay', BibleDisplay)
    app.component('ReadingTime', ReadingTime)
    app.component('MoFoxTeamCard', MoFoxTeamCard)
    app.component('BackToTop', BackToTop)
    app.component('CollapsibleSidebar', CollapsibleSidebar)
    app.use(NolebaseInlineLinkPreviewPlugin) 
  }
}
