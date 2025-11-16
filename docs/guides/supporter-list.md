<script setup>
import { VPTeamMembers } from 'vitepress/theme'

// 美术支持者名单
const artSupporters = [
  {
    avatar: '/assets/avatars/HoshiKyu.jpg',
    name: 'HoshiKyu',
    // title: '为项目提供美术支持',
    links: []
  },
  {
    avatar: '/assets/avatars/不到人.jpg',
    name: '不到人',
    // title: '为项目提供美术支持',
    links: []
  },
  {
    avatar: '/assets/avatars/与.jpg',
    name: '与',
    // title: '为项目提供美术支持',
    links: []
  },
  {
    avatar: '/assets/avatars/叶尘之雨.jpg',
    name: '叶尘之雨',
    // title: '为项目提供美术支持',
    links: []
  },
  {
    avatar: '/assets/avatars/慕容昀泽.jpg',
    name: '慕容昀泽',
    // title: '为项目提供美术支持',
    links: []
  },
  {
    avatar: '/assets/avatars/明天好像没什么.jpg',
    name: '明天好像没什么',
    // title: '为项目提供美术支持',
    links: []
  }
]
</script>

# 致谢名单

美术支持贡献者名单

## 美术支持者

<MoFoxTeamCard :members="artSupporters" size="medium" />

---
