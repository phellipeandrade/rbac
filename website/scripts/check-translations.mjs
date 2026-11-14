import {readdirSync, existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const english = path.join(root, 'docs');
const portuguese = path.join(root, 'i18n/pt-BR/docusaurus-plugin-content-docs/current');
const versions = JSON.parse(readFileSync(path.join(root, 'versions.json'), 'utf8'));

function pages(dir, prefix = '') {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) return pages(path.join(dir, entry.name), relative);
    return /\.mdx?$/.test(entry.name) ? [relative] : [];
  });
}

let failed = false;
let total = 0;

for (const [version, enDir, ptDir] of [
  ['current', english, portuguese],
  ...versions.map(version => [version,
    path.join(root, 'versioned_docs', `version-${version}`),
    path.join(root, 'i18n/pt-BR/docusaurus-plugin-content-docs', `version-${version}`)
  ])
]) {
  if (!existsSync(enDir) || !existsSync(ptDir)) {
    console.error(`${version}: missing documentation directory`, {enDir, ptDir});
    failed = true;
    continue;
  }

  const enPages = pages(enDir);
  const ptPages = pages(ptDir);
  const missing = enPages.filter(file => !existsSync(path.join(ptDir, file)));
  const extra = ptPages.filter(file => !existsSync(path.join(enDir, file)));
  if (missing.length || extra.length) {
    console.error(`${version}: missing pt-BR pages:`, missing, 'missing en pages:', extra);
    failed = true;
  } else {
    total += enPages.length;
    console.log(`Validated ${enPages.length} localized pages for ${version}.`);
  }
}

if (failed) process.exitCode = 1;
else console.log(`Validated ${total} pages per locale across all documentation versions.`);
