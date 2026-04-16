import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot } from './storage.mjs';

export function resolvePlaywriterBin() {
  const localBin = join(
    repoRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'playwriter.cmd' : 'playwriter'
  );

  return existsSync(localBin) ? localBin : 'playwriter';
}
