<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const myGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:window-sharp"></iconify-icon>',
    name: 'Windows 部署指南',
    title: '为 Windows 用户准备的图形化界面部署教程...',
    link: './deployment_guide'
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
