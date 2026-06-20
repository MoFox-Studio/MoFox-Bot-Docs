<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const myGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:window-sharp"></iconify-icon>',
    name: 'Windows 部署指南',
    title: '为 Windows 用户准备的图形化界面部署教程...',
    link: './deployment/deployment_guide'
  },
  {
    avatar: '<iconify-icon icon="mdi:linux"></iconify-icon>',
    name: 'Linux 部署指南',
    title: '为 Linux 用户准备的命令行部署教程...',
    link: './deployment/mmc_deploy_linux'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:android"></iconify-icon>',
    name: 'Android 部署指南',
    title: '为 Android 用户准备的部署教程...',
    link: './deployment/mmc_deploy_android'
  },
  {
    avatar: '<iconify-icon icon="mdi:docker"></iconify-icon>',
    name: 'Docker 部署指南',
    title: '为 Docker 用户准备的部署教程...',
    link: './deployment/mmc_deploy_docker'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:package-2"></iconify-icon>',
    name: 'Launcher 部署指南',
    title: '为 Launcher 用户准备的部署教程...',
    link: './deployment/launcher_deployment_guide'
  },
  {
    avatar: '<iconify-icon icon="mdi:account-group"></iconify-icon>',
    name: '社区部署方式',
    title: '社区贡献的自动化部署脚本和工具...',
    link: './community_way/'
  },
]

