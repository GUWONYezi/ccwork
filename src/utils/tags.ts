export interface TagValidationResult {
  canAdd: boolean; // 추가 가능 여부
  tag: string; // trim된 값
  message: string | null; // 안내 문구. 중복/길이 초과/개수 초과로 거절될 때만 값이 있다
}

const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 10;

export function validateTag(input: string, existing: string[]): TagValidationResult {
  const tag = input.trim();
  if (tag === '') return { canAdd: false, tag, message: null };

  const lowerTag = tag.toLowerCase();
  if (existing.some((item) => item.toLowerCase() === lowerTag)) {
    return { canAdd: false, tag, message: '이미 있는 태그입니다' };
  }

  if (tag.length > MAX_TAG_LENGTH) {
    return { canAdd: false, tag, message: '태그는 최대 50자까지 입력할 수 있습니다' };
  }

  if (existing.length >= MAX_TAGS) {
    return { canAdd: false, tag, message: '태그는 최대 10개까지 추가할 수 있습니다' };
  }

  return { canAdd: true, tag, message: null };
}
