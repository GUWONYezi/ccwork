import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from './Layout';

function setup() {
  const onNewNote = vi.fn();
  const view = render(
    <Layout onNewNote={onNewNote} sidebar={<p>사이드바 내용</p>} main={<p>메인 내용</p>} />,
  );
  return { onNewNote, ...view };
}

describe('Layout', () => {
  it('제목, 사이드바 슬롯, 메인 슬롯을 렌더링한다', () => {
    setup();

    expect(screen.getByRole('heading', { name: /Notes/ })).toBeInTheDocument();
    expect(screen.getByText('사이드바 내용')).toBeInTheDocument();
    expect(screen.getByText('메인 내용')).toBeInTheDocument();
  });

  it('"+ 새 노트" 버튼을 누르면 onNewNote를 호출한다', async () => {
    const { onNewNote } = setup();

    await userEvent.click(screen.getByRole('button', { name: '+ 새 노트' }));

    expect(onNewNote).toHaveBeenCalledTimes(1);
  });

  describe('디자인 시스템', () => {
    it('구분선(border-b/r/t/l, h-px)을 쓰지 않는다', () => {
      const { container } = setup();

      expect(container.innerHTML).not.toMatch(/(?<![\w-])border-[brtl](?![\w-])/);
      expect(container.innerHTML).not.toMatch(/(?<![\w-])h-px(?![\w-])/);
    });

    it('이모지와 Boogaloo 폰트를 쓰지 않는다', () => {
      const { container } = setup();

      expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(container.innerHTML).not.toContain('Boogaloo');
    });

    it('검정 기반 그림자를 쓰지 않는다', () => {
      const { container } = setup();

      expect(container.innerHTML).not.toMatch(/rgba\(0,\s*0,\s*0/);
    });

    it('새 노트 버튼은 Primary 그라데이션 스타일이다', () => {
      setup();

      const button = screen.getByRole('button', { name: '+ 새 노트' });
      expect(button).toHaveClass('bg-linear-to-br', 'from-tertiary', 'to-tertiary-container');
      expect(button).toHaveClass('rounded-md');
    });
  });
});
