import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Confirm } from './Confirm';
import type { AlertVariant } from './Alert';

const VARIANTS: AlertVariant[] = ['info', 'success', 'warning', 'error'];

function setup(props: { variant?: AlertVariant; confirmText?: string; cancelText?: string } = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <Confirm title="확인 제목" onConfirm={onConfirm} onCancel={onCancel} {...props}>
      확인 내용
    </Confirm>,
  );
  const header = screen.getByRole('heading', { name: '확인 제목' }).parentElement as HTMLElement;
  return { onConfirm, onCancel, header, ...view };
}

describe('Confirm', () => {
  it('role="alertdialog"로 제목과 내용을 보여준다', () => {
    setup();

    expect(screen.getByRole('alertdialog', { name: '확인 제목' })).toBeInTheDocument();
    expect(screen.getByText('확인 내용')).toBeInTheDocument();
  });

  it('버튼 문구 기본값은 "확인"/"취소"이고 바꿀 수 있다', () => {
    const { unmount } = setup();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    unmount();

    setup({ confirmText: '삭제', cancelText: '돌아가기' });
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument();
  });

  it('확인 버튼은 onConfirm, 취소 버튼과 닫기(×)는 onCancel을 호출한다', async () => {
    const { onConfirm, onCancel } = setup();

    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  describe('디자인 시스템', () => {
    it('variant를 생략하면 warning 색을 쓴다', () => {
      const { header } = setup();

      expect(header).toHaveClass('bg-status-warning-container');
      expect(screen.getByRole('button', { name: '확인' })).toHaveClass('bg-status-warning');
    });

    it.each(VARIANTS)('%s: 헤더는 연한 색, 확인 버튼은 강한 색이다', (variant) => {
      const { header } = setup({ variant });

      expect(header).toHaveClass(`bg-status-${variant}-container`, 'text-on-surface');
      expect(screen.getByRole('button', { name: '확인' })).toHaveClass(
        `bg-status-${variant}`,
        'text-on-tertiary',
        'rounded-md',
      );
    });

    it.each(VARIANTS)('%s: 취소 버튼은 상태와 무관한 Secondary 스타일이다', (variant) => {
      setup({ variant });

      const cancel = screen.getByRole('button', { name: '취소' });
      expect(cancel).toHaveClass('bg-surface-container-high', 'text-on-surface', 'rounded-md');
      expect(cancel.className).not.toMatch(/status-/);
    });

    it('Tailwind 기본 상태색(blue/green/amber/red)을 쓰지 않는다', () => {
      for (const variant of VARIANTS) {
        const { container, unmount } = setup({ variant });

        expect(container.innerHTML).not.toMatch(/(?:text|bg|border)-(?:blue|green|amber|red)-\d+/);
        unmount();
      }
    });

    it('테두리, 순백/회색, 검정 기반 그림자를 쓰지 않는다', () => {
      const { container } = setup();

      expect(container.innerHTML).not.toMatch(/(?<![\w-])border(?![\w-])/);
      expect(container.innerHTML).not.toMatch(/(?:text|bg|border)-(?:white|gray-\d+)(?![\w-])/);
      expect(container.innerHTML).not.toMatch(/rgba\(0,\s*0,\s*0/);
    });

    it('컨테이너는 Glass와 Ambient Shadow이고 모서리는 md이다', () => {
      setup();

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveClass('bg-surface/80', 'backdrop-blur-[12px]', 'rounded-md');
      expect(dialog).not.toHaveClass('rounded-2xl');
      expect(dialog.className).toContain('rgba(43,52,55,0.06)');
    });
  });
});
