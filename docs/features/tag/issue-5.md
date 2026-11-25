# 이슈 5. 새 노트 작성 중에도 태그를 추가한다 — 테스트 시나리오

> GitHub 이슈: #6 / 기준 문서: prd.md, spec-fixed.md / 선행: 이슈 1(`issue-1.md`), 이슈 2(`issue-2.md`), 이슈 3(`issue-3.md`), 이슈 4(`issue-4.md`)

## 시그니처

선언만 기록한다. 이슈 1~4의 시그니처 중 변경되는 부분만 적는다.

### src/context/NotesContext.tsx (수정, 상태)

```ts
interface NotesContextType {
  // ...기존과 동일
  createNote: (title: string, content: string, tags?: string[]) => Promise<void>; // tags 생략 시 []로 생성
}
```

### src/api/notes.ts (시그니처 변경 없음)

```ts
export declare function createNote(
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Note>; // note에 tags가 있으면 그대로 POST body에 포함된다
```

### src/components/NoteEditor.tsx (조립, NoteEditorProps 변경 없음)

```ts
interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}
```

### 동작 변화 (시그니처 아님)

- `NoteEditor`: 생성 모드에서도 `TagInput`과 `TagList`를 표시한다(`!isCreating` 조건 제거).
- `NoteEditor`: 생성 경로가 `createNote(title, content, tags)`를 호출한다.
- `NoteEditor`: `isCreating`으로 전환될 때 `title`, `content`와 함께 `reset([])`을 호출해 태그, 입력창, 입력값, 안내 문구를 리셋한다.
- `NotesContext.createNote`: `tags`가 없으면 `[]`로 `api.createNote`를 호출하고, 응답은 기존처럼 `[...prev, newNote]`로 추가한다(재조회 없음).

### 변경되지 않는 시그니처

- `useTagEditor`, `validateTag`, `TagInput`, `TagList`, `Tag`, `api.updateNote`, `NotesContext.updateNote`, `App`은 이슈 1~4와 같다.
- `App`은 생성 모드에서도 `NoteEditor`가 `useTagEditor`로 태그를 직접 관리하므로 바꾸지 않는다.

### 확정된 결정

- `createNote`의 `tags`는 선택 세 번째 인자이고, 생략 시 `[]`로 보낸다. 기본값 규칙은 `NotesContext`에 둔다(`api.createNote`는 받은 값을 그대로 보낸다).
- "새 노트를 다시 시작하면 리셋"은 `isCreating`이 바뀌는 경로(작성 중 → 다른 노트 선택 → 다시 "+ 새 노트")만 대상으로 한다. 이미 작성 중에 "+ 새 노트"를 연속으로 누르는 경우는 `App` 상태가 변하지 않아 범위 밖이다(기존에도 `title`, `content`가 리셋되지 않는다).

### 에러 케이스

- `api.createNote`가 `!res.ok`이면 `Error('Failed to create note')`를 던진다(기존과 동일).
- `NotesContext.createNote`는 에러를 그대로 전파하고 로컬 `notes`를 바꾸지 않는다.
- `NoteEditor` 저장 실패 시 `console.error`로 처리하고, 작성 중이던 `tags`를 유지하며 `onDone`을 호출하지 않는다.
- 제목이 비어 있으면 `createNote`를 호출하지 않는다(기존과 동일).

## 테스트 시나리오

형식: `[분류] 대상 — should 기대동작 when 조건`. 앞의 ID는 아래 AC 커버리지 표에서 참조한다.

### api.createNote (단위, fetch mock)

**정상**

- [x] A1 `[정상] createNote — should POST body에 tags ['react']를 포함 when note에 tags ['react']가 있음`

**경계**

- [x] A2 `[경계] createNote — should POST body에 tags: []를 포함 when note.tags가 빈 배열`
- [x] A3 `[경계] createNote — should body에 tags를 넣지 않음(기본값을 채우지 않음) when note에 tags가 없음`

### NotesContext.createNote (Provider + api mock)

**정상**

- [x] C1 `[정상] createNote — should api.createNote를 { title, content, tags: ['react'] }로 호출 when createNote('제목', '내용', ['react'])`
- [x] C2 `[정상] createNote — should 서버 응답의 노트(tags 포함)를 notes 끝에 추가 when 생성 성공`

**경계**

- [x] C3 `[경계] createNote — should api.createNote를 tags: []로 호출 when tags 인자를 생략`

**예외**

