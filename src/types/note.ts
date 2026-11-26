export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  deletedAt?: string | null; // 값이 있으면 휴지통 노트
}
