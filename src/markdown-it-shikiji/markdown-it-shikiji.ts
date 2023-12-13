// @ts-nocheck
import type MarkdownIt from 'markdown-it';
import { addClassToHast, bundledLanguages, getHighlighter } from 'shikiji';
import type {
  BuiltinLanguage,
  BuiltinTheme,
  CodeOptionsMeta,
  CodeOptionsThemes,
  CodeToHastOptions,
  Highlighter,
  LanguageInput,
  TransformerOptions,
} from 'shikiji';

function parseHighlightLines(attrs: string) {
  if (!attrs) {
    return null;
  }
  const match = attrs.match(/{([\d,-]+)}/);
  if (!match) {
    return null;
  }
  const lines = match[1].split(',').flatMap((v) => {
    const num = v.split('-').map((v) => Number.parseInt(v, 10));
    return num.length === 1
      ? [num[0]]
      : Array.from({ length: num[1] - num[0] + 1 }, (_, i) => i + num[0]);
  });

  return lines;
}

export type MarkdownItShikijiOptions = MarkdownItShikijiSetupOptions & {
  /**
   * Language names to include.
   *
   * @default Object.keys(bundledLanguages)
   */
  langs?: Array<LanguageInput | BuiltinLanguage>;
};

export type MarkdownItShikijiSetupOptions = CodeOptionsThemes<BuiltinTheme> &
  TransformerOptions &
  CodeOptionsMeta & {
    /**
     * Add `highlighted` class to lines defined in after codeblock
     *
     * @default true
     */
    highlightLines?: boolean | string;

    /**
     * Custom meta string parser
     * Return an object to merge with `meta`
     */
    parseMetaString?: (
      metaString: string,
      code: string,
      lang: string,
    ) => Record<string, any> | undefined | null;
  };

function setup(
  markdownit: MarkdownIt,
  highlighter: Highlighter,
  options: MarkdownItShikijiSetupOptions,
) {
  const { highlightLines = true, parseMetaString } = options;

  markdownit.options.highlight = (code, lang = 'text', attrs) => {
    const meta = parseMetaString?.(attrs, code, lang) || {};

    const codeOptions: CodeToHastOptions = {
      ...options,
      lang,
      meta: {
        ...options.meta,
        ...meta,
        __raw: attrs,
      },
      transformers: [],
    };

    codeOptions.transformers.push(...options.transformers);

    if (highlightLines) {
      const lines = parseHighlightLines(attrs);
      if (lines) {
        const className = highlightLines === true ? 'highlighted' : highlightLines;

        codeOptions.transformers.push({
          name: 'markdown-it-shikiji:line-class',
          line(node, line) {
            if (lines.includes(line)) {
              addClassToHast(node, className);
            }
            return node;
          },
        });
      }
    }

    codeOptions.transformers.push({
      name: 'markdown-it-shikiji:block-class',
      code(node) {
        node.properties.class = `language-${lang}`;
      },
    });

    return highlighter.codeToHtml(code, codeOptions);
  };
}

export default async function markdownItShikiji(options: MarkdownItShikijiOptions) {
  const themeNames = ('themes' in options ? Object.values(options.themes) : [options.theme]).filter(
    Boolean,
  ) as BuiltinTheme[];
  const highlighter = await getHighlighter({
    themes: themeNames,
    langs: options.langs || (Object.keys(bundledLanguages) as BuiltinLanguage[]),
  });

  return function (markdownit: MarkdownIt) {
    setup(markdownit, highlighter, options);
  };
}
