import { execFileSync } from 'node:child_process';

import { resolvePlaywriterBin } from './playwriter.mjs';

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

export function resolveSessionName(argv = process.argv) {
  const cliIndex = argv.findIndex((arg) => arg === '--session');
  const cliSession = cliIndex >= 0 && argv[cliIndex + 1] ? argv[cliIndex + 1] : null;
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
      '`PLAYWRITER_SESSION=<name>` 또는 `-- --session <name>` 형태로 지정하세요.'
  );
}
