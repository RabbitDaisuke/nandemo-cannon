// Original Godot files are bundled in web/licenses; no build-time download.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const hashes = {
  'LICENSE.txt': 'b0435e3b3e4e55238f05f4b306f30524a1b2e20147810d436eaa554fa6855c80',
  'COPYRIGHT.txt': 'cb1980c88089573bcacd7221d777c689bb8bbd778799f24c27fca0fe5f774d6d',
  'AUTHORS.md': '6ca51d335b9de108ea53c5621e820c187d98c6faf92e14c8413ddb946b5e56cf',
  'thirdparty/README.md': 'a8037f030f40bcc4b3b70fa87de4f2424130ed8a432774ecca78707c038e4ccc',
};

export async function writeRuntimeLicenses(root, destination) {
  const source = path.resolve(root, 'web/licenses/godot');
  const target = path.resolve(destination, 'licenses/godot');
  if (source === target) throw new Error('License destination must differ from source');
  for (const [name, expected] of Object.entries(hashes)) {
    const bytes = await fs.readFile(path.join(source, name));
    if (createHash('sha256').update(bytes).digest('hex') !== expected) {
      throw new Error(`Original Godot license changed: ${name}`);
    }
  }
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.cp(source, target, {recursive: true});
}
