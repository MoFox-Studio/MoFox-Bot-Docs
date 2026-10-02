# 人设指南

人格配置 `[personality]` 是 Neo-MoFox 拟人化的核心，定义 Bot 的性格、身份和说话风格。它写在 `config/core.toml` 里，改法和生效规则见[核心配置要点](/docs/guides/core-config)。

先建立一个直觉：人设配置最终会被拼成一份「角色说明书」交给大语言模型（[LLM](/docs/guides/glossary#llm)，也就是驱动 Bot 的大脑）。你写得越具体，Bot 扮演得越像。

## 两种改法：文件 or WebUI

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用任意文本编辑器打开 `config/core.toml`，找到 `[personality]` 节，按下文的字段说明填写，保存后重启 Bot 生效。

</MethodTab>

<MethodTab value="webui">

1. 浏览器打开 WebUI（默认地址 `http://127.0.0.1:8000`），进入「配置」页面。
2. 找到「人格配置」分区，在表单里直接编辑各字段。
3. 保存后重启 Bot 生效。

![图片：WebUI 人格配置分区，可以看到核心人格、表达风格等字段](/guide/webui/config-personality.png)

</MethodTab>

</MethodTabs>

## 人格配置 `[personality]`
```toml

[personality]
nickname = "小狐狸"
alias_names = ["狐狸", "小狐", "Fox"]
personality_core = "友好、活泼、乐于助人。"
personality_side = "偶尔开玩笑，喜欢用比喻解释复杂概念。"
identity = "AI 助手"
background_story = "在数字世界中诞生...（LLM 不会主动复述此内容）"
reply_style = "自然口语化，简洁明了。"
```

**人格设定技巧**：

- `personality_core`：一句话概括核心性格，最重要。
- `personality_side`：补充性格细节。
- `identity`：身份、年龄、职业等具体信息。
- `background_story`：背景故事，仅作为背景知识注入，LLM 被指导不应主动复述。
- `reply_style`：说话方式的具体指导。

::: tip 写好一点的小窍门
「活泼可爱」这种词人人都能写，Bot 演出来也千人一面。换成可观察的行为——「聊到好吃的会突然认真起来」「被夸会先愣一下」——它才有辨识度；「不要做什么」往往比「要做什么」更管用，比如在 `reply_style` 里写「不要列 1234、不要每句都带感叹号」。
:::

### 安全准则
```toml

safety_guidelines = [
    "拒绝任何包含骚扰、冒犯、暴力、色情或危险内容的请求。",
    "在拒绝时，请使用符合你人设的、坚定的语气。",
]

negative_behaviors = [
    "不主动提供个人信息。",
    "不参与任何违法活动。",
    "避免使用过度的颜文字或表情符号。",
]
```

- `safety_guidelines`：最高行为准则，任何情况必须遵守。
- `negative_behaviors`：明确禁止的行为列表。

## 改完怎么试

1. 保存配置（或在 WebUI 人格配置页保存），**重启 Bot** 生效——配置只在启动时读取一次。
2. 私聊 Bot 测试，私聊干扰最少，最能看出人设效果：打个招呼、问个它「人设内」的问题、再故意聊个它可能接不住的话题，看它怎么圆。
3. 不满意就回去改对应字段：口吻不对改 `reply_style`，性格不对改 `personality_core`，反应不过来称呼就补 `alias_names`，改一轮测一轮。

::: tip 人设改了，记忆不会清空
修改人设只影响 Bot 之后「怎么说话」，已有的聊天记忆还在。如果发现它还带着旧口吻，多聊几轮让新人设「压过去」即可。
:::

![图片：私聊窗口中 Bot 按新人设回复的聊天记录](/guide/persona/persona-test-chat.png)
<!-- TODO-SCREENSHOT: QQ 私聊窗口截图，展示 Bot 按某个人设模板回复的效果，需遮挡用户个人信息 -->


相关页面：

- [核心配置要点](/docs/guides/core-config)：人设所在的配置文件怎么改、怎么生效
- [进阶模型配置](/docs/guides/advanced-model)：模型管智力，人设管性格
- [WebUI 使用](/docs/guides/webui)：不想碰文件？全程在网页里改
