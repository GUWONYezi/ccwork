import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config.ts?raw';

describe('vite.config.ts', () => {
  // json-server가 db.json을 쓸 때마다 Vite가 페이지를 새로고침하면
  // 저장 직후 열려 있던 Alert 같은 React 상태가 사라진다.
  it('db.json 변경은 개발 서버의 파일 감시에서 제외한다', () => {
    expect(viteConfig).toMatch(/watch:\s*\{[^}]*ignored:\s*\[[^\]]*['"]\*\*\/db\.json['"]/s);
  });
});
