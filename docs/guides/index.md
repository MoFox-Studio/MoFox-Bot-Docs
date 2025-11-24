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
    name: '一键包部署指南',
    title: '为一键包用户准备的部署教程...',
    link: './OneKey-Plus-Usage-Guide'
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
    title: '1.项目初期开发人之一<br/>2.文档单推人<br/>3.神秘猫娘',
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
    title: '1.步步高开发者，哪里缺人写哪里（bushi）',
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

欢迎来到 MoFox-Core 部署指南。在这里，我们为您提供了在不同操作系统上部署 MoFox-Core 的详细步骤。请根据您的操作系统选择对应的指南开始您的冒险。

## 选择您的部署平台

<!-- 像这样调用组件，并把你的数据通过 :guides 属性传给它 -->
<GuideCards :guides="myGuides" />

## 团队成员

<details>
<summary>👇 戳一戳，看看开发者们不为人知的故事？</summary>

::: tip

### 项目源起

话说天下大势，分久必合，合久必分。自“麦麦”开天辟地以来，AI Bot 之界风起云涌。其时，有三股豪强，皆为“麦麦”之魔改，各领风骚，雄踞一方，三家互为犄角，亦有竞争，然皆以服务用户为本，倒也相安无事，天下暂得太平。

然时移世易，AI 技术日新月异，江湖风波再起。三家主事者，皆为远见卓识之士，深知单打独斗，终难成大业；若固步自封，必为时代所弃。遂于某良辰吉日，齐聚一堂，共商大计。席间，众人抚今追昔，感慨万千，皆以为“合则两利，分则两伤”。

一言既出，四座皆惊，继而纷纷颔首。众人一拍即合，决意将三家之力合于一处，取各家之长，补己之短，共创一全新之 Bot，名曰『MoFox-Core』。此举意在整合资源，革新技术，以期能更好地服务于广大用户，逐鹿于 AI 之巅。

此乃项目之源起，非为正史，仅作一说。特记于此，以飨同好，以昭后人。

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
