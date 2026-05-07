import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_TARGETS = ['app', 'lib', 'components', 'README.md', '.env.example'];
const FORBIDDEN_MODEL_STRINGS = [
  'grok-3-fast',
  'grok-4.20-reasoning',
  'grok-4.20-multi-agent',
  'grok-imagine-image-pro',
];

function collectFiles(path: string): string[] {
  const absolutePath = join(ROOT, path);
  const stat = statSync(absolutePath);

  if (stat.isFile()) {
    return [absolutePath];
  }

  return readdirSync(absolutePath).flatMap((entry) => collectFiles(join(path, entry)));
}

test('production Grok model pins do not drift to deprecated model names', () => {
  const offenders: string[] = [];

  for (const file of SCAN_TARGETS.flatMap(collectFiles)) {
    const text = readFileSync(file, 'utf8');
    for (const forbidden of FORBIDDEN_MODEL_STRINGS) {
      if (text.includes(forbidden)) {
        offenders.push(`${relative(ROOT, file)} contains ${forbidden}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test('Grok Imagine image route is pinned to the quality image model', () => {
  const route = readFileSync(join(ROOT, 'app/api/imagine/route.ts'), 'utf8');

  assert.match(route, /grok-imagine-image-quality/);
  assert.doesNotMatch(route, /grok-imagine-image-pro/);
});
