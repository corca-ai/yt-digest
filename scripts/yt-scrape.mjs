import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolvePlaywriterBin } from './lib/playwriter.mjs';
import { resolveSessionName } from './lib/session.mjs';
import {
  ensureDataLayout,
  formatLocalDate,
  historyDir,
  relativeDataPath,
  repoRoot,
  updateIndex
} from './lib/storage.mjs';

ensureDataLayout();

const playwriterBin = resolvePlaywriterBin();
const sessionName = resolveSessionName();
const outputPath = join(historyDir, `history-${formatLocalDate(new Date())}.json`);
const playwriterScriptPath = join(repoRoot, 'scripts/playwriter/collect-watch-history.js');
const playwriterScript = readFileSync(playwriterScriptPath, 'utf8');

console.log(`Using Playwriter session: ${sessionName}`);

execFileSync(playwriterBin, ['-s', sessionName, '-e', playwriterScript, '--timeout', '180000'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    YT_DIGEST_OUTPUT: outputPath
  }
});

updateIndex({
  latestHistory: relativeDataPath(outputPath)
});

console.log(`Updated data/index.json -> ${relativeDataPath(outputPath)}`);
