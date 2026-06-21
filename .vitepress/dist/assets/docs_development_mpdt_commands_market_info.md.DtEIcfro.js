import{_ as r,I as i,c as d,o,a4 as k,j as e,J as a,a as n,w as l}from"./chunks/framework.BR-X7tCu.js";const C=JSON.parse('{"title":"mpdt market info","description":"","frontmatter":{},"headers":[],"relativePath":"docs/development/mpdt/commands/market/info.md","filePath":"docs/development/mpdt/commands/market/info.md","lastUpdated":1778924580000}'),c={name:"docs/development/mpdt/commands/market/info.md"};function g(m,s,b,u,f,y){const p=i("VPNolebaseInlineLinkPreview"),t=i("NolebaseGitContributors"),h=i("NolebaseGitChangelog");return o(),d("div",null,[s[4]||(s[4]=k(`<h1 id="mpdt-market-info" tabindex="-1">mpdt market info <a class="header-anchor" href="#mpdt-market-info" aria-label="Permalink to “mpdt market info”">​</a></h1><p>查看插件的详细信息，包括所有版本、依赖、作者等。</p><h2 id="用法" tabindex="-1">用法 <a class="header-anchor" href="#用法" aria-label="Permalink to “用法”">​</a></h2><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mpdt</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> market</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> info</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">plugin_i</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">d</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&gt;</span></span></code></pre></div><h2 id="参数" tabindex="-1">参数 <a class="header-anchor" href="#参数" aria-label="Permalink to “参数”">​</a></h2><h3 id="plugin-id" tabindex="-1">plugin_id <a class="header-anchor" href="#plugin-id" aria-label="Permalink to “plugin_id”">​</a></h3><p>插件 ID（必需）。</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mpdt</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> market</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> info</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> my-plugin</span></span></code></pre></div><h2 id="示例" tabindex="-1">示例 <a class="header-anchor" href="#示例" aria-label="Permalink to “示例”">​</a></h2><h3 id="查看插件信息" tabindex="-1">查看插件信息 <a class="header-anchor" href="#查看插件信息" aria-label="Permalink to “查看插件信息”">​</a></h3><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mpdt</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> market</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> info</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> weather-query</span></span></code></pre></div><p>输出：</p><div class="language-"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e;" tabindex="0" dir="ltr"><code><span class="line"><span>插件信息</span></span>
<span class="line"><span>────────────────────────────────────────</span></span>
<span class="line"><span></span></span>
<span class="line"><span>ID:           weather-query</span></span>
<span class="line"><span>名称:         Weather Query</span></span>
<span class="line"><span>作者:         Developer</span></span>
<span class="line"><span>版本:         2.1.0</span></span>
<span class="line"><span>分类:         utility</span></span>
<span class="line"><span>标签:         weather, api, query</span></span>
<span class="line"><span>描述:         查询实时天气信息</span></span>
<span class="line"><span></span></span>
<span class="line"><span>仓库:         https://github.com/user/weather-query</span></span>
<span class="line"><span>主页:         https://example.com</span></span>
<span class="line"><span>许可证:       MIT</span></span>
<span class="line"><span></span></span>
<span class="line"><span>可用版本</span></span>
<span class="line"><span>────────────────────────────────────────</span></span>
<span class="line"><span>2.1.0 (最新)</span></span>
<span class="line"><span>2.0.0</span></span>
<span class="line"><span>1.5.0</span></span>
<span class="line"><span>1.0.0</span></span>
<span class="line"><span></span></span>
<span class="line"><span>依赖</span></span>
<span class="line"><span>────────────────────────────────────────</span></span>
<span class="line"><span>Python:</span></span>
<span class="line"><span>  - requests&gt;=2.28.0</span></span>
<span class="line"><span>  - pydantic&gt;=2.0.0</span></span>
<span class="line"><span></span></span>
<span class="line"><span>插件:</span></span>
<span class="line"><span>  - location-service&gt;=1.0.0</span></span></code></pre></div><h2 id="相关命令" tabindex="-1">相关命令 <a class="header-anchor" href="#相关命令" aria-label="Permalink to “相关命令”">​</a></h2>`,14)),e("ul",null,[e("li",null,[a(p,{href:"./search.html"},{default:l(()=>[...s[0]||(s[0]=[n("mpdt market search",-1)])]),_:1}),s[1]||(s[1]=n(" - 搜索插件",-1))]),e("li",null,[a(p,{href:"./../depend/add.html"},{default:l(()=>[...s[2]||(s[2]=[n("mpdt depend add",-1)])]),_:1}),s[3]||(s[3]=n(" - 添加依赖",-1))])]),a(t),a(h)])}const _=r(c,[["render",g]]);export{C as __pageData,_ as default};
