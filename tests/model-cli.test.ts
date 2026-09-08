import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/build-model.ts', import.meta.url));
const loader = import.meta.resolve('tsx');
function run(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, ['--import', loader, script, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
  });
}

test('CLI supports another working directory, spaces in paths, and read-only stale checks', (t) => {
  const root = resolve(tmpdir());
  const directory = mkdtempSync(join(root, 'hatka-model-'));
  t.after(() => {
    assert.equal(dirname(resolve(directory)), root);
    rmSync(directory, { recursive: true, force: true });
  });
  const args = ['--output-dir', 'exports with spaces'];
  const output = join(directory, args[1]!);
  const build = run(directory, ...args);
  assert.equal(build.status, 0, build.stderr);
  assert.equal(JSON.parse(build.stdout).parts, 761);
  const names = readdirSync(output).sort();
  assert.deepEqual(names, ['apartment.glb', 'apartment.mtl', 'apartment.obj', 'model.json']);
  const bytes = names.map((name) => readFileSync(join(output, name)));
  const check = run(directory, ...args, '--check');
  assert.equal(check.status, 0, check.stderr);
  assert.deepEqual(
    names.map((name) => readFileSync(join(output, name))),
    bytes,
  );
  writeFileSync(join(output, 'model.json'), '{}\n');
  const stale = run(directory, ...args, '--check');
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /model.json/);
  assert.equal(readFileSync(join(output, 'model.json'), 'utf8'), '{}\n');
  const missing = run(directory, '--output-dir', 'missing', '--check');
  assert.equal(missing.status, 1);
  assert.ok(!readdirSync(directory).includes('missing'));
  const defaultPath = run(directory, '--check');
  assert.equal(defaultPath.status, 0, defaultPath.stderr);
  const invalid = run(directory, '--unknown');
  assert.notEqual(invalid.status, 0);
});
