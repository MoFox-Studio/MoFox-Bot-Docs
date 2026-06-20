/**
 * markdown-it-mermaid 插件：为 markdown-it 提供 Mermaid 图表支持。
 *
 * 在 SSR 阶段，将 ```mermaid 代码块转为 `<pre class="mermaid">` 容器，
 * 客户端由 mermaid.run() 负责实际渲染。
 * 这种方式兼容 VitePress 的 SSR 构建流程，不会在 Node.js 端访问 DOM。
 */

/**
 * mermaid 代码块的 markdown-it 插件。
 *
 * @param {import('markdown-it')} md - markdown-it 实例
 */
function mermaidPlugin(md) {
  const defaultRenderer = md.renderer.rules.fence.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();

    if (info === "mermaid" || info === "mmd") {
      const code = token.content.trim();
      return `<pre class="mermaid">${md.utils.escapeHtml(code)}</pre>`;
    }

    return defaultRenderer(tokens, idx, options, env, self);
  };
}

export default mermaidPlugin;
