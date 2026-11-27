import type { ReactElement } from 'react';
import { Tag } from './Tag';

interface TagListProps {
  tags: string[];
  onDelete?: (index: number) => void; // Tag의 onDelete를 () => onDelete(index)로 연결. 생략하면 모든 Tag가 읽기 전용
}

export function TagList({ tags, onDelete }: TagListProps): ReactElement | null {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Tag key={`${tag}-${index}`} label={tag} onDelete={onDelete && (() => onDelete(index))} />
      ))}
    </div>
  );
}
