import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const godot = process.env.GODOT_BIN || 'godot';
async function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(godot, args, {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => {output += data; process.stdout.write(data);});
    child.on('error', reject);
    child.on('close', code => code === 0 && !/SCRIPT ERROR:|Parse Error:|^ERROR:/m.test(output) ? resolve() : reject(new Error(`Check failed (${code}): ${args.join(' ')}`)));
  });
}
await run(['--headless', '--editor', '--import']);
for (const suite of ['search', 'selection', 'progress', 'body', 'cannon', 'hazard', 'rescue', 'playground', 'breakroom', 'game']) await run(['--headless', '--script', `res://tests/${suite}_checks.gd`]);
