<script setup>
import { VPTeamMembers } from 'vitepress/theme'

// 在这里定义一个数组，用来存放卡片的数据
const myGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:window-sharp"></iconify-icon>', // 卡片左侧的图标，可以是 Emoji 或者字符
    name: 'Windows 部署指南', // 卡片的标题
    title: '为 Windows 用户准备的图形化界面部署教程...', // 卡片的详细描述
    link: './deployment_guide' // 点击卡片后跳转的链接
  },
  {
    avatar: '<iconify-icon icon="mdi:linux"></iconify-icon>',
    name: 'Linux 部署指南',
    title: '为 Linux 用户准备的命令行部署教程...',
    link: './mmc_deploy_linux'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:android"></iconify-icon>',
    name: 'Android 部署指南',
    title: '为 Android 用户准备的部署教程...',
    link: './mmc_deploy_android'
  },
  {
    avatar: '<iconify-icon icon="mdi:docker"></iconify-icon>',
    name: 'Docker 部署指南',
    title: '为 Docker 用户准备的部署教程...',
    link: './mmc_deploy_docker'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:package-2"></iconify-icon>',
    name: 'Launcher 部署指南',
    title: '为 Launcher 用户准备的部署教程...',
    link: './launcher_deployment_guide'
  },
  {
    avatar: '<iconify-icon icon="mdi:account-group"></iconify-icon>',
    name: '社区部署方式',
    title: '社区贡献的自动化部署脚本和工具...',
    link: './community_way/'
  },
  // ... 你可以根据需要添加任意多个卡片对象
]

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/140055845?v=4',
    name: '一闪',
    title: '1.项目发起人之一<br/>2.核心开发者<br/>3.超级黑奴()',
    links: [
      { icon: 'github', link: 'https://github.com/minecraft1024a' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/189647097?v=4',
    name: '阿范',
    title: '1.项目发起人之一(因个人原因已淡坑)<br/>2.核心开发者<br/>3. 搞美术去了<br/>4.音游领域大神',
    links: [
      { icon: 'github', link: 'https://github.com/Furina-1013-create' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/68868379?v=4',
    name: '言柒',
    title: '1.项目发起人之一<br/>2.核心（打杂）开发者<br/>3.神秘插件适配大师',
    links: [
      { icon: 'github', link: 'https://github.com/tt-P607' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/214268555?v=4',
    name: 'ikun',
    title: '1.项目初期开发人之一<br/>2.核心（打杂）开发者喵<br/>3.神秘猫娘喵<br/>4.答疑高手喵',
    links: [
      { icon: 'github', link: 'https://github.com/ikun-11451' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/212194964?v=4',
    name: '雅诺狐',
    title: '1.项目发起人之一<br/>2.核心开发者<br/>3.技术萌新',
    links: [
      { icon: 'github', link: 'https://github.com/foxcyber907' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/221029311?v=4',
    name: '拾风',
    title: '1.项目重构负责人<br/>2.核心开发者<br/>3.插件化大师',
    links: [
      { icon: 'github', link: 'https://github.com/Windpicker-owo' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/Chiya-mt?v=4',
    name: 'Chiya-mt',
    title: '1.雅诺狐的小猫猫<br/>2.墨狐主程序开发',
    links: [
      { icon: 'github', link: 'https://github.com/Chiya-mt' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/fuilyha56-wq?v=4',
    name: 'Lycoris-flower',
    title: '1.webui后端开发<br/>2.学生',
    links: [
      { icon: 'github', link: 'https://github.com/fuilyha56-wq' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/LuisKlee?v=4',
    name: 'LuiKlee',
    title: '1.算法优化，哪里缺人写哪里（bushi）',
    links: [
      { icon: 'github', link: 'https://github.com/LuisKlee' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/sunbiz1024?v=4',
    name: 'sunbiz',
    title: '1.学生<br/>2.webui前端开发<br/>3.文档开发（只有一点）',
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
    title: '1. MoFox项目Q版角色美术设计<br/>2. 其它的暂时保密喵~！',
    links: [
      { icon: 'mihuashi', link: 'https://www.mihuashi.com/profiles/7564773?role=painter&utm_source=direct&utm_campaign=userpage&utm_medium=share&utm_content=ordinary' }
    ]
  }
]
</script>

<BibleDisplay />

# 部署指南

欢迎来到 Neo-MoFox 部署指南。在这里，我们为您提供了在不同操作系统上部署 Neo-MoFox 的详细步骤。请根据您的操作系统选择对应的指南开始您的冒险。

## 选择您的部署平台

<!-- 像这样调用组件，并把你的数据通过 :guides 属性传给它 -->
<GuideCards :guides="myGuides" />

## 团队成员

<details>
<summary>👇 戳一戳，看看开发者们不为人知的故事？</summary>

::: tip

### 项目源起

话说『MoFox-Core』自诞生以来，历经数载，功能日丰，用户日众，声名鹊起于 AI Bot 之界。然盛极必衰，此乃天道。

随着版本迭代，功能叠加，补丁摞补丁，屎山渐成——彼时之代码，已非凡人所能轻易驾驭。新人望之，如坠五里雾中，不知所措；老人视之，亦如履薄冰，战战兢兢，生怕一个不慎，牵一发而动全身，引发连环崩溃。注释？那是奢侈品。文档？那是传说。架构？那是……曾经有过的。

曾有勇士试图重构，然代码之深，逻辑之乱，犹如葛藤缠古木，剪不断，理还乱。数日鏖战，不仅旧 bug 未除，新 bug 层出不穷，最终壮志未酬，含恨回滚。

终于，在某个月黑风高的深夜，拾风盯着满屏报错，沉默良久，吐出一句话："这玩意儿……重写吧。"

此言一出，众人沉默，继而纷纷点头——不是认同，而是太累了，懒得反驳。

于是，众开发者痛定思痛，以『MoFox-Core』之经验为鉴，决意另起炉灶，从根基重塑，以更清晰的架构、更优雅的设计，打造全新一代 Bot——『Neo-MoFox』由此应运而生。

"Neo"，意为"新"，亦是"重生"。它承载着所有人对过去屎山的悔恨，以及对未来不再屎山的美好期许——尽管这个期许，在无数个需求涌来的深夜里，显得格外脆弱。

此乃项目源起，字字皆泪，句句皆史。特记于此，以飨同好，以戒后人：**写代码，请留注释。**

:::

::: tip
### 绝密档案 · 代号 MoFox

“再改一版，就一版。”一闪的眼圈，比代码的黑夜模式还要深邃。他的对面，阿范把一杯冰美式喝出了烈酒的决绝，“为了这破玩意儿，我连音游都戒了，你懂我的痛吗？”

角落里，言柒幽幽地叹了口气，默默地合并了第 108 次冲突，感觉自己像个给旷世怨侣劝架的居委会大妈。

他们本是三条永不相交的平行线，却因为一个共同的“爹”——“麦麦”，被命运的红线（或者说网线）紧紧捆绑。他们曾为了一个 API 的命名吵到天昏地暗，也曾因为一个 bug 的归属互相甩锅。

“要不……合并吧？”不知是谁，在那个代码比人命还长的深夜，提出了这个魔鬼般的建议。

空气瞬间凝固。合并？这意味着什么？意味着无尽的兼容性噩梦，意味着要把对方那“一坨”代码和自己这“一坨”代码揉成更大的一坨。

但，当他们看到用户群里那一声声“大佬牛逼”时，那该死的虚荣心，那该死的成就感，终究是战胜了理智。

据说，在最终合并的前夜，三方势力依旧在为“项目到底叫什么”而争执不休，此时，一个名为雅诺狐的神秘身影出现在会议室，他只说了一句话：“不如就叫 MoFox 吧，既有 Mofox 的 M，也有 Fox 的 Fox。”全场死寂，三位大佬竟无言以对。

于是，『MoFox-Core』诞生了。它的每一行代码，都可能是一个历史遗留问题；它的每一次更新，都伴随着开发者们“爱”的争吵。这，就是它的故事。
:::

</details>

我们是 MoFox Studio，一个由充满激情和创造力的开发者组成的团队。我们致力于探索 AI 的无限可能性，并将其融入实用、有趣的产品中。MoFox-Core 是我们精心打造的作品，希望能为您带来前所未有的智能体验。

### 核心贡献者

<!-- <VPTeamMembers size="small" :members="members" /> -->

<MoFoxTeamCard :members="members" size="medium" />
<br/>
<MoFoxTeamCard :members="org" size="large" />
<br/>
<MoFoxTeamCard :members="artists" size="large" />
