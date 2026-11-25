import { describe, expect, it } from 'vitest';
import { validateTag } from './tags';

describe('validateTag', () => {
  // V1
  it("should canAdd true, trim된 tag, message null을 반환 when 앞뒤 공백이 있는 유효 입력('  react  ')", () => {
    expect(validateTag('  react  ', [])).toEqual({ canAdd: true, tag: 'react', message: null });
  });

  // V2
  it("should 입력을 그대로 tag로 반환 when 공백이 없는 입력('react')", () => {
    expect(validateTag('react', []).tag).toBe('react');
  });

  // V3
  it("should canAdd false, tag '', message null을 반환 when 빈 문자열", () => {
    expect(validateTag('', [])).toEqual({ canAdd: false, tag: '', message: null });
  });

  // V4
  it("should canAdd false, tag '', message null을 반환 when 공백·탭·줄바꿈만 있는 입력", () => {
    expect(validateTag(' \t\n ', [])).toEqual({ canAdd: false, tag: '', message: null });
  });

  // V5
  it("should 중간 공백을 유지 when 'react native'처럼 단어 사이에 공백이 있는 입력", () => {
    expect(validateTag('react native', []).tag).toBe('react native');
  });

  // V6
  it('should 던지지 않고 결과 객체를 반환 when 빈 값이나 공백만 입력', () => {
    expect(() => validateTag('   ', [])).not.toThrow();
    expect(validateTag('   ', [])).toEqual(expect.objectContaining({ canAdd: false }));
  });

  describe('중복 검사 (이슈 3)', () => {
    const DUP = '이미 있는 태그입니다';

    // 이슈 3 V1
    // 회귀 테스트: 기존 validateTag가 중복이 아닌 입력을 이미 통과시킨다. Red 단계에서도 통과한다.
    it("should canAdd true, message null을 반환 when 중복이 아닌 입력('vue', existing ['react'])", () => {
      expect(validateTag('vue', ['react'])).toEqual({ canAdd: true, tag: 'vue', message: null });
    });

    // 이슈 3 V2
    it("should canAdd false, message '이미 있는 태그입니다'를 반환 when 완전히 같은 태그('react', existing ['react'])", () => {
      expect(validateTag('react', ['react'])).toEqual({
        canAdd: false,
        tag: 'react',
        message: DUP,
      });
    });

    // 이슈 3 V3
    it("should 중복으로 거절 when 대소문자만 다름('React', existing ['react'])", () => {
      expect(validateTag('React', ['react'])).toEqual({
        canAdd: false,
        tag: 'React',
        message: DUP,
      });
    });

    // 이슈 3 V4
    it("should 중복으로 거절 when existing 쪽이 대문자('react', existing ['React'])", () => {
      expect(validateTag('react', ['React'])).toEqual({
        canAdd: false,
        tag: 'react',
        message: DUP,
      });
    });

    // 이슈 3 V5
    it("should 중복으로 거절하고 tag는 trim된 값을 반환 when 앞뒤 공백이 있는 중복 입력('  react  ')", () => {
      expect(validateTag('  react  ', ['react'])).toEqual({
        canAdd: false,
        tag: 'react',
        message: DUP,
      });
    });

    // 이슈 3 V6
    // 회귀 테스트: 기존 validateTag가 trim한 입력 표기를 이미 그대로 반환한다. Red 단계에서도 통과한다.
    it("should 소문자로 바꾸지 않고 trim된 입력 표기를 tag로 반환 when 중복이 아닌 'React'", () => {
      expect(validateTag(' React ', ['vue']).tag).toBe('React');
    });

    // 이슈 3 V7
    // 회귀 테스트: 기존 validateTag가 existing이 비어 있어도 이미 추가를 허용한다. Red 단계에서도 통과한다.
    it('should canAdd true when existing이 빈 배열', () => {
      expect(validateTag('react', [])).toEqual({ canAdd: true, tag: 'react', message: null });
    });

    // 이슈 3 V8
    // 회귀 테스트: 기존 validateTag가 부분 일치를 이미 중복으로 보지 않는다. Red 단계에서도 통과한다.
    it("should 중복이 아니라고 판정 when 부분 일치('reac', existing ['react'])", () => {
      expect(validateTag('reac', ['react'])).toEqual({ canAdd: true, tag: 'reac', message: null });
    });

    // 이슈 3 V9
    // 회귀 테스트: 기존 validateTag가 빈 값을 이미 canAdd false, message null로 처리한다. Red 단계에서도 통과한다.
    it("should canAdd false, tag '', message null을 반환 when 빈 값이고 existing에 태그가 있음", () => {
      expect(validateTag('   ', ['react'])).toEqual({ canAdd: false, tag: '', message: null });
    });

    // 이슈 3 V10
    it('should 던지지 않고 결과 객체를 반환 when 중복 입력', () => {
      expect(() => validateTag('react', ['react'])).not.toThrow();
      expect(validateTag('react', ['react'])).toEqual(expect.objectContaining({ canAdd: false }));
    });
  });
});
