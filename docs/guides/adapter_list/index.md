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
]
</script>

<GuideCards :guides="adapterCards" />
