import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolvePlaywriterBin } from './lib/playwriter.mjs';
import {
  ensureDataLayout,
  formatLocalDate,
  historyDir,
  relativeDataPath,
  repoRoot,
  updateIndex
} from './lib/storage.mjs';

function parseSessionCandidates(output) {
  const cleanedLines = output
    .split(/\r?\n/)
    .map((line) => line.replace(/\x1B\[[0-9;]*m/g, '').trim())
    .filter(Boolean);

  const candidates = new Set();

  for (const line of cleanedLines) {
    const direct = line.match(/^([A-Za-z0-9._-]+)$/);
    const bullet = line.match(/^(?:-|\*|\d+\.)\s*([A-Za-z0-9._-]+)$/);
    const named = line.match(/(?:name|session)[:=]\s*([A-Za-z0-9._-]+)/i);

    if (direct) {
      candidates.add(direct[1]);
      continue;
    }

    if (bullet) {
      candidates.add(bullet[1]);
      continue;
    }

    if (named) {
      candidates.add(named[1]);
    }
  }

  return [...candidates];
}

function resolveSessionName() {
  const cliIndex = process.argv.findIndex((arg) => arg === '--session');
  const cliSession =
    cliIndex >= 0 && process.argv[cliIndex + 1] ? process.argv[cliIndex + 1] : null;
  const envSession = process.env.PLAYWRITER_SESSION;

  if (cliSession) {
    return cliSession;
  }

  if (envSession) {
    return envSession;
  }

  let sessionListOutput = '';
  try {
    sessionListOutput = execFileSync(resolvePlaywriterBin(), ['session', 'list'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch {
    throw new Error(
      'Playwriter 세션 목록을 확인하지 못했습니다. `npm run yt:doctor`로 환경을 점검하세요.'
    );
  }

  const candidates = parseSessionCandidates(sessionListOutput);

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length === 0) {
    throw new Error(
      'Playwriter 세션이 없습니다. `npx playwriter session new`로 세션을 만든 뒤 다시 실행하세요.'
    );
  }

  throw new Error(
    `Playwriter 세션이 여러 개입니다 (${candidates.join(', ')}). ` +
      '`PLAYWRITER_SESSION=<name> npm run yt:scrape` 또는 `npm run yt:scrape -- --session <name>` 형태로 지정하세요.'
  );
}

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
