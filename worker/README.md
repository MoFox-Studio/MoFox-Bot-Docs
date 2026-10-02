# GitHub 登录换码 Worker

这个 Worker 只负责 `POST /token`：接收 `{ "code": "授权码" }`，向 GitHub 换取访问令牌，成功时仅返回 `{ "access_token": "…" }`。文档站仍部署在 GitHub Pages；读取 GitHub 用户和创建 Issue 由浏览器直接调用 GitHub API。

## 首次部署

1. 在 GitHub **Settings → Developer settings → OAuth Apps → New OAuth App** 创建应用。Homepage URL 填 `https://docs.mofox.chat`，Authorization callback URL 填 `https://docs.mofox.chat/docs/feedback/callback/`；关闭 Callback URL 的通配匹配。复制 **Client ID**，并生成 **Client Secret**。详见 [GitHub 注册指南](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)。
2. 注册或登录 [Cloudflare](https://dash.cloudflare.com/)，安装 Node.js 22 或更新版本，然后从仓库根目录运行：

   ```bash
   cd worker
   npm ci
   npx wrangler login
   ```

   `npm ci` 安装项目已锁定的 Wrangler；`login` 会打开浏览器，让你授权 Cloudflare 账号。安装要求见 [Wrangler 官方说明](https://developers.cloudflare.com/workers/wrangler/install-and-update/)。
3. 在 `wrangler.toml` 中核对 `GH_CLIENT_ID` 与上述应用的公开 Client ID 一致（仓库已预填本站应用的 ID）。部署 Worker：

   ```bash
   npx wrangler deploy
   npx wrangler secret put GH_CLIENT_SECRET
   ```

   第二条命令出现输入提示后，在本机粘贴对应应用的 Client Secret。**不要放进命令参数、`wrangler.toml`、前端、GitHub Actions 变量或聊天。** 首次部署在设置 Secret 前会返回中文「尚未配置」，设置 Secret 后 Wrangler 会立即发布新版本。[Cloudflare Secret 说明](https://developers.cloudflare.com/workers/configuration/secrets/)
4. 记下部署输出的 `https://mofox-docs-github-oauth.<账号子域>.workers.dev`，前端换码地址是在它后面加 `/token`。
5. 在文档仓库 **Settings → Secrets and variables → Actions → Variables → New repository variable** 添加两个**公开变量**，然后重新运行文档部署工作流：

   | 名称 | 值 |
   | --- | --- |
   | `VITE_GH_CLIENT_ID` | 与 Worker 相同的生产 OAuth App Client ID |
   | `VITE_GH_TOKEN_URL` | 部署输出的 HTTPS Worker 地址 + `/token` |

   这两个值会进入静态站点构建产物，不能填写 Secret。缺少配置时，文档站仍提供直接去 GitHub 的反馈入口。

## 本地联调

1. **另外创建开发 OAuth App**：Homepage URL 为 `http://localhost:5173`，Callback URL 为 `http://localhost:5173/docs/feedback/callback/`，同样关闭通配匹配。不要修改生产应用的 Callback URL。
2. 在 `worker/` 本地创建 `.dev.vars`，填入开发应用的 `GH_CLIENT_ID`、`GH_CLIENT_SECRET`。仅在这个被 Git 忽略的文件里填写本地 Secret；它不会替代 Cloudflare 上的生产 Secret。`.dev.vars` 的格式为每行 `变量名="值"`，参见 [本地环境变量说明](https://developers.cloudflare.com/workers/local-development/environment-variables/)。
3. 在仓库根目录将 `.env.example` 复制为 `.env.local`，填入开发 App 的 `VITE_GH_CLIENT_ID`，**留空 `VITE_GH_TOKEN_URL`**。前端会使用仅开发服务器提供的同源 `/__github-oauth/token` 代理。
4. 开两个终端，分别运行：

   ```bash
   # 终端一：从仓库根目录进入 Worker
   cd worker
   npm ci
   npm run dev
   ```

   ```bash
   # 终端二：在仓库根目录
   npm ci
   npm run docs:dev -- --port 5173 --strictPort
   ```

5. 用 **`http://localhost:5173`** 打开任意文档内容页，点击右上角反馈按钮，授权后在站内表单提交测试 Issue。授权和回调请保持同一标签页；来源 URL、`state` 和 token 都存放在该标签页的 `sessionStorage`。

开发代理将请求转给 `http://127.0.0.1:8787/token`，并重写 Origin/Referer 为文档站生产域名。Worker 的来源限制始终只允许 `https://docs.mofox.chat`；直接从 localhost 浏览器跨域请求 8787 会被拒绝。该代理不会进入 GitHub Pages 构建产物。

## 安全与验证

- 校验 Origin；有 Referer 时也必须来自生产域名，缺 Origin 时可凭合法 Referer。CORS 只返回生产域名，预检只允许 `POST` 和 `Content-Type`。
- 使用**内存限流**：每个 Worker isolate 内，每 IP 每小时最多 10 次 POST（失败请求也计数），过期记录会清理，最多保留 10,000 个 IP。不同 isolate 不共享计数，重启会重置，适合此处简单限流；若需要全局严格配额，后续应改用 Durable Objects 等共享方案。Origin/Referer 是浏览器访问边界，非浏览器客户端仍可伪造这两个头。
- JSON 请求体最多 4 KB；GitHub 请求 10 秒超时；响应禁止缓存，不透传上游错误细节。实现不输出请求体、Secret 或 token，默认关闭 Worker 可观测日志。
- 在 `worker/` 运行 `npm test`。自动测试使用假凭据，覆盖来源/CORS、配额与过期、请求校验、上游失败/超时以及成功只返回 token；不会创建真实 Issue。

完整维护流程、故障排查与上线验收见 `docs/development/github-feedback.md`。
