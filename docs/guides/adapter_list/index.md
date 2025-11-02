# 适配器列表

欢迎来到适配器中心，这里是连接 MoFox_Bot 核心与广阔外部世界的桥梁。每一个“适配器”都像一位身怀绝技的翻译官，它们的存在，让机器人能够听懂并回应来自不同平台或协议的“语言”，从而实现真正的跨平台交流。无论是哪种协议，适配器都能为其搭建一条稳定、高效的沟通渠道。

<script setup>
const adapterCards = [
  {
    avatar: '<span class="iconify" data-icon="clarity:plugin-solid"></span>',
    name: '内置 Napcat 适配器',
    title: '官方推荐，与核心无缝集成，开箱即用的高效连接方案...',
    link: './onebot_v11_config'
  },
  {
    avatar: '<span class="iconify" data-icon="lucide:satellite"></span>',
    name: 'OneBot v11/Napcat - 外置',
    title: '作为独立进程运行，提供更强的灵活性和稳定性...',
    link: './napcat_adapter' // 这是一个占位符链接
  },
]
</script>

<GuideCards :guides="adapterCards" />