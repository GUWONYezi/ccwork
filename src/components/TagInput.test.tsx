import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

function renderTagInput(props: Partial<React.ComponentProps<typeof TagInput>> = {}) {
  const handlers = { onToggle: vi.fn(), onChange: vi.fn(), onSubmit: vi.fn() };
  render(<TagInput isOpen={false} value="" errorMessage={null} {...handlers} {...props} />);
  return handlers;
}

describe('TagInput', () => {
  // TI1
  it('should "태그 추가" 버튼만 보이고 입력창은 숨김 when isOpen이 false', () => {
    renderTagInput({ isOpen: false });

    expect(screen.getByRole('button', { name: '태그 추가' })).toBeInTheDocument();
    expect(screen.queryByLabelText('태그 입력')).not.toBeInTheDocument();
  });

  // TI2
  it('should 버튼명이 "닫기"로 바뀌고 입력창이 보임 when isOpen이 true', () => {
    renderTagInput({ isOpen: true });

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '태그 추가' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('태그 입력')).toBeInTheDocument();
  });

  // TI3
  it('should onToggle을 호출 when 토글 버튼을 클릭', async () => {
    const user = userEvent.setup();
    const { onToggle } = renderTagInput({ isOpen: false });

    await user.click(screen.getByRole('button', { name: '태그 추가' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // TI4
  it('should onChange에 입력값을 전달 when 입력창에 타이핑', async () => {
    const user = userEvent.setup();
    const { onChange } = renderTagInput({ isOpen: true, value: '' });

    await user.type(screen.getByLabelText('태그 입력'), 'a');

    expect(onChange).toHaveBeenLastCalledWith('a');
  });

  // TI5
  it('should onSubmit을 호출 when 입력창에서 Enter', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTagInput({ isOpen: true, value: 'react' });

    await user.type(screen.getByLabelText('태그 입력'), '{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // TI6
  it('should 기본 동작을 취소(preventDefault) when Enter', () => {
    renderTagInput({ isOpen: true, value: 'react' });

    // fireEvent는 기본 동작이 취소되면 false를 반환한다
    const notPrevented = fireEvent.keyDown(screen.getByLabelText('태그 입력'), { key: 'Enter' });

    expect(notPrevented).toBe(false);
  });

  // TI7
  it("should value를 입력창 값으로 표시 when value가 'react' 또는 ''", () => {
    const { unmount } = render(
      <TagInput
        isOpen
        value="react"
        errorMessage={null}
        onToggle={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('태그 입력')).toHaveValue('react');
    unmount();

    render(
      <TagInput
        isOpen
        value=""
        errorMessage={null}
        onToggle={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('태그 입력')).toHaveValue('');
  });

  // TI8
  it('should aria-label "태그 입력"을 가진 입력창을 렌더 when isOpen이 true', () => {
    renderTagInput({ isOpen: true });

    expect(screen.getByRole('textbox', { name: '태그 입력' })).toBeInTheDocument();
  });

  // TI9
  it('should 눈에 띄지 않는 회색 계열 토큰 클래스를 토글 버튼에 적용 when 렌더', () => {
    renderTagInput({ isOpen: false });

    expect(screen.getByRole('button', { name: '태그 추가' })).toHaveClass(
      'text-on-surface-variant',
    );
  });

  // TI10
  it('should onSubmit을 호출하지 않음 when Enter 이외의 키를 입력', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTagInput({ isOpen: true, value: 'react' });

    await user.type(screen.getByLabelText('태그 입력'), 'a{Escape}{Tab}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // TI11
  it('should onSubmit을 호출하지 않음 when 한글 등 IME 조합 중(isComposing)에 Enter', () => {
    const { onSubmit } = renderTagInput({ isOpen: true, value: '리액' });

    fireEvent.keyDown(screen.getByLabelText('태그 입력'), { key: 'Enter', isComposing: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('안내 문구 (이슈 3)', () => {
    // 이슈 3 I1
    it("should 안내 문구를 표시 when isOpen true이고 errorMessage가 '이미 있는 태그입니다'", () => {
      renderTagInput({ isOpen: true, errorMessage: '이미 있는 태그입니다' });

      expect(screen.getByText('이미 있는 태그입니다')).toBeInTheDocument();
    });

    // 이슈 3 I2
    it('should 문구를 입력창 아래에 표시 when errorMessage가 있음 (DOM 순서)', () => {
      renderTagInput({ isOpen: true, errorMessage: '이미 있는 태그입니다' });

      const input = screen.getByLabelText('태그 입력');
      const message = screen.getByText('이미 있는 태그입니다');
      expect(
        input.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    // 이슈 3 I3
    it('should 문구가 role alert를 가짐 when errorMessage가 있음', () => {
      renderTagInput({ isOpen: true, errorMessage: '이미 있는 태그입니다' });

      expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 태그입니다');
    });

    // 이슈 3 I4
    // 회귀 테스트: 기존 TagInput이 errorMessage 없이 alert를 이미 렌더하지 않는다. Red 단계에서도 통과한다.
    it('should alert를 렌더하지 않음 when errorMessage가 null', () => {
      renderTagInput({ isOpen: true, errorMessage: null });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 이슈 3 I5
    // 회귀 테스트: 기존 TagInput이 닫힌 상태에서 문구를 이미 표시하지 않는다. Red 단계에서도 통과한다.
    it('should 문구를 표시하지 않음 when isOpen false이고 errorMessage가 있음', () => {
      renderTagInput({ isOpen: false, errorMessage: '이미 있는 태그입니다' });

      expect(screen.queryByText('이미 있는 태그입니다')).not.toBeInTheDocument();
    });

    // 이슈 3 I6
    // 회귀 테스트: 기존 TagInput이 value를 입력창에 이미 그대로 표시한다. Red 단계에서도 통과한다.
    it('should 입력창 값을 그대로 유지 when errorMessage가 있음', () => {
      renderTagInput({ isOpen: true, value: 'react', errorMessage: '이미 있는 태그입니다' });

      expect(screen.getByLabelText('태그 입력')).toHaveValue('react');
    });
  });
});
