# 如何向 MoFox-Plugin-Repo 插件中心贡献插件

非常感谢您愿意为 MoFox-Bot 生态系统贡献您的时间和才华！本指南将引导您完成提交插件的全过程。

## 准备工作：插件仓库规范

在提交您的插件之前，请确保您的插件仓库满足以下**所有要求**：

1.  **代码仓库公开**：您的插件必须是一个公开的 Git 仓库（推荐使用 GitHub）。
2.  **`__init__.py` 元数据文件**：仓库的根目录下必须包含一个 `__init__.py` 文件，用于定义插件的元数据。
    -   **必需字段**：`name`, `description`, `author`, `license`, `repository_url`, `keywords`。
    -   请确保所有必填字段都已正确填写，这将直接影响您的插件在插件市场的展示和搜索。

    **元数据文件详解**：[链接](../plugins/metadata-guide.md)

> [!NOTE]
> 一个结构清晰、内容详尽的元数据文件，是用户发现和了解您插件的关键。我们强烈建议您也填写 `usage`, `version`, `categories` 等字段来提供更丰富的信息。

3.  **`LICENSE` 文件**：仓库根目录下必须包含一个`LICENSE`文件，其许可证类型应与`__init__.py`中`license`字段的值一致。
5.  **优秀的 `README.md`**：我们强烈建议您的`README.md`文件包含清晰的功能介绍、使用说明以及至少一张截图或GIF动图。

## 提交步骤

1.  **访问并 Fork 仓库**：首先，请通过浏览器访问 [`MoFox-Studio/MoFox-Plugin-Repo`](https://github.com/MoFox-Studio/MoFox-Plugin-Repo) 仓库地址。进入仓库主页后，点击页面右上角的 **"Fork"** 按钮，将其复刻到您自己的 GitHub 账户下。

2.  **Clone 您的 Fork**：将您复刻的仓库克隆到您的本地电脑。
    ```bash
    git clone https://github.com/YOUR-USERNAME/mofox-plugin-repo.git
    cd mofox-plugin-repo
    ```
    *(请将 `YOUR-USERNAME` 替换为您自己的 GitHub 用户名)*

3.  **创建新分支**：为您的提交创建一个清晰的新分支。
    ```bash
    git checkout -b add/your-plugin-name
    ```

4.  **添加您的插件信息**：打开`plugins.json`文件，在数组的**末尾**添加一个指向您插件的新对象。
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
    注意！！`plugin_details.json`为程序自动生成的文件，请**不要手动修改**。请确保您的插件信息格式正确，特别是逗号的使用。

5.  **提交并推送更改**：
    ```bash
    git add plugins.json
    git commit -m "feat: Add [Your Plugin Name] plugin"
    git push origin add/your-plugin-name
    ```

6.  **创建 Pull Request**：
    -   回到您在 GitHub 上的 Fork 仓库页面，点击 **"Compare & pull request"** 按钮。
    -   系统会自动使用模板填充 PR 描述，请**仔细阅读并填写模板中的所有内容**。
    -   确认无误后，点击 **"Create pull request"**。

提交后，我们的自动化系统会立即对您的 PR 进行检查。如果检查失败，请根据错误提示修改后再次提交。维护者审核通过后，您的插件就会正式加入 MoFox-MMC 插件大家庭！

