import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarFooter } from './SidebarFooter';

describe('SidebarFooter', () => {
  it('should `onOpenTrash`를 호출 when `aria-label="휴지통"` 버튼 클릭', async () => {
    const user = userEvent.setup();
    const onOpenTrash = vi.fn();
    render(<SidebarFooter onOpenTrash={onOpenTrash} />);

    await user.click(screen.getByRole('button', { name: '휴지통' }));

    expect(onOpenTrash).toHaveBeenCalledTimes(1);
  });
});
