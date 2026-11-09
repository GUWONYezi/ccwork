import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DialogOverlay } from './DialogOverlay';

describe('DialogOverlay', () => {
  it('자식을 렌더링한다', () => {
    render(
      <DialogOverlay>
        <p>대화상자 내용</p>
      </DialogOverlay>,
    );

    expect(screen.getByText('대화상자 내용')).toBeInTheDocument();
  });

  it('화면 전체를 덮고 자식을 가운데에 놓는다', () => {
    render(
      <DialogOverlay>
        <p>내용</p>
      </DialogOverlay>,
    );

    const overlay = screen.getByText('내용').parentElement as HTMLElement;
    expect(overlay).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-center',
      'justify-center',
    );
  });

  describe('디자인 시스템', () => {
    it('배경 막은 순수 검정이 아니라 on_surface 투명 틴트이다', () => {
      const { container } = render(
        <DialogOverlay>
          <p>내용</p>
        </DialogOverlay>,
      );

      expect(container.firstElementChild).toHaveClass('bg-on-surface/20');
      expect(container.innerHTML).not.toMatch(/bg-black|rgba\(0,\s*0,\s*0|#000/);
    });

    it('테두리를 쓰지 않는다', () => {
      const { container } = render(
        <DialogOverlay>
          <p>내용</p>
        </DialogOverlay>,
      );

      expect(container.innerHTML).not.toMatch(/(?<![\w-])border(?![\w-])/);
    });
  });
});
