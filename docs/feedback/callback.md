---
title: GitHub 登录
description: 完成 GitHub 授权并返回文档页面。
layout: page
sidebar: false
aside: false
navbar: false
footer: false
feedback: false
gitChangelog: false
head:
  - - meta
    - name: robots
      content: noindex, nofollow
  - - meta
    - name: referrer
      content: no-referrer
---

<ClientOnly>
  <GitHubCallback />
  <template #fallback>
    <p style="margin: 64px auto; padding: 24px; text-align: center;">正在加载 GitHub 登录页面，请稍候…</p>
  </template>
</ClientOnly>
