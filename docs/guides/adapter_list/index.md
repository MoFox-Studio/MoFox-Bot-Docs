# 适配器列表

适配器负责连接 Neo-MoFox 与外部平台，让机器人能够收发消息。

<script setup>
const adapterCards = [
  {
    avatar: '<span class="iconify" data-icon="clarity:plugin-solid"></span>',
    name: 'OneBot 适配器',
    title: '通过 OneBot 协议连接 QQ 平台（推荐）...',
    link: './onebot_v11_config'
  },
  {
    avatar: '<span class="iconify" data-icon="mdi:robot"></span>',
    name: 'QQ Bot 适配器（社区）',
    title: '直连 QQ 官方机器人（小龙虾 Bot），社区插件...',
    link: './qqbot_adapter_config'
  },
]
</script>

<GuideCards :guides="adapterCards" />
