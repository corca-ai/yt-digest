import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { resolvePlaywriterBin } from './lib/playwriter.mjs';
import { ensureDataLayout, historyDir, indexFile, weeklyDir } from './lib/storage.mjs';

let hasFailure = false;

function logOk(message) {
  console.log(`OK  ${message}`);
}

function logWarn(message) {
  console.log(`WARN ${message}`);
}

function logFail(message) {
  hasFailure = true;
  console.error(`FAIL ${message}`);
}

function runCommand(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

ensureDataLayout();
const playwriterBin = resolvePlaywriterBin();

const nodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajorVersion >= 18) {
  logOk(`Node.js ${process.versions.node}`);
} else {
  logFail(`Node.js 18+ 필요. 현재 버전: ${process.versions.node}`);
}

if (existsSync(historyDir) && existsSync(weeklyDir) && existsSync(indexFile)) {
  logOk('data 디렉터리 구조 준비됨');
} else {
  logFail('data 디렉터리 구조 준비 실패');
}

try {
  const playwriterVersion = runCommand(playwriterBin, ['-v']).split(/\r?\n/)[0];
  logOk(`Playwriter CLI 사용 가능 (${playwriterVersion})`);
} catch {
  logFail('Playwriter CLI를 찾지 못함. `npm install` 후 다시 실행');
}

try {
  const sessionOutput = runCommand(playwriterBin, ['session', 'list']);
  if (sessionOutput) {
    logOk('Playwriter 세션 목록 확인 가능');
    console.log(sessionOutput);
  } else {
    logWarn('Playwriter 세션이 없음. `npx playwriter session new` 필요');
  }
} catch {
  logWarn('세션 목록을 읽지 못함. Chrome 확장 연결 상태를 확인');
}

console.log('Next: Chrome 확장 연결 후 `npx playwriter session new` 또는 `npm run yt:scrape`');

if (hasFailure) {
  process.exitCode = 1;
}
