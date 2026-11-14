import {readdirSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const english = path.join(root, 'docs');
const portuguese = path.join(root, 'i18n/pt-BR/docusaurus-plugin-content-docs/current');

function pages(dir, prefix = '') {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) return pages(path.join(dir, entry.name), relative);
    return /\.mdx?$/.test(entry.name) ? [relative] : [];
  });
}

const missing = pages(english).filter(file => !existsSync(path.join(portuguese, file)));
const extra = pages(portuguese).filter(file => !existsSync(path.join(english, file)));
if (missing.length || extra.length) {
  console.error('Missing pt-BR pages:', missing, '\nMissing en pages:', extra);
  process.exitCode = 1;
} else {
  console.log(`Validated ${pages(english).length} localized documentation pages.`);
}
