import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Check changed backend lines without making existing unrelated lint debt a release gate.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'backend');
const require = createRequire(path.join(backend, 'package.json'));
const { ESLint } = require('eslint');
const base = process.env.BASE_REVISION && !/^0+$/.test(process.env.BASE_REVISION)
  ? process.env.BASE_REVISION
  : 'HEAD^';
const diff = spawnSync('git', ['diff', '--no-ext-diff', '--unified=0', base, 'HEAD', '--', 'backend/src'], {
  cwd: root,
  encoding: 'utf8',
});
if (diff.status !== 0) throw new Error(diff.stderr || 'Cannot resolve lint baseline');
const changed = new Map();
let file;
for (const line of diff.stdout.split('\n')) {
  if (line.startsWith('+++ b/')) {
    file = line.slice(6);
    if (!file.endsWith('.ts')) file = undefined;
  } else if (file) {
    const match = line.match(/^@@ .* \+(\d+)(?:,(\d+))? @@/);
    if (match) {
      const start = Number(match[1]);
      const count = Number(match[2] ?? 1);
      if (count) changed.set(file, [...(changed.get(file) ?? []), [start, start + count - 1]]);
    }
  }
}
if (!changed.size) {
  console.log('No changed backend TypeScript lines to lint.');
  process.exit(0);
}
const eslint = new ESLint({ cwd: backend });
const results = await eslint.lintFiles([...changed.keys()].map((name) => path.join(root, name)));
let errors = 0;
for (const result of results) {
  const name = path.relative(root, result.filePath).split(path.sep).join('/');
  const ranges = changed.get(name) ?? [];
  for (const message of result.messages) {
    if (message.fatal || ranges.some(([start, end]) => (message.endLine ?? message.line) >= start && message.line <= end)) {
      console.log(`${name}:${message.line} ${message.message} (${message.ruleId})`);
      if (message.severity === 2) errors++;
    }
  }
}
console.log(`Linted changes in ${changed.size} backend files; ${errors} errors.`);
process.exitCode = errors ? 1 : 0;
