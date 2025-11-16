# 🚀 HTTP 组件开发指南

## 📖 什么是 HTTP 组件？

HTTP 组件是插件中用于向外部暴露 API 端点（Endpoint）的强大功能。通过它，你可以让你的插件拥有一个独立的、可通过 HTTP 请求访问的微型服务器。

这开启了无数种可能性：

-   **创建外部控制面板**：开发一个网页来控制你的插件行为，例如动态修改配置、触发特定动作。
-   **与其他应用集成**：允许其他应用程序（如 Home Assistant, IFTTT）通过 Webhook 来与你的机器人互动。
-   **提供数据接口**：将插件内部的数据（例如统计信息、状态）以 API 的形式提供给外部服务使用。
-   **接收外部事件**：监听来自第三方服务（如 GitHub, GitLab）的 Webhook 事件，并在机器人中做出响应。

简而言之，HTTP 组件是连接你的插件与广阔互联网世界的桥梁。

## 🎯 HTTP 组件的核心：`BaseRouterComponent`

所有 HTTP 组件都必须继承自 `BaseRouterComponent` 基类。这个基类基于强大的 [FastAPI](https://fastapi.tiangolo.com/) 框架，这意味着你可以直接使用 FastAPI 的所有特性，例如自动生成的交互式 API 文档 (Swagger UI)、依赖注入、Pydantic 数据模型验证等。

### 核心属性

-   `component_name: str`: **(必需)** 组件的唯一标识符。命名应清晰、简洁，并能反映其功能。这将作为路由分组的名称。
-   `component_description: str`: **(推荐)** 对组件功能的简要描述。

### 核心方法

#### `def register_endpoints(self) -> None`

这是你定义所有 HTTP 端点的核心场所，**必须实现**。你需要在这个方法内部使用 `@self.router` 装饰器来注册你的路由函数。

## 🛠️ 开发步骤

现在，让我们通过一个具体的例子，一步步创建一个功能丰富的 HTTP 组件。

### 步骤一：创建基础 HTTP 组件类

首先，在你的插件代码中（例如 `plugin.py`），创建一个继承自 `BaseRouterComponent` 的新类。这是你的 HTTP 组件的骨架。

```python
# /plugin_repo/your_plugin_name/plugin.py

from src.plugin_system import BasePlugin, BaseRouterComponent, register_plugin

# ... 其他组件代码 ...

class MyAwesomeRouter(BaseRouterComponent):
    """
    一个演示如何创建HTTP端点的组件。
    """
    # 1. 设置组件元数据
    component_name = "awesome_api"
    component_description = "提供一组很棒的API接口"

    # 2. 实现 register_endpoints 方法
    def register_endpoints(self) -> None:
        # 我们将在这里定义所有API端点
        pass

# ... 你的主插件类 ...
@register_plugin
class MyAwesomePlugin(BasePlugin):
    # ...
    def get_plugin_components(self):
        # 稍后我们会在这里注册 MyAwesomeRouter
        components = []
        # ...
        return components

```

这个框架定义了组件的基本信息，并准备好了 `register_endpoints` 方法以供后续填充。
### 步骤二：定义 GET 路由与处理参数

GET 请求是最常见的 HTTP 请求类型，通常用于获取数据。让我们在 `register_endpoints` 方法中添加几个示例。

#### 1. 创建一个简单的 GET 端点

这是一个最基础的 GET 端点，它不接收任何参数，只是简单地返回一个 JSON 响应。

```python
# 在 MyAwesomeRouter 类的 register_endpoints 方法内
def register_endpoints(self) -> None:
    @self.router.get("/hello", summary="返回简单的问候")
    def say_hello():
        return {"message": "Hello from My Awesome API!"}
```

#### 2. 使用路径参数

路径参数是 URL 的一部分，用于标识特定资源。例如，在 `/users/{user_id}` 中，`user_id` 就是一个路径参数。

```python
# 在 MyAwesomeRouter 类的 register_endpoints 方法内
def register_endpoints(self) -> None:
    # ... 上面的代码 ...

    @self.router.get("/users/{user_id}", summary="根据ID获取用户信息")
    def get_user(user_id: int):
        # 在实际应用中，你会在这里查询数据库
        return {"user_id": user_id, "name": f"User_{user_id}", "status": "active"}
```

-   FastAPI 会自动将 URL 中的 `{user_id}` 映射到函数的 `user_id` 参数。
-   通过类型提示 `user_id: int`，FastAPI 会自动进行数据类型验证和转换。如果传入的不是整数，将返回一个清晰的错误。

#### 3. 使用查询参数

查询参数附加在 URL 的末尾，通常用于过滤或排序。例如，在 `/items?skip=0&limit=10` 中，`skip` 和 `limit` 就是查询参数。

```python
from typing import Optional

# 在 MyAwesomeRouter 类的 register_endpoints 方法内
def register_endpoints(self) -> None:
    # ... 上面的代码 ...

    @self.router.get("/items", summary="获取项目列表并支持分页")
    def get_items(skip: int = 0, limit: int = 10, q: Optional[str] = None):
        response = {"skip": skip, "limit": limit, "items": [f"Item_{i}" for i in range(skip, skip + limit)]}
        if q:
            response["query"] = q
            # 在实际应用中，你会用 q 来过滤结果
            response["items"] = [item for item in response["items"] if q in item]
        return response
```

-   FastAPI 会自动从 URL 的查询字符串中提取 `skip`, `limit` 和 `q`。
-   你可以为参数提供默认值，如 `skip: int = 0`。
-   使用 `Optional[str] = None` 来定义
一个可选的查询参数。
### 步骤三：定义 POST 路由与处理请求体

POST 请求通常用于创建新资源。与 GET 不同，POST 请求的数据通常包含在请求体（Request Body）中，而不是 URL 里。借助 Pydantic，FastAPI 处理请求体验证变得异常简单。

首先，你需要定义一个数据模型来描述你期望接收的数据结构。

```python
# 在文件顶部导入 Pydantic 的 BaseModel
from pydantic import BaseModel
from typing import Optional

# ...

# 定义一个数据模型
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    is_offer: Optional[bool] = None

# ...

# 在 MyAwesomeRouter 类的 register_endpoints 方法内
def register_endpoints(self) -> None:
    # ... 上面的 GET 路由代码 ...

    @self.router.post("/items", summary="创建一个新项目")
    def create_item(item: Item):
        # FastAPI 会自动将请求体（JSON）解析、验证，并填充到 item 参数中
        # 如果数据格式不正确，会自动返回 422 Unprocessable Entity 错误
        print(f"成功创建项目: {item.name}, 价格: {item.price}")
        
        # 将 Pydantic 模型转换为字典以便返回
        return {"status": "success", "item_added": item.dict()}
```

-   **创建 `Item` 模型**：我们使用 `pydantic.BaseModel` 定义了一个 `Item` 类，它清晰地描述了一个项目应有的字段及其类型。
-   **类型提示 `item: Item`**：在 `create_item` 函数中，我们用这个模型作为类型提示。
-   **自动处理**：当请求到达时，FastAPI 会：
    1.  读取请求体。
    2.  将 JSON 数据转换为 `Item` 类的实例。
    3.  验证数据：`name` 是必需的字符串，`price` 是必需的浮点数，其他是可选的。
    4.  如果验证失败，它会自动生成并返回一个包含详细错误信息的 JSON 响应。
    5.  如果验证成功，它会将创建好的 `item` 对象传递给你的函数。

这种基于 Pydantic 的声明式数据验证，极大地简化了代码，使其更健壮、更易于维护。
### 步骤四：添加 API Key 权限验证

为了保护你的 API 不被滥用，框架内置了一套简单而强大的 API Key 验证机制。你只需一个简单的步骤即可为你的端点启用验证。

#### 1. 导入 `VerifiedDep`

`VerifiedDep` 是一个预先配置好的 FastAPI 依赖项，它会自动处理 API Key 的提取和验证逻辑。

```python
# 在你的 plugin.py 文件顶部
from src.common.security import VerifiedDep

# ...
```

#### 2. 将依赖项应用到你的端点

现在，只需将 `VerifiedDep` 添加到你的路由函数的参数中。你可以为一个不需要使用的参数（通常命名为 `_`）指定这个依赖。

```python
# 在 MyAwesomeRouter 类的 register_endpoints 方法内
def register_endpoints(self) -> None:
    # ...

    @self.router.get("/secure-data", summary="获取需要授权的数据")
    def get_secure_data(_=VerifiedDep):
        # 这个端点现在受 API Key 保护
        # 只有在请求头中提供了有效的 X-API-Key，才能访问到这里
        return {"message": "这是一条受保护的敏感信息。"}

    @self.router.post("/items", summary="创建一个新项目")
    def create_item(item: Item, _=VerifiedDep): # 同样可以应用到 POST 请求
        # 这个端点现在也受保护了
        return {"status": "success", "item_added": item.dict()}
```

**工作原理：**

1.  当一个请求到达受保护的端点时，FastAPI 会先执行 `VerifiedDep`。
2.  `VerifiedDep` 会检查请求头中是否包含 `X-API-Key` 字段。
3.  它会用这个 Key 与你在机器人主配置文件 `config/bot_config.toml` 中 `[plugin_http_system.plugin_api_valid_keys]` 列表里的有效 Key进行比对。
4.  如果 Key 有效，请求会继续执行你的路由函数。
5.  如果 Key 无效或缺失，`VerifiedDep` 会立即中断请求，并自动返回一个 `403 Forbidden` 或 `401 Unauthorized` 的错误响应。

通过这种方式，你无需在每个函数里都编写重复的验证代码，极大地提升了开发效率和安全性。
### 步骤五：在插件中注册 HTTP 组件

组件开发完成后，最后一步是告诉插件主类（`BasePlugin` 的子类）加载这个组件。

这需要在你的主插件类的 `get_plugin_components` 方法中完成。

```python
# /plugin_repo/your_plugin_name/plugin.py

# ... 导入 MyAwesomeRouter 类 ...
from .router import MyAwesomeRouter # 假设你把Router放到了单独的文件

@register_plugin
class MyAwesomePlugin(BasePlugin):
    plugin_name = "awesome_plugin"
    # ... 其他插件配置 ...

    def get_plugin_components(self) -> list[tuple]:
        """注册插件的所有功能组件。"""
        components = []

        # ... 注册其他组件，如 Command, Action 等 ...

        # 注册我们的 HTTP 组件
        components.append((MyAwesomeRouter.get_router_info(), MyAwesomeRouter))

        return components

```

**发生了什么？**

1.  `MyAwesomeRouter.get_router_info()`: 这个类方法会读取你在 `MyAwesomeRouter` 中定义的 `component_name`, `component_description` 等元数据，生成一个标准的 `RouterInfo` 对象。
2.  `components.append(...)`: 你将包含组件信息的元组 `(RouterInfo, ClassType)` 添加到列表中。
3.  **插件加载**: 当机器人启动并加载此插件时，它会调用 `get_plugin_components` 方法，识别出 `MyAwesomeRouter` 是一个路由组件，然后自动将其下的所有端点（`/hello`, `/users/{user_id}` 等）挂载到主 API 服务器上。

至此，你的 API 已经准备就绪，随时可以接收外部请求了！
## ✅ 配置与测试

开发完成后，你需要进行一些简单配置才能正式访问你的 API。

### 步骤六：配置、访问和测试 HTTP 端点

#### 1. 配置 API Key

如果你在端点中使用了 `VerifiedDep` 进行权限验证，你需要先在主配置文件中设置有效的 API Key。

1.  打开 `config/bot_config.toml` 文件。
2.  找到 `[plugin_http_system]` 部分。
3.  在 `plugin_api_valid_keys` 数组中，添加一个或多个你自己的安全密钥（字符串）。

```toml
# config/bot_config.toml

[plugin_http_system]
# ... 其他配置 ...
# 在这里添加你的密钥
plugin_api_valid_keys = ["your-super-secret-key-1", "another-secure-key-2"]
```

#### 2. 访问你的 API

机器人启动后，HTTP 服务器也会同时运行。你可以通过以下 URL 格式访问你的插件 API：

`http://{host}:{port}/plugin-api/{plugin_name}/{component_name}{endpoint_path}`

-   `{host}` 和 `{port}`: 你在 `.env` 中配置的服务器主机`HOST`和端口`PORT`，默认为 `127.0.0.1` 和 `8000`。
-   `{plugin_name}`: 你的插件名称（`BasePlugin` 子类中的 `plugin_name`）。
-   `{component_name}`: 你的路由组件名称（`BaseRouterComponent` 子类中的 `component_name`）。
-   `{endpoint_path}`: 你在 `@self.router` 装饰器中定义的路径。

**示例：**

假设你的插件名为 `awesome_plugin`，组件名为 `awesome_api`，那么访问你在教程中创建的 `/secure-data` 端点的完整 URL 将是：

`http://127.0.0.1:8000/plugin-api/awesome_plugin/awesome_api/secure-data`

#### 3. 使用工具进行测试

你可以使用任何 HTTP 客户端工具来测试你的 API，例如 [cURL](https://curl.se/)、[Postman](https://www.postman.com/) 或 [Insomnia](https://insomnia.rest/)。

**使用 cURL 测试受保护的 GET 端点：**

```bash
curl -X GET "http://127.0.0.1:8000/plugin-api/awesome_plugin/awesome_api/secure-data" \
     -H "X-API-Key: your-super-secret-key-1"
```

**使用 cURL 测试受保护的 POST 端点：**

```bash
curl -X POST "http://127.0.0.1:8000/plugin-api/awesome_plugin/awesome_api/items" \
     -H "X-API-Key: your-super-secret-key-1" \
     -H "Content-Type: application/json" \
     -d '{
           "name": "My New Item",
           "price": 19.99,
           "description": "This is a fantastic item."
         }'
```

#### 4. 探索自动生成的 API 文档

最方便的测试方式之一是使用 FastAPI 自动生成的交互式文档 (Swagger UI)。

访问 `http://{host}:{port}/docs`，你将看到一个完整的 API 文档页面。在这里，你可以：

-   查看所有已加载插件的所有 HTTP 端点。
-   了解每个端点的路径、参数、请求体和响应模型。
-   直接在浏览器中进行交互式测试，输入参数并发送真实请求！

这对于开发和调试过程非常有帮助。
---

## 🎉 总结

恭喜你！通过本篇指南，你已经掌握了开发、保护和注册插件 HTTP 组件的全部核心知识。

回顾一下，我们学习了：

-   **基础**: 继承 `BaseRouterComponent` 来创建 HTTP 组件。
-   **路由**: 在 `register_endpoints` 中使用 `@self.router` 装饰器定义 GET 和 POST 端点。
-   **参数处理**: 利用 FastAPI 的类型提示自动处理路径参数、查询参数和请求体。
-   **安全**: 通过 `VerifiedDep` 依赖项轻松为端点添加 API Key 验证。
-   **注册**: 在插件主类的 `get_plugin_components` 方法中加载你的路由组件。
-   **测试**: 如何配置 Key、构造访问 URL，并利用 cURL 和自动生成的 API 文档进行测试。

现在，你已经拥有了将你的插件与外部世界连接起来的强大能力。去创造更多有趣和实用的集成吧！