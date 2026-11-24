# 이슈 3. 중복 태그를 막는다 — 테스트 시나리오

> GitHub 이슈: #4 / 기준 문서: prd.md, spec-fixed.md / 선행: 이슈 1(`issue-1.md`), 이슈 2(`issue-2.md`)

## 시그니처

선언만 기록한다. 이슈 1·2의 시그니처 중 변경되는 부분만 적는다.

### src/utils/tags.ts (수정, 규칙)

```ts
export interface TagValidationResult {
  canAdd: boolean;
  tag: string; // trim된 값(입력 표기 그대로, 소문자로 바꾸지 않는다)
  message: string | null; // 중복이면 '이미 있는 태그입니다', 그 외 null
}

// existing을 이제 사용한다. trim + 대소문자 무시로 비교한다
export declare function validateTag(input: string, existing: string[]): TagValidationResult;
```

### src/hooks/useTagEditor.ts (수정, 상태)

```ts
export interface UseTagEditorResult {
  // ...이슈 1·2와 동일
  errorMessage: string | null; // 신규. 안내 문구
}
```

### src/components/TagInput.tsx (수정, 표현)

```ts
interface TagInputProps {
  // ...이슈 1과 동일
  errorMessage: string | null; // 신규. 입력창 아래에 표시. 필수 prop
}
```

`NoteEditor`는 `TagInput`에 `errorMessage={errorMessage}`만 연결한다.

### 동작 변화 (시그니처 아님)

- `addTag`: 거절되면 `errorMessage`에 `result.message`를 넣고 `tags`와 `inputValue`는 유지한다. 성공하면 `errorMessage`를 null로 만든다.
- `changeInput`: 호출 시 `errorMessage`를 null로 만든다.
- `reset`: `errorMessage`도 null로 만든다.
- `toggleInput`: `errorMessage`를 바꾸지 않는다. 입력창을 닫았다 다시 열면 문구가 다시 보인다.
- `TagInput`: 입력창이 열려 있고(`isOpen`) `errorMessage`가 있을 때만 입력창 아래에 `role="alert"`로 문구를 표시한다.

### 변경되지 않는 시그니처

- `Tag`, `TagList`, `removeTag`, `NoteEditorProps`, `api.updateNote`, `NotesContext.updateNote`는 이슈 1·2와 같다.

### 확정된 결정

- `errorMessage` prop은 필수(`string | null`)다. 기존 `TagInput.test.tsx`는 Red 단계에서 갱신한다.
- 안내 문구는 입력창이 열려 있을 때만 표시한다. 상태(`errorMessage`)는 입력창을 닫아도 유지된다.
- 안내 문구에 `role="alert"`를 준다. 색은 구현 단계에서 `docs/design-system/components/alert-confirm.md`를 보고 정한다.

### 에러 케이스

- `validateTag`가 중복을 만나면 던지지 않고 `{ canAdd: false, tag: 트림값, message: '이미 있는 태그입니다' }`를 반환한다.
- 빈 값 또는 공백만 입력 → 이슈 1과 같이 `{ canAdd: false, tag: '', message: null }`이다. 이때 `errorMessage`는 바뀌지 않는다.
- `existing`이 빈 배열이어도 던지지 않는다. `validateTag`는 어떤 입력에도 던지지 않는다.
- `NoteEditor` 저장 실패, 제목 비어 있음 → 이슈 1과 같다.

## 테스트 시나리오

형식: `[분류] 대상 — should 기대동작 when 조건`. 앞의 ID는 아래 AC 커버리지 표에서 참조한다.

### validateTag (단위)

**정상**

- [x] V1 `[정상] validateTag — should canAdd true, message null을 반환 when 중복이 아닌 입력('vue', existing ['react'])`
- [x] V2 `[정상] validateTag — should canAdd false, message '이미 있는 태그입니다'를 반환 when 완전히 같은 태그('react', existing ['react'])`

**경계**

- [x] V3 `[경계] validateTag — should 중복으로 거절 when 대소문자만 다름('React', existing ['react'])`
- [x] V4 `[경계] validateTag — should 중복으로 거절 when existing 쪽이 대문자('react', existing ['React'])`
- [x] V5 `[경계] validateTag — should 중복으로 거절하고 tag는 trim된 값을 반환 when 앞뒤 공백이 있는 중복 입력('  react  ')`
- [x] V6 `[경계] validateTag — should 소문자로 바꾸지 않고 trim된 입력 표기를 tag로 반환 when 중복이 아닌 'React'`
- [x] V7 `[경계] validateTag — should canAdd true when existing이 빈 배열`
- [x] V8 `[경계] validateTag — should 중복이 아니라고 판정 when 부분 일치('reac', existing ['react'])`
- [x] V9 `[경계] validateTag — should canAdd false, tag '', message null을 반환 when 빈 값이고 existing에 태그가 있음`

**예외**

- [x] V10 `[예외] validateTag — should 던지지 않고 결과 객체를 반환 when 중복 입력`

### useTagEditor (renderHook)

**정상**

- [x] H1 `[정상] useTagEditor — should errorMessage가 null로 시작 when 마운트`
- [x] H2 `[정상] addTag — should tags를 바꾸지 않고 errorMessage를 '이미 있는 태그입니다'로 when 이미 있는 'react'를 입력`
- [x] H3 `[정상] addTag — should 중복으로 거절 when 대소문자만 다른 'React' (기존 'react')`

