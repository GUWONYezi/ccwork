import { describe, expect, it } from 'vitest';
import css from './index.css?raw';
import tokensRaw from '../docs/design-system/foundations/tokens.json?raw';

const tokens = JSON.parse(tokensRaw) as {
  color: Record<string, { value?: string; alias?: string; tailwind: string }>;
};

function themeValue(name: string): string | undefined {
  return css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();
}

describe('index.css @theme', () => {
  it('tokens.json의 모든 색상 토큰이 같은 값으로 정의되어 있다', () => {
    for (const [key, token] of Object.entries(tokens.color)) {
      const expected = token.value ?? `var(--color-${tokens.color[token.alias!].tailwind})`;

      expect(themeValue(`--color-${token.tailwind}`), key).toBe(expected);
    }
  });

  it('기존 토큰(background, card, foreground, muted, border, destructive)을 정의하지 않는다', () => {
    for (const legacy of [
      'background',
      'card',
      'foreground',
      'muted',
      'muted-foreground',
      'border',
      'destructive',
    ]) {
      expect(css, legacy).not.toMatch(new RegExp(`--color-${legacy}\\s*:`));
    }
    expect(css).not.toMatch(/--radius\s*:/);
  });

  it('Boogaloo(display 폰트)를 쓰지 않는다', () => {
    expect(css).not.toContain('Boogaloo');
    expect(css).not.toContain('--font-display');
  });

  it('본문 폰트는 Inter이고 한글은 Pretendard로 폴백한다', () => {
    const sans = themeValue('--font-sans') ?? '';

    expect(sans).toContain('Inter');
    expect(sans).toContain('Pretendard Variable');
    expect(sans.indexOf('Inter')).toBeLessThan(sans.indexOf('Pretendard Variable'));
  });

  it('body는 surface 배경과 on_surface 글자색을 쓴다', () => {
    expect(css).toMatch(/background-color:\s*var\(--color-surface\)/);
    expect(css).toMatch(/color:\s*var\(--color-on-surface\)/);
  });
});
