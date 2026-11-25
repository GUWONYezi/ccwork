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

describe('validateTag 길이/개수 제한 (이슈 4)', () => {
  const DUP = '이미 있는 태그입니다';
  const LEN_MSG = '태그는 최대 50자까지 입력할 수 있습니다';
  const COUNT_MSG = '태그는 최대 10개까지 추가할 수 있습니다';
  const tagsOf = (count: number) => Array.from({ length: count }, (_, i) => `tag${i}`);

  // 이슈 4 V1
  // 회귀 테스트: 기존 validateTag가 50자 입력을 이미 허용한다(제한이 아직 없음). Red 단계에서도 통과한다.
  it('should canAdd true, message null을 반환 when trim 후 50자인 입력', () => {
    const input = 'a'.repeat(50);

    expect(validateTag(input, [])).toEqual({ canAdd: true, tag: input, message: null });
  });

  // 이슈 4 V2
  it("should canAdd false, message '태그는 최대 50자까지 입력할 수 있습니다'를 반환 when trim 후 51자인 입력", () => {
    const input = 'a'.repeat(51);

    expect(validateTag(input, [])).toEqual({ canAdd: false, tag: input, message: LEN_MSG });
  });

  // 이슈 4 V3
  // 회귀 테스트: 기존 validateTag가 10번째 태그를 이미 허용한다(제한이 아직 없음). Red 단계에서도 통과한다.
  it('should canAdd true, message null을 반환 when existing이 9개인 상태에서 10번째 태그', () => {
    expect(validateTag('vue', tagsOf(9))).toEqual({ canAdd: true, tag: 'vue', message: null });
  });

  // 이슈 4 V4
  it("should canAdd false, message '태그는 최대 10개까지 추가할 수 있습니다'를 반환 when existing이 이미 10개", () => {
    expect(validateTag('vue', tagsOf(10))).toEqual({
      canAdd: false,
      tag: 'vue',
      message: COUNT_MSG,
    });
  });

  // 이슈 4 V5
  // 회귀 테스트: 기존 validateTag가 trim 후 50자 입력을 이미 허용한다(제한이 아직 없음). Red 단계에서도 통과한다.
  it('should canAdd true when 앞뒤 공백 포함 총 52자이지만 trim 후 50자', () => {
    const body = 'a'.repeat(50);

    expect(validateTag(`  ${body}  `, [])).toEqual({ canAdd: true, tag: body, message: null });
  });

  // 이슈 4 V6
  it('should 길이 초과로 거절하고 tag는 잘리지 않은 trim 값 전체를 반환 when 앞뒤 공백이 있는 trim 후 51자', () => {
    const body = 'a'.repeat(51);

    expect(validateTag(`  ${body}  `, [])).toEqual({ canAdd: false, tag: body, message: LEN_MSG });
  });

  // 이슈 4 V7
  // 회귀 테스트: 기존 validateTag가 한글 50자 입력을 이미 허용한다(제한이 아직 없음). Red 단계에서도 통과한다.
  it('should canAdd true when 한글 50자', () => {
    expect(validateTag('가'.repeat(50), []).canAdd).toBe(true);
  });

  // 이슈 4 V8
  it('should 길이 초과로 거절 when 한글 51자', () => {
    expect(validateTag('가'.repeat(51), [])).toEqual(
      expect.objectContaining({ canAdd: false, message: LEN_MSG }),
    );
  });

  // 이슈 4 V9
  it('should 개수 초과로 거절 when existing이 11개 이상', () => {
    expect(validateTag('vue', tagsOf(11))).toEqual(
      expect.objectContaining({ canAdd: false, message: COUNT_MSG }),
    );
  });

  // 이슈 4 V10
  it('should 길이 초과와 개수 초과가 서로 다른 message를 반환 when 각각 51자 입력과 10개 existing', () => {
    const lengthResult = validateTag('a'.repeat(51), []);
    const countResult = validateTag('vue', tagsOf(10));

    expect(lengthResult.message).toBe(LEN_MSG);
    expect(countResult.message).toBe(COUNT_MSG);
    expect(lengthResult.message).not.toBe(countResult.message);
  });

  // 이슈 4 V11
  // 회귀 테스트: 기존 validateTag가 중복 검사를 이미 수행해, 10개 상태에서도 중복 문구를 반환한다. Red 단계에서도 통과한다.
  it("should 중복 문구 '이미 있는 태그입니다'를 반환 when existing이 10개이고 그 안의 태그를 다시 입력 (검사 순서: 중복 > 개수)", () => {
    expect(validateTag('tag3', tagsOf(10))).toEqual({ canAdd: false, tag: 'tag3', message: DUP });
  });

  // 이슈 4 V12
  it('should 길이 초과 문구를 반환 when existing이 10개이고 51자 입력 (검사 순서: 길이 > 개수)', () => {
    expect(validateTag('a'.repeat(51), tagsOf(10)).message).toBe(LEN_MSG);
  });

  // 이슈 4 V13
  // 회귀 테스트: 기존 validateTag가 빈 값을 이미 canAdd false, message null로 처리한다. Red 단계에서도 통과한다.
  it("should canAdd false, tag '', message null을 반환 when existing이 10개이고 빈 값 (검사 순서: 빈 값 > 개수)", () => {
    expect(validateTag('   ', tagsOf(10))).toEqual({ canAdd: false, tag: '', message: null });
  });

  // 이슈 4 V14
  it("should 개수 초과로 거절하고 tag는 trim 값을 반환 when existing이 10개이고 '  vue  ' 입력", () => {
    expect(validateTag('  vue  ', tagsOf(10))).toEqual({
      canAdd: false,
      tag: 'vue',
      message: COUNT_MSG,
    });
  });
});
