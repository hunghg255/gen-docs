import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';

import MarkdownIt from 'markdown-it';
import MarkdownItAbbr from 'markdown-it-abbr';
import MarkdownItContainer from 'markdown-it-container';
import MarkdownItDeflist from 'markdown-it-deflist';
import MarkdownItEmoji from 'markdown-it-emoji';
import MarkdownItFootnote from 'markdown-it-footnote';
import MarkdownItGitHubAlerts from 'markdown-it-github-alerts';
import MarkdownItHighlightjs from 'markdown-it-highlightjs';
import MarkdownItIns from 'markdown-it-ins';
import MarkdownItMark from 'markdown-it-mark';
import MarkdownItTable from 'markdown-it-multimd-table';
import MarkdownItSub from 'markdown-it-sub';
import MarkdownItSup from 'markdown-it-sup';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  xhtmlOut: true,
});

md.use(MarkdownItGitHubAlerts);
md.use(MarkdownItEmoji);
md.use(MarkdownItAbbr);
md.use(MarkdownItContainer, 'spoiler', {
  validate: function (params) {
    return params.trim().match(/^spoiler\s+(.*)$/);
  },

  render: function (tokens, idx) {
    const m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<details><summary>' + md.utils.escapeHtml(m[1]) + '</summary>\n';
    } else {
      // closing tag
      return '</details>\n';
    }
  },
});
md.use(MarkdownItDeflist);
md.use(MarkdownItFootnote);
md.use(MarkdownItIns);
md.use(MarkdownItMark);
md.use(MarkdownItSub);
md.use(MarkdownItSup);
md.use(MarkdownItHighlightjs);
md.use(MarkdownItTable, {
  multiline: false,
  rowspan: false,
  headerless: false,
  multibody: true,
  aotolabel: true,
});

const content = fs.readFileSync(path.resolve(cwd(), 'test/basic.md'), 'utf8');

const rendered = [md.render(content)].join('\n').trim().replaceAll('\r\n', '\n');

const cssBase = fs.readFileSync(path.resolve(cwd(), 'styles/github-base.css'), 'utf8');
const cssColorsLight = fs.readFileSync(
  path.resolve(cwd(), 'styles/github-colors-light.css'),
  'utf8',
);
const cssColorsDark = fs.readFileSync(
  path.resolve(cwd(), 'styles/github-colors-dark-media.css'),
  'utf8',
);

const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.4.0/github-markdown.min.css" integrity="sha512-30lMQ13MJJk66BfdlnvVnKmP05V7Qt1g6sHyYigDgV8i9M2ENAsXk1U4dVvKUYB6pqb2bVhoxhZsYK08hQpS+g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.4.0/github-markdown-dark.min.css" integrity="sha512-kAGXrJyEBA7iWiXz6Nl5OBd6J3C5wujoFtWFYYom325fRFTSBZfUG472coKg6cJhAnMVSWpDuyUKKavig4NZzQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.4.0/github-markdown-light.min.css" integrity="sha512-kDjsFiusauOzRWlNNk7R5nFRVUPFlZjIqI3F0/DYUO9Uz93R0V4zNfrWGSKFtZvHnTIsoM3GwDaqQBJt8ZVt6w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <style>
    html {
      font-family: sans-serif;
    }

    body {
      max-width: 800px;
      margin: 0 auto;
    }

    * {
      box-sizing: border-box;
    }
    ${cssColorsLight}
${cssColorsDark}
${cssBase}
  </style>
</head>
<body>
<main class="markdown-body">

  ${rendered}
</main>
</body>
</html>`;

fs.writeFileSync(path.resolve(cwd(), 'test/basic.html'), templateHtml);
