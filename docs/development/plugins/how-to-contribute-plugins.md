# 如何向 MoFox 插件中心贡献插件

非常感谢您愿意为 MoFox 生态系统贡献您的时间和才华！本指南将引导您完成提交插件的全过程。

## 准备工作：你的插件仓库需要满足这些规范

在提交您的插件之前，请确保您的插件仓库满足以下**所有要求**：

1.  **代码仓库公开**：您的插件必须是一个公开的 Git 仓库（我们推荐使用 GitHub）。
2.  **`__init__.py` 元数据文件**：仓库的根目录下必须包含一个 `__init__.py` 文件，用于定义插件的元数据。
    -   **必需字段**：`name`, `description`, `author`, `license`, `repository_url`, `keywords`。
    -   请确保所有必填字段都已正确填写，这将直接影响您的插件在插件市场的展示和搜索。
    -   **元数据文件详解**：[链接](../plugins/metadata-guide.md)
3.  **`LICENSE` 文件**：仓库根目录下必须包含一个 `LICENSE` 文件，其许可证类型应与 `__init__.py` 中 `license` 字段的值一致。
4.  **优秀的 `README.md`**：我们强烈建议您的 `README.md` 文件包含清晰的功能介绍、使用说明以及至少一张截图或 GIF 动图，这能帮助用户更好地了解您的作品。

> [!TIP]
> 一个结构清晰、内容详尽的元数据文件，是用户发现和了解您插件的关键。我们强烈建议您也填写 `usage`, `version`, `categories` 等字段来提供更丰富的信息。


## 提交步骤：选择适合你的方式

我们提供两种方式来提交您的插件，请根据您的熟悉程度选择其一即可。

### 方式一：通过 GitHub 网站 (推荐新手)

这种方法无需在您的电脑上安装任何工具，全程在网页上操作即可，非常简单。

1.  **Fork 插件中心仓库**
    -   首先，请通过浏览器访问 [`MoFox-Studio/MoFox-Plugin-Repo`](https://github.com/MoFox-Studio/MoFox-Plugin-Repo) 仓库地址。
    -   进入仓库主页后，点击页面右上角的 **"Fork"** 按钮，将其复刻到您自己的 GitHub 账户下。

2.  **在线编辑 `plugins.json` 文件**
    -   在您 Fork 好的仓库页面中，找到并点击 `plugins.json` 这个文件。
    -   进入文件页面后，点击右上角的 **铅笔图标 ✏️** 进入编辑模式。
    -   在文件的 JSON 数组的**末尾**，添加一个指向您插件的新对象。请注意，要先在上一行的 `}` 后面加上一个英文逗号 `,`。

    ```json
    // plugins.json
    [
      // ... 其他已有的插件
      {
        "id": "your-github-username.your-plugin-repo-name",
        "repositoryUrl": "https://github.com/YOUR-USERNAME/YOUR-PLUGIN-REPO"
      }
    ]
    ```
    *(请将 `your-github-username` 和 `your-plugin-repo-name` 替换为您自己的信息)*

    > [!WARNING]
    > `plugin_details.json` 是程序自动生成的文件，请**不要手动修改**它。
    
> [!TIP]
> 嫌手动修改 JSON 容易出错？试试我们为您准备的**插件贡献助手**吧！只需填写您的用户名和仓库名，即可一键生成并复制完整的 `plugins.json` 内容。

<ContributePluginGuide />

3.  **提交您的更改**
    -   编辑完成后，滚动到页面下方。
    -   在标题框（Commit changes）中填写一个清晰的提交信息，例如 `feat: Add [你的插件名] plugin`。
    -   确保选中 **"Create a new branch for this commit and start a pull request."** 选项。
    -   最后，点击绿色的 **"Propose changes"** 按钮。

4.  **创建 Pull Request (PR)**
    -   点击 "Propose changes" 后，页面会自动跳转到创建 Pull Request 的界面。
    -   系统会自动使用模板填充 PR 描述，请**仔细阅读并填写模板中的所有内容**。
    -   确认无误后，点击 **"Create pull request"**。

### 方式二：通过 Git 命令行 (适合有经验的开发者)

1.  **Fork 并 Clone 仓库**
    ```bash
    # 访问 https://github.com/MoFox-Studio/MoFox-Plugin-Repo 并 Fork
    git clone https://github.com/YOUR-USERNAME/mofox-plugin-repo.git
    cd mofox-plugin-repo
    ```
    *(请将 `YOUR-USERNAME` 替换为您自己的 GitHub 用户名)*

2.  **创建新分支**
    ```bash
    git checkout -b add/your-plugin-name
    ```

3.  **添加插件信息**
    -   打开 `plugins.json` 文件，在数组的**末尾**添加您的插件信息。
    ```json
    // plugins.json
    [
      // ... 其他已有的插件
      {
        "id": "your-github-username.your-plugin-repo-name",
        "repositoryUrl": "https://github.com/YOUR-USERNAME/YOUR-PLUGIN-REPO"
      }
    ]
    ```
    *(请将 `your-github-username` 和 `your-plugin-repo-name` 替换为您自己的信息)*

> [!TIP]
> 嫌手动修改 JSON 容易出错？试试我们为您准备的**插件贡献助手**吧！只需填写您的用户名和仓库名，即可一键生成并复制完整的 `plugins.json` 内容。

<ContributePluginGuide />

4.  **提交并推送更改**
    ```bash
    git add plugins.json
    git commit -m "feat: Add [Your Plugin Name] plugin"
    git push origin add/your-plugin-name
    ```

5.  **创建 Pull Request**
    -   回到您在 GitHub 上的 Fork 仓库页面，点击 **"Compare & pull request"** 按钮。
    -   仔细阅读并填写 PR 模板中的所有内容后，提交即可。


## 提交之后

提交后，我们的自动化系统会立即对您的 PR 进行检查。如果检查失败，请根据错误提示修改后再次提交。维护者审核通过后，您的插件就会正式加入 MoFox 插件大家庭！
