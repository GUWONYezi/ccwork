import type { ReactElement } from 'react';
import { Tag } from './Tag';

interface TagListProps {
  tags: string[];
  onDelete: (index: number) => void; // Tag의 onDelete를 () => onDelete(index)로 연결
}

export function TagList({ tags, onDelete }: TagListProps): ReactElement | null {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Tag key={`${tag}-${index}`} label={tag} onDelete={() => onDelete(index)} />
      ))}
    </div>
  );
}