- [x] C4 `[예외] createNote — should notes를 바꾸지 않고 에러를 전파 when api.createNote가 reject`

### NoteEditor (통합: api mock 또는 NotesProvider, isCreating)

**정상**

- [x] E1 `[정상] NoteEditor — should "태그 추가" 버튼을 표시 when 새 노트 작성 모드(isCreating)`
- [x] E2 `[정상] NoteEditor — should 입력창을 열고 버튼명을 "닫기"로 바꿨다가, 다시 "닫기"를 누르면 닫음 when 새 노트 작성 모드에서 "태그 추가"를 클릭`
- [x] E3 `[정상] NoteEditor — should trim된 태그를 목록에 표시하고 입력창을 비움 when 새 노트 작성 모드에서 입력창에 입력하고 Enter`
- [x] E4 `[정상] NoteEditor — should createNote를 (제목, 내용, ['react'])로 호출 when 제목과 내용을 입력하고 태그 react를 추가한 뒤 "저장"`
- [x] E5 `[정상] NoteEditor — should createNote를 (제목, 내용, [])로 호출 when 태그를 추가하지 않고 "저장"`
- [x] E6 `[정상] NoteEditor — should 저장한 태그를 표시 when 생성 후 목록에 나타난 새 노트를 선택`

**경계**

- [x] E7 `[경계] NoteEditor — should 태그가 추가되지 않고 "이미 있는 태그입니다"를 표시 when 새 노트 작성 모드에서 같은 태그를 두 번 입력`
- [x] E8 `[경계] NoteEditor — should 확인창 없이 작성 중이던 태그가 사라지고 선택한 노트의 저장된 태그만 표시 when 새 노트 작성 중 태그를 추가한 뒤 기존 노트를 선택`
- [x] E9 `[경계] NoteEditor — should 입력창이 닫히고 입력 중이던 텍스트가 초기화 when 새 노트 작성 중 입력창에 타이핑한 뒤 기존 노트를 선택했다가 다시 새 노트를 시작`
- [x] E10 `[경계] NoteEditor — should 안내 문구가 사라짐 when 새 노트 작성 중 안내 문구가 표시된 상태에서 기존 노트를 선택했다가 다시 새 노트를 시작`
- [x] E11 `[경계] NoteEditor — should 이전 작성 태그가 남지 않고 태그 목록이 비어 있음 when 새 노트 작성 중 태그를 추가한 뒤 기존 노트를 선택했다가 다시 새 노트를 시작`
- [x] E12 `[경계] NoteEditor — should 태그 없이 시작 when 새 노트를 저장해 작성을 마친 뒤(onDone) 다시 새 노트를 시작`
- [x] E13 `[경계] NoteEditor — should createNote를 호출하지 않음 when 새 노트 작성 중 태그만 추가하고 제목이 비어 있음`

**예외**

- [x] E14 `[예외] NoteEditor — should 작성 중인 tags를 유지하고 onDone을 호출하지 않음 when 새 노트 저장 중 createNote가 reject`

## AC 커버리지

이슈 #6의 완료조건 5개와 대조한 결과이다.

| #   | AC                                                                                                  | 시나리오         |
| --- | --------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | 새 노트 작성 화면에서 이슈 1의 태그 입력 동작(열기/닫기, Enter로 추가, 목록 표시)이 그대로 동작한다 | E1, E2, E3       |
| 2   | "저장" 시 POST 페이로드에 `title`, `content`, `tags`가 포함된다                                     | A1, C1, E4       |
| 3   | 태그를 추가하지 않으면 `tags: []`를 보낸다                                                          | A2, C3, E5       |
| 4   | 생성 후 목록에 나타난 노트를 열면 저장한 태그가 표시된다                                            | C2, E6           |
| 5   | 작성 중 다른 노트를 선택하거나 새 노트를 다시 시작하면 태그와 입력창 상태가 리셋된다                | E8, E9, E10, E11 |

AC 밖에서 추가한 시나리오는 `api`가 기본값을 채우지 않는다는 결정을 고정하는 A3, 생성 실패 예외 경로인 C4·E14, 생성 모드의 중복 검사 연결을 확인하는 E7, 작성을 마친 뒤 다음 새 노트에 태그가 남지 않는지 확인하는 E12, 제목이 비어 있을 때 생성하지 않는 기존 동작을 확인하는 E13이다. `NoteEditor`의 생성 모드 태그 삭제는 이슈 2의 동일 로직이라 만들지 않았다.