**경계**

- [x] H4 `[경계] addTag — should inputValue를 비우지 않고 유지 when 중복으로 거절`
- [x] H5 `[경계] addTag — should 처음 입력한 표기를 유지(tags ['React']) when 'React' 뒤에 'react' 입력`
- [x] H6 `[경계] changeInput — should errorMessage를 null로 when 안내 문구가 있는 상태에서 값을 변경`
- [x] H7 `[경계] addTag — should errorMessage를 유지 when 거절 직후 값을 수정하지 않고 다시 addTag`
- [x] H8 `[경계] addTag — should errorMessage를 바꾸지 않음 when 빈 값 입력(문구 없음/있음 모두)`
- [x] H9 `[경계] reset — should errorMessage를 null로 when 안내 문구가 있는 상태에서 호출`
- [x] H10 `[경계] toggleInput — should errorMessage를 유지 when 문구가 있는 상태에서 입력창을 닫음`
- [x] H11 `[경계] addTag — should 다시 추가할 수 있음 when 'react'를 removeTag로 삭제한 뒤 'react'를 입력 (existing은 현재 tags 기준)`
- [x] H12 `[경계] addTag — should errorMessage를 null로 when 중복으로 거절된 뒤 해당 태그를 removeTag로 삭제하고 같은 입력값으로 다시 addTag`

### TagInput (props 기반 컴포넌트)

**정상**

- [x] I1 `[정상] TagInput — should 안내 문구를 표시 when isOpen true이고 errorMessage가 '이미 있는 태그입니다'`
- [x] I2 `[정상] TagInput — should 문구를 입력창 아래에 표시 when errorMessage가 있음 (DOM 순서)`
- [x] I3 `[정상] TagInput — should 문구가 role alert를 가짐 when errorMessage가 있음`

**경계**

- [x] I4 `[경계] TagInput — should alert를 렌더하지 않음 when errorMessage가 null`
- [x] I5 `[경계] TagInput — should 문구를 표시하지 않음 when isOpen false이고 errorMessage가 있음`
- [x] I6 `[경계] TagInput — should 입력창 값을 그대로 유지 when errorMessage가 있음`

### NoteEditor (통합: api mock 또는 NotesProvider)

**정상**

- [x] E1 `[정상] NoteEditor — should 태그가 하나만 남고 입력창 아래에 "이미 있는 태그입니다"를 표시 when 이미 있는 태그를 입력하고 Enter`
- [x] E2 `[정상] NoteEditor — should 추가하지 않고 문구를 표시 when 대소문자만 다른 태그를 입력하고 Enter`
- [x] E3 `[정상] NoteEditor — should 'React'가 유지되고 updateNote가 tags ['React']로 호출 when 'React' 뒤에 'react'를 입력하고 저장`
- [x] E4 `[정상] NoteEditor — should 문구가 사라지고 태그가 추가됨 when 거절 후 입력값을 수정해 다시 Enter`

**경계**

- [x] E5 `[경계] NoteEditor — should 입력창 값을 비우지 않음 when 중복으로 거절`
- [x] E6 `[경계] NoteEditor — should 안내 문구가 사라짐 when 문구가 표시된 상태에서 입력창에 타이핑`
- [x] E7 `[경계] NoteEditor — should 안내 문구가 표시되지 않음 when 중복 거절 상태에서 다른 노트를 갔다가 돌아와 입력창을 다시 엶`
- [x] E8 `[경계] NoteEditor — should 문구가 다시 보임 when 중복 거절 후 입력창을 "닫기"로 닫았다가 다시 엶`

## AC 커버리지

이슈 #4의 완료조건 6개와 대조한 결과이다.

| #   | AC                                                                   | 시나리오                  |
| --- | -------------------------------------------------------------------- | ------------------------- |
| 1   | trim 후 대소문자를 무시하고 비교해 이미 있는 태그면 추가되지 않는다  | V2~V5, V8, H2, H3, E1, E2 |
| 2   | 중복이면 입력창 아래에 "이미 있는 태그입니다"를 표시한다             | V2, I1~I3, E1             |
| 3   | 저장되는 표기는 처음 입력한 것 그대로다                              | V6, H5, E3                |
| 4   | 노트 전환 시 안내 문구가 초기화된다                                  | H9, E7                    |
| 5   | 중복으로 거절되면 입력창의 값은 비워지지 않고 유지된다               | H4, I6, E5                |
| 6   | 안내 문구는 `changeInput` 시점에 사라지고, 그 전까지는 계속 표시된다 | H6, H7, H12, E4, E6       |

AC 밖에서 추가한 시나리오는 V1, V7, V9, V10(순수 함수 경계/예외), H1, H8, H10, H11, I4, I5, E8이다. H12는 AC 검증(`ac-verifier`) 후 추가했다. 중복 거절 뒤 태그를 삭제하고 Enter를 누르면 `changeInput`을 거치지 않으므로 `addTag` 성공 경로가 문구를 지워야 한다. `addTag` 성공 시 `errorMessage`를 null로 만드는 동작은 처음에는 `changeInput`이 먼저 문구를 지운다고 보고 시나리오에서 뺐으나, 삭제 후 재시도 경로에서는 필요해서 H12로 추가했다.
