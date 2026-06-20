# 快速入门

5 分钟创建你的第一个插件 UI 页面。

## 前提条件

- 已有可运行的 Neo-MoFox 插件项目
- 插件已正确配置 `manifest.json` 和 `plugin.py`
- 插件中已声明对 `neo-mofox-webui:service:plugin_ui` 的依赖

## 第一步：声明服务依赖

在 `manifest.json` 的 `dependencies.components` 中添加 WebUI 的 Plugin UI 服务签名：

```json
{
  "dependencies": {
    "plugins": ["neo-mofox-webui"],
    "components": ["neo-mofox-webui:service:plugin_ui"]
  }
}
```

## 第二步：编写 XML 页面

创建一个 XML 文件（如 `ui/main_page.xml`），编写页面内容：

```xml
<page>
  <definitions>
    <!-- 声明变量 -->
    <var name="greeting" default="'你好，世界！'" />
    <var name="count" default="0" />

    <!-- 声明 API 模板 -->
    <api id="ping" method="GET" url="/api/health" response-to="health_data" />
  </definitions>

  <!-- 页面内容 -->
  <card title="我的第一个插件页面">
    <sys-text>{greeting}</sys-text>

    <hbox>
      <sys-button on-click="set: count={count + 1}" variant="filled">
        点击计数: {count}
      </sys-button>
      <sys-button on-click="api: ping | notify: '请求已发送'" variant="outlined">
        测试请求
      </sys-button>
    </hbox>
  </card>
</page>
```

## 第三步：在插件中注册页面

在插件的 `on_plugin_loaded` 生命周期中注册 UI 页面：

```python
# plugin.py
from src.app.plugin_system.base import BasePlugin, register_plugin
from src.app.plugin_system.api.service_api import get_service


@register_plugin
class MyPlugin(BasePlugin):
    plugin_name = "my_plugin"
    plugin_description = "示例插件"
    plugin_version = "1.0.0"

    configs: list[type] = []
    dependent_components: list[str] = []

    def get_components(self) -> list[type]:
        return []

    async def on_plugin_loaded(self) -> None:
        """插件加载后注册 UI 页面。"""
        # 获取 Plugin UI 服务
        ui_service = await get_service("neo-mofox-webui:service:plugin_ui")
        if ui_service is None:
            return

        # 读取 XML 文件内容
        from pathlib import Path
        xml_path = Path(__file__).parent / "ui" / "main_page.xml"
        xml_content = xml_path.read_text(encoding="utf-8")

        # 注册页面
        await ui_service.register_ui_page(
            plugin_name="my_plugin",
            page_id="main",
            title="我的插件",
            mode="xml",
            icon="extension",
            description="我的第一个插件 UI 页面",
            order=100,
            xml=xml_content,
        )

    async def on_plugin_unloaded(self) -> None:
        """插件卸载时清理 UI 页面。"""
        ui_service = await get_service("neo-mofox-webui:service:plugin_ui")
        if ui_service is None:
            return
        await ui_service.unregister_plugin_pages("my_plugin")
```

## 第四步：启动并查看

1. 启动 Neo-MoFox 主程序
2. 打开 WebUI，在侧边栏中找到「我的插件」入口
3. 点击进入，你将看到刚才定义的页面

## 常用模式速查

### 表单 + API 提交

```xml
<page>
  <definitions>
    <var name="username" default="''" />
    <var name="email" default="''" />
    <api id="saveUser" method="POST" url="/api/users"
         body='{"name": "{username}", "email": "{email}"}' />
  </definitions>

  <card title="用户信息">
    <vbox>
      <sys-input label="用户名" bind:value="username" placeholder="请输入用户名" />
      <sys-input label="邮箱" bind:value="email" type="email" placeholder="请输入邮箱" />
      <sys-button on-click="api: saveUser | notify: '保存成功'" variant="filled">
        保存
      </sys-button>
    </vbox>
  </card>
</page>
```

### 条件显示

```xml
<page>
  <definitions>
    <var name="is_admin" default="false" />
    <var name="items" default="[]" />
    <api id="loadItems" method="GET" url="/api/items" response-to="items" auto-fetch="true" />
  </definitions>

  <card title="项目列表">
    <sys-table data="{items}" columns='[{"key":"name","label":"名称"},{"key":"status","label":"状态"}]' />
    <sys-button hidden="{!is_admin}" on-click="api: addItem" variant="filled">
      添加项目
    </sys-button>
  </card>
</page>
```

### 对话框确认

```xml
<page>
  <definitions>
    <api id="deleteItem" method="DELETE" url="/api/items/{selected_id}" />
  </definitions>

  <card title="危险操作">
    <sys-button on-click="confirm: '确定要删除吗？' | api: deleteItem | notify: '已删除', success"
                variant="filled">
      删除
    </sys-button>
  </card>
</page>
```

## 下一步

- [代码指南](./code-guide) — 深入了解 XML 语法、管道指令、表达式求值等
- [组件参考](./components) — 所有内置组件的完整属性和用法
