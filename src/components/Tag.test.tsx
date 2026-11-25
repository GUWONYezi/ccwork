import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from './Tag';

describe('Tag', () => {
  // T1
  it("should label 텍스트를 표시 when label이 'react'", () => {
    render(<Tag label="react" onDelete={() => {}} />);

    expect(screen.getByText('react')).toBeInTheDocument();
  });

  // T2
  it('should 삭제 버튼을 DOM에 렌더 when 항상 (표시 여부와 무관)', () => {
    render(<Tag label="react" onDelete={() => {}} />);

    expect(screen.getByRole('button', { name: 'react 태그 삭제' })).toBeInTheDocument();
  });

  // T3
  it('should 삭제 버튼에 aria-label "react 태그 삭제"를 가짐 when label이 \'react\'', () => {
    render(<Tag label="react" onDelete={() => {}} />);

    expect(screen.getByLabelText('react 태그 삭제')).toBeInTheDocument();
  });

  // T4
  it('should onDelete를 한 번 호출 when 삭제 버튼을 클릭', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<Tag label="react" onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'react 태그 삭제' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  // T5
  it('should 삭제 버튼이 평소 투명하고 group-hover·focus 때 보이는 클래스를 가짐 when 렌더', () => {
    render(<Tag label="react" onDelete={() => {}} />);

    const button = screen.getByRole('button', { name: 'react 태그 삭제' });
    expect(button).toHaveClass('opacity-0');
    expect(button).toHaveClass('group-hover:opacity-100');
    expect(button).toHaveClass('focus:opacity-100');
  });

  // T6
  it('should title 속성에 전체 label을 가짐 when 렌더', () => {
    render(<Tag label="react" onDelete={() => {}} />);

    expect(screen.getByTitle('react')).toBeInTheDocument();
  });

  // T7
  it('should 최대 너비 제한 클래스와 라벨에 truncate 클래스를 가짐 when 렌더', () => {
    render(<Tag label="react" onDelete={() => {}} />);

    expect(screen.getByText('react')).toHaveClass('truncate');
    expect(screen.getByText('react').closest('[class*="max-w-"]')).not.toBeNull();
  });

  // T8
  it('should 라벨이 50자여도 삭제 버튼이 라벨 밖 영역에 렌더되어 잘리지 않음 when label이 50자 문자열 (라벨만 truncate, 버튼은 shrink-0)', () => {
    const label = 'a'.repeat(50);
    render(<Tag label={label} onDelete={() => {}} />);

    const button = screen.getByRole('button', { name: `${label} 태그 삭제` });
    const labelEl = screen.getByText(label);
    expect(labelEl.contains(button)).toBe(false);
    expect(button.closest('.truncate')).toBeNull();
    expect(button).toHaveClass('shrink-0');
  });

  // T9
  // 회귀 테스트: 현재 onDelete 연결이 없어 호출되지 않는 동작이라 Red 단계에서도 통과한다.
  it('should 클릭해도 onDelete 외의 동작을 하지 않음 when 라벨 영역을 클릭', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<Tag label="react" onDelete={onDelete} />);

    await user.click(screen.getByText('react'));

    expect(onDelete).not.toHaveBeenCalled();
  });
});
