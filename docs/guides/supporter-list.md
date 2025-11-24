<script setup>
import { VPTeamMembers } from 'vitepress/theme'

// 美术支持者名单
const artSupporters = [
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/avatars/HoshiKyu.jpg',
    name: 'HoshiKyu',
    title: '  ',
    links: []
  },
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/avatars/不到人.jpg',
    name: '不到人',
    title: '  ',
    links: []
  },
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/avatars/与.jpg',
    name: '与',
    title: '  ',
    links: []
  },
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/avatars/叶尘之雨.jpg',
    name: '叶尘之雨',
    title: '  ',
    links: []
  },
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/avatars/慕容昀泽.jpg',
    name: '慕容昀泽',
    title: '  ',
    links: []
  },
  {
    avatar: 'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Bot-Docs/master/public/avatars/明天好像没什么.jpg',
    name: '明天好像没什么',
    title: '  ',
    links: []
  }
]
</script>

# 致谢名单

感谢以下伙伴为 MoFox-Core 项目提供的美术支持！

## 美术支持者

<MoFoxTeamCard :members="artSupporters" size="medium" />

---