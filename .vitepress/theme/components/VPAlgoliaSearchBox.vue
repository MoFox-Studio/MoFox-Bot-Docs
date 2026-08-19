<script setup lang="ts">
import docsearch from "@docsearch/js";
import type { DocSearchProps } from "@docsearch/js";
import { useData, useRouter } from "vitepress";
import { nextTick, onMounted, watch } from "vue";

type DocSearchIndex =
  | string
  | { name: string; searchParameters?: Record<string, unknown> };

interface AlgoliaSearchOptions {
  appId: string;
  apiKey: string;
  indexName?: string;
  indices?: DocSearchIndex[];
  placeholder?: string;
  searchParameters?: { facetFilters?: string | string[] };
  translations?: DocSearchProps["translations"];
  askAi?: DocSearchProps["askAi"];
  locales?: Record<string, Partial<AlgoliaSearchOptions>>;
}

const props = defineProps<{
  algolia: AlgoliaSearchOptions;
}>();

const router = useRouter();
const { site, localeIndex, lang } = useData();

onMounted(update);
watch(localeIndex, update);

async function update() {
  await nextTick();

  const options = {
    ...props.algolia,
    ...props.algolia.locales?.[localeIndex.value],
  };

  const rawFacetFilters = options.searchParameters?.facetFilters ?? [];
  const facetFilters = [
    ...(Array.isArray(rawFacetFilters)
      ? rawFacetFilters
      : [rawFacetFilters]
    ).filter((f) => !f.startsWith("lang:")),
    `lang:${lang.value}`,
  ];

  const indices = buildIndices(options, facetFilters);

  initialize({
    ...options,
    indices,
    askAi: options.askAi,
  });
}

function buildIndices(
  options: AlgoliaSearchOptions,
  facetFilters: string[],
): { name: string; searchParameters: Record<string, unknown> }[] {
  const configured: DocSearchIndex[] =
    options.indices && options.indices.length > 0
      ? options.indices
      : options.indexName
        ? [options.indexName]
        : [];

  return configured.map((index) => {
    const entry =
      typeof index === "string" ? { name: index } : index;
    return {
      name: entry.name,
      searchParameters: {
        ...entry.searchParameters,
        facetFilters,
      },
    };
  });
}

function initialize(userOptions: AlgoliaSearchOptions) {
  const options = {
    ...userOptions,
    container: "#docsearch",

    navigator: {
      navigate(item: { itemUrl: string }) {
        router.go(item.itemUrl);
      },
    },

    transformItems(items: { url: string }[]) {
      return items.map((item) => {
        return Object.assign({}, item, {
          url: getRelativePath(item.url),
        });
      });
    },
  };

  docsearch(options as any);
}

function getRelativePath(url: string) {
  const { pathname, hash } = new URL(url, location.origin);
  return pathname.replace(/\.html$/, site.value.cleanUrls ? "" : ".html") + hash;
}
</script>

<template>
  <div id="docsearch" />
</template>
