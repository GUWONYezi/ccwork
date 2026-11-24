import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTagEditor } from './useTagEditor';

function addTagByTyping(result: { current: ReturnType<typeof useTagEditor> }, text: string) {
  act(() => result.current.changeInput(text));
  act(() => result.current.addTag());
}

describe('useTagEditor', () => {
  // H1
  it("should tags [], isInputOpen false, inputValue ''로 시작 when 마운트", () => {
    const { result } = renderHook(() => useTagEditor());

    expect(result.current.tags).toEqual([]);
    expect(result.current.isInputOpen).toBe(false);
    expect(result.current.inputValue).toBe('');
  });

  describe('toggleInput', () => {
    // H2
    it('should isInputOpen을 true로 when 닫힌 상태에서 호출', () => {
      const { result } = renderHook(() => useTagEditor());

      act(() => result.current.toggleInput());

      expect(result.current.isInputOpen).toBe(true);
    });

    // H3
    it('should isInputOpen을 false로 when 열린 상태에서 호출', () => {
      const { result } = renderHook(() => useTagEditor());
      act(() => result.current.toggleInput());

      act(() => result.current.toggleInput());

      expect(result.current.isInputOpen).toBe(false);
    });
  });

  describe('changeInput', () => {
    // H4
    it('should inputValue를 전달한 값으로 갱신 when 값을 전달', () => {
      const { result } = renderHook(() => useTagEditor());

      act(() => result.current.changeInput('rea'));

      expect(result.current.inputValue).toBe('rea');
    });
  });

  describe('addTag', () => {
    // H5
    it("should trim된 태그를 tags 끝에 추가하고 inputValue를 ''로 비움 when inputValue가 '  react  '", () => {
      const { result } = renderHook(() => useTagEditor());

      addTagByTyping(result, '  react  ');

      expect(result.current.tags).toEqual(['react']);
      expect(result.current.inputValue).toBe('');
    });

    // H6
    it("should 입력 순서대로 tags에 쌓고 isInputOpen을 유지 when 'react', 'design'을 연속 추가", () => {
      const { result } = renderHook(() => useTagEditor());
      act(() => result.current.toggleInput());

      addTagByTyping(result, 'react');
      addTagByTyping(result, 'design');

      expect(result.current.tags).toEqual(['react', 'design']);
      expect(result.current.isInputOpen).toBe(true);
    });

    // H8
    it('should 상태를 바꾸지 않음 when inputValue가 빈 문자열', () => {
      const { result } = renderHook(() => useTagEditor());
      act(() => result.current.reset(['react']));

      act(() => result.current.addTag());

      expect(result.current.tags).toEqual(['react']);
      expect(result.current.inputValue).toBe('');
    });

    // H9
    it('should 상태를 바꾸지 않음 when inputValue가 공백만', () => {
      const { result } = renderHook(() => useTagEditor());
      act(() => result.current.reset(['react']));
      act(() => result.current.changeInput('   '));

      act(() => result.current.addTag());

      expect(result.current.tags).toEqual(['react']);
      expect(result.current.inputValue).toBe('   ');
    });

    // H11
    it('should reset에 전달한 initialTags 배열을 변경하지 않음 when reset 후 태그를 추가', () => {
      const { result } = renderHook(() => useTagEditor());
      const initialTags = ['react'];
      act(() => result.current.reset(initialTags));

      addTagByTyping(result, 'design');

      expect(initialTags).toEqual(['react']);
      expect(result.current.tags).toEqual(['react', 'design']);
    });
  });

  describe('reset', () => {
    // H7
    it("should tags를 initialTags로 교체하고 isInputOpen false, inputValue ''로 when 태그 입력 중인 상태에서 호출", () => {
      const { result } = renderHook(() => useTagEditor());
      act(() => result.current.toggleInput());
      addTagByTyping(result, 'old');
      act(() => result.current.changeInput('typing'));

      act(() => result.current.reset(['react', 'design']));

      expect(result.current.tags).toEqual(['react', 'design']);
      expect(result.current.isInputOpen).toBe(false);
      expect(result.current.inputValue).toBe('');
    });

    // H10
    it('should tags를 빈 배열로 when initialTags가 [] (tags가 없는 기존 노트)', () => {
      const { result } = renderHook(() => useTagEditor());
      act(() => result.current.reset(['react']));

      act(() => result.current.reset([]));

      expect(result.current.tags).toEqual([]);
    });

    // H12
    it('should 이전 노트의 태그가 남지 않음 when 다른 initialTags로 연속 reset', () => {
      const { result } = renderHook(() => useTagEditor());

      act(() => result.current.reset(['react', 'design']));
      act(() => result.current.reset(['vue']));

      expect(result.current.tags).toEqual(['vue']);
    });
  });

  describe('removeTag', () => {
    function setup(initialTags: string[]) {
      const hook = renderHook(() => useTagEditor());
      act(() => hook.result.current.reset(initialTags));
      return hook;
    }

    // 이슈 2 H1
    it("should 해당 인덱스의 태그만 제거 when tags가 ['a', 'b', 'c']에서 1을 전달", () => {
      const { result } = setup(['a', 'b', 'c']);

      act(() => result.current.removeTag(1));

      expect(result.current.tags).toEqual(['a', 'c']);
    });

    // 이슈 2 H2
    it('should 나머지 태그의 순서를 유지 when 중간 태그를 제거', () => {
      const { result } = setup(['a', 'b', 'c', 'd']);

      act(() => result.current.removeTag(2));

      expect(result.current.tags).toEqual(['a', 'b', 'd']);
    });

    // 이슈 2 H3
    it('should isInputOpen과 inputValue를 바꾸지 않음 when 입력 중에 태그를 제거', () => {
      const { result } = setup(['a', 'b']);
      act(() => result.current.toggleInput());
      act(() => result.current.changeInput('typing'));

      act(() => result.current.removeTag(0));

      expect(result.current.isInputOpen).toBe(true);
      expect(result.current.inputValue).toBe('typing');
    });

    // 이슈 2 H4
    it('should 첫 번째 태그만 제거 when 인덱스 0', () => {
      const { result } = setup(['a', 'b', 'c']);

      act(() => result.current.removeTag(0));

      expect(result.current.tags).toEqual(['b', 'c']);
    });

    // 이슈 2 H5
    it('should 마지막 태그만 제거 when 인덱스 tags.length-1', () => {
      const { result } = setup(['a', 'b', 'c']);

      act(() => result.current.removeTag(2));

      expect(result.current.tags).toEqual(['a', 'b']);
    });

    // 이슈 2 H6
    it('should tags가 [] when 하나뿐인 태그를 제거', () => {
      const { result } = setup(['a']);

      act(() => result.current.removeTag(0));

      expect(result.current.tags).toEqual([]);
    });

    // 이슈 2 H7
    it("should 같은 위치의 태그 하나만 제거 when 중복 태그 ['a', 'a']에서 0을 전달", () => {
      const { result } = setup(['a', 'a']);

      act(() => result.current.removeTag(0));

      expect(result.current.tags).toEqual(['a']);
    });

    // 이슈 2 H8
    it('should reset에 전달한 initialTags 배열을 변경하지 않음 when reset 후 태그를 제거', () => {
      const initialTags = ['a', 'b'];
      const { result } = setup(initialTags);

      act(() => result.current.removeTag(0));

      expect(initialTags).toEqual(['a', 'b']);
      expect(result.current.tags).toEqual(['b']);
    });

    // 이슈 2 H9
    it('should 던지지 않고 tags를 바꾸지 않음 when 인덱스가 tags.length 이상', () => {
      const { result } = setup(['a', 'b']);

      expect(() => act(() => result.current.removeTag(2))).not.toThrow();

      expect(result.current.tags).toEqual(['a', 'b']);
    });

    // 이슈 2 H10
    it('should 던지지 않고 tags를 바꾸지 않음 when 인덱스가 음수', () => {
      const { result } = setup(['a', 'b']);

      expect(() => act(() => result.current.removeTag(-1))).not.toThrow();

      expect(result.current.tags).toEqual(['a', 'b']);
    });
  });
});
