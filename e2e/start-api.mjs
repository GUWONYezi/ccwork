// e2e 전용 API 서버: 시드를 임시 DB로 복사한 뒤 json-server를 3001 포트로 실행한다.
// 실제 db.json은 건드리지 않는다.
import { copyFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

copyFileSync('e2e/seed.json', 'e2e/.db.tmp.json');

const child = spawn('npx', ['json-server', 'e2e/.db.tmp.json', '--port', '3001'], {
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
