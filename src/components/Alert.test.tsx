import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert, type AlertVariant } from './Alert';

const VARIANTS: AlertVariant[] = ['info', 'success', 'warning', 'error'];

function setup(variant?: AlertVariant) {
  const onClose = vi.fn();
  const view = render(
    <Alert variant={variant} title="알림 제목" onClose={onClose}>
      알림 내용
    </Alert>,
  );
  const header = screen.getByRole('heading', { name: '알림 제목' }).parentElement as HTMLElement;
  return { onClose, header, ...view };
}

describe('Alert', () => {
  it('role="alert"로 제목과 내용을 보여준다', () => {
    setup();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '알림 제목' })).toBeInTheDocument();
    expect(screen.getByText('알림 내용')).toBeInTheDocument();
  });

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const { onClose } = setup();

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('디자인 시스템', () => {
    it('variant를 생략하면 info 헤더 색을 쓴다', () => {
      const { header } = setup();

      expect(header).toHaveClass('bg-status-info-container');
    });

    it.each(VARIANTS)('%s 헤더는 연한 status 색 배경에 on_surface 글자이다', (variant) => {
      const { header } = setup(variant);

      expect(header).toHaveClass(`bg-status-${variant}-container`, 'text-on-surface');
      expect(header).not.toHaveClass('text-white');
    });

    it('Tailwind 기본 상태색(blue/green/amber/red)을 쓰지 않는다', () => {
      for (const variant of VARIANTS) {
        const { container, unmount } = setup(variant);

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

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-surface/80', 'backdrop-blur-[12px]', 'rounded-md');
      expect(alert).not.toHaveClass('rounded-2xl');
      expect(alert.className).toContain('rgba(43,52,55,0.06)');
    });

    it('본문 글자는 on_surface이다', () => {
      setup();

      expect(screen.getByText('알림 내용')).toHaveClass('text-on-surface');
    });
  });
});
