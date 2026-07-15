/// <reference types="vitepress/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  const taskLists: (
    md: MarkdownIt,
    options?: {
      enabled?: boolean;
      label?: boolean;
      labelAfter?: boolean;
    },
  ) => void;
  export default taskLists;
}