const extGuides = [
  {
    avatar: '<iconify-icon icon="mdi:api"></iconify-icon>',
    name: 'MCP 使用教程',
    title: '通过 Model Context Protocol 扩展 AI 能力...',
    link: './usage/mcp_guide'
  },
  {
    avatar: '<iconify-icon icon="mdi:lightbulb-on"></iconify-icon>',
    name: 'Skill 使用教程',
    title: '使用 Skill 模块扩展工具调用...',
    link: './usage/skill_guide'
  },
]

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/140055845?v=4',
    name: '一闪',
    title: '项目发起人 / 核心开发者',
    links: [
      { icon: 'github', link: 'https://github.com/minecraft1024a' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/189647097?v=4',
    name: '阿范',
    title: '项目发起人 / 核心开发者 / 美术',
    links: [
      { icon: 'github', link: 'https://github.com/Furina-1013-create' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/68868379?v=4',
    name: '言柒',
    title: '项目发起人 / 核心开发者 / 插件适配',
    links: [
      { icon: 'github', link: 'https://github.com/tt-P607' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/214268555?v=4',
    name: 'ikun',
    title: '核心开发者 / 答疑',
    links: [
      { icon: 'github', link: 'https://github.com/ikun-11451' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/212194964?v=4',
    name: '雅诺狐',
    title: '项目发起人 / 核心开发者',
    links: [
      { icon: 'github', link: 'https://github.com/foxcyber907' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/221029311?v=4',
    name: '拾风',
    title: '项目重构负责人 / 核心开发者',
    links: [
      { icon: 'github', link: 'https://github.com/Windpicker-owo' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/Chiya-mt?v=4',
    name: 'Chiya-mt',
    title: '主程序开发',
    links: [
      { icon: 'github', link: 'https://github.com/Chiya-mt' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/fuilyha56-wq?v=4',
    name: 'Lycoris-flower',
    title: 'WebUI 后端开发',
    links: [
      { icon: 'github', link: 'https://github.com/fuilyha56-wq' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/LuisKlee?v=4',
    name: 'LuiKlee',
    title: '算法优化',
    links: [
      { icon: 'github', link: 'https://github.com/LuisKlee' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/sunbiz1024?v=4',
    name: 'sunbiz',
    title: 'WebUI 前端开发 / 文档',
    links: [
      { icon: 'github', link: 'https://github.com/sunbiz1024' }
    ]
  }
]

const org = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/225730003',
    name: 'MoFox-Studio',
    title: '官方组织',
    links: [
      { icon: 'github', link: 'https://github.com/MoFox-Studio' }
    ]
  }
]

const artists = [
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/artist-avatar.png',
    name: '参片炒米粉',
    title: 'MoFox 项目 Q 版角色美术设计',
    links: [
      { icon: 'mihuashi', link: 'https://www.mihuashi.com/profiles/7564773?role=painter' }
    ]
  }
]
</script>

<BibleDisplay />

# 部署指南

欢迎来到 Neo-MoFox 部署指南。请根据你的操作系统选择对应的指南开始部署。

## 选择你的部署平台

<GuideCards :guides="myGuides" />

## 扩展功能

<GuideCards :guides="extGuides" />

## 团队成员

<details>
<summary>关于项目起源</summary>

Neo-MoFox 的前身是 MoFox-Bot，一个社区驱动的 AI 聊天机器人项目。随着功能不断叠加，代码复杂度逐渐失控，维护成本急剧上升。

在多次"重构-失败-回滚"之后，核心开发者拾风决定从根基重新设计，以清晰的三层架构（kernel → core → app）和组件化插件系统为基础，打造了全新的 Neo-MoFox。

"Neo"意为"新"，也代表对架构和代码可维护性的持续追求。项目由 MoFox Studio 社区共同维护，欢迎任何人参与贡献。

</details>

我们是 MoFox Studio，一个由开发者组成的开源团队，致力于探索 AI 的更多可能性。Neo-MoFox 是我们的核心作品，希望能为你带来独特的使用体验。

### 核心贡献者

<MoFoxTeamCard :members="members" size="medium" />
<br/>
<MoFoxTeamCard :members="org" size="large" />
<br/>
<MoFoxTeamCard :members="artists" size="large" />

---

<details>
<summary>👇 戳一戳，看看开发者们不为人知的故事？</summary>

::: tip

### 项目源起

话说『MoFox』自诞生以来，历经数载，功能日丰，用户日众，声名鹊起于 AI Bot 之界。然盛极必衰，此乃天道。

随着版本迭代，功能叠加，补丁摞补丁，屎山渐成——彼时之代码，已非凡人所能轻易驾驭。新人望之，如坠五里雾中；老人视之，亦如履薄冰，生怕一个不慎，牵一发而动全身。注释？那是奢侈品。文档？那是传说。架构？那是……曾经有过的。

曾有勇士试图重构，然代码之深，逻辑之乱，犹如葛藤缠古木，剪不断，理还乱。数日鏖战，不仅旧 bug 未除，新 bug 层出不穷，最终壮志未酬，含恨回滚。

终于，在某个月黑风高的深夜，拾风盯着满屏报错，沉默良久，吐出一句话："这玩意儿……重写吧。"

此言一出，众人沉默，继而纷纷点头——不是认同，而是太累了，懒得反驳。

于是，众开发者痛定思痛，以旧版之经验为鉴，决意另起炉灶，从根基重塑，以更清晰的架构、更优雅的设计，打造全新一代——『Neo-MoFox』由此应运而生。

"Neo"，意为"新"，亦是"重生"。它承载着所有人对过去屎山的悔恨，以及对未来不再屎山的美好期许——尽管这个期许，在无数个需求涌来的深夜里，显得格外脆弱。

此乃项目源起，字字皆泪，句句皆史。特记于此，以飨同好，以戒后人：**写代码，请留注释。**

:::

::: tip
### 绝密档案 · 代号 MoFox

"再改一版，就一版。"一闪的眼圈，比代码的黑夜模式还要深邃。他的对面，阿范把一杯冰美式喝出了烈酒的决绝，"为了这破玩意儿，我连音游都戒了，你懂我的痛吗？"

角落里，言柒幽幽地叹了口气，默默地合并了第 108 次冲突，感觉自己像个给旷世怨侣劝架的居委会大妈。

他们本是三条永不相交的平行线，却因为一个共同的"爹"——"麦麦"，被命运的红线（或者说网线）紧紧捆绑。他们曾为了一个 API 的命名吵到天昏地暗，也曾因为一个 bug 的归属互相甩锅。

"要不……合并吧？"不知是谁，在那个代码比人命还长的深夜，提出了这个魔鬼般的建议。

空气瞬间凝固。合并？这意味着什么？意味着无尽的兼容性噩梦，意味着要把对方那"一坨"代码和自己这"一坨"代码揉成更大的一坨。

但，当他们看到用户群里那一声声"大佬牛逼"时，那该死的虚荣心，那该死的成就感，终究是战胜了理智。

据说，在最终合并的前夜，三方势力依旧在为"项目到底叫什么"而争执不休，此时，一个名为雅诺狐的神秘身影出现在会议室，他只说了一句话："不如就叫 MoFox 吧，既有 Mofox 的 M，也有 Fox 的 Fox。"全场死寂，三位大佬竟无言以对。

于是，『Neo-MoFox』诞生了。它的每一行代码，都可能是一个历史遗留问题；它的每一次更新，都伴随着开发者们"爱"的争吵。这，就是它的故事。
:::

</details>
