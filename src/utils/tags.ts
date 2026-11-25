export interface TagValidationResult {
  canAdd: boolean; // 추가 가능 여부
  tag: string; // trim된 값
  message: string | null; // 안내 문구. 중복이면 '이미 있는 태그입니다'
}

export function validateTag(input: string, existing: string[]): TagValidationResult {
  const tag = input.trim();
  if (tag === '') return { canAdd: false, tag, message: null };

  const lowerTag = tag.toLowerCase();
  if (existing.some((item) => item.toLowerCase() === lowerTag)) {
    return { canAdd: false, tag, message: '이미 있는 태그입니다' };
  }

  return { canAdd: true, tag, message: null };
}
