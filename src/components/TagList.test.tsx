import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagList } from './TagList';

describe('TagList', () => {
  // 이슈 1
  it("should 모든 태그를 전달된 순서대로 표시 when tags가 ['react', 'design']", () => {
    render(<TagList tags={['react', 'design']} onDelete={() => {}} />);

    const react = screen.getByText('react');
    const design = screen.getByText('design');
    expect(react.compareDocumentPosition(design) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // 이슈 1
  it('should flex-wrap 컨테이너 안에 표시 when 태그가 여러 개', () => {
    render(<TagList tags={['react', 'design']} onDelete={() => {}} />);

    expect(screen.getByText('react').closest('.flex-wrap')).not.toBeNull();
    expect(screen.getByText('design').closest('.flex-wrap')).not.toBeNull();
  });

  // 이슈 1 (이슈 2 TL4와 동일한 동작)
  it('should 아무것도 렌더하지 않음 when tags가 빈 배열', () => {
    const { container } = render(<TagList tags={[]} onDelete={() => {}} />);

    expect(container).toBeEmptyDOMElement();
  });

  // TL1
  it("should 각 태그에 삭제 버튼을 표시 when tags가 ['react', 'design']", () => {
    render(<TagList tags={['react', 'design']} onDelete={() => {}} />);

    expect(screen.getByRole('button', { name: 'react 태그 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'design 태그 삭제' })).toBeInTheDocument();
  });

  // TL2
  it('should onDelete에 해당 태그의 인덱스를 전달 when 두 번째 태그의 삭제 버튼을 클릭 (1)', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TagList tags={['react', 'design']} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'design 태그 삭제' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  // TL3
  // 회귀 테스트: 기존 TagList의 flex-wrap 컨테이너가 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should flex-wrap 컨테이너 안에 표시 when 50자 태그가 여러 개 (가로 스크롤 유발 클래스 없음)', () => {
    const tags = ['a'.repeat(50), 'b'.repeat(50), 'c'.repeat(50)];
    render(<TagList tags={tags} onDelete={() => {}} />);

    const container = screen.getByText(tags[0]).closest('.flex-wrap');
    expect(container).not.toBeNull();
    expect(container!.className).not.toMatch(
      /overflow-x-(auto|scroll)|whitespace-nowrap|flex-nowrap/,
    );
    tags.forEach((tag) => {
      expect(screen.getByText(tag).closest('.flex-wrap')).toBe(container);
    });
  });

  // TL5
  it("should 중복 태그도 각자 자기 인덱스를 전달 when tags가 ['a', 'a']에서 두 번째 삭제", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TagList tags={['a', 'a']} onDelete={onDelete} />);

    await user.click(screen.getAllByRole('button', { name: 'a 태그 삭제' })[1]);

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  // L1
  it('should 모든 태그를 삭제 버튼 없이 표시 when onDelete를 넘기지 않음', () => {
    render(<TagList tags={['react', 'design']} />);

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
