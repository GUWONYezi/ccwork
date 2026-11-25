# 이슈 6. 노트 목록 카드에 태그 개수를 표시한다 — 테스트 시나리오

> GitHub 이슈: #7 / 기준 문서: prd.md, spec-fixed.md / 선행: 이슈 1(`issue-1.md`), 이슈 5(`issue-5.md`)

## 시그니처

선언만 기록한다. 이번 이슈는 새 함수나 타입 없이 `NoteItem`의 렌더 동작만 늘어난다.

### src/components/NoteItem.tsx (수정, 표현) — NoteItemProps 변경 없음

```ts
interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export declare function NoteItem(props: NoteItemProps): ReactElement;
```

### 동작 변화 (시그니처 아님)

- `note.tags ?? []`의 길이가 1 이상이면 카드에 `태그 {개수}` 텍스트를 표시한다(예: "태그 3"). 아이콘은 쓰지 않고, 색은 `text-on-surface-variant`이다.
- 개수가 0이거나 `tags` 필드가 없으면 아무것도 표시하지 않는다.
- 개수는 `note.tags`(서버 저장값) 기준이다. `NoteEditor`의 편집 중 로컬 `tags`는 `NoteItem`에 전달되지 않으므로 미저장 편집은 반영되지 않는다.
- 저장하면 Context가 서버 응답으로 `notes`를 갱신하므로 카드의 개수가 함께 바뀐다(이슈 1, 5의 기존 동작).

### 변경되지 않는 시그니처

- `Note` 타입, `NoteList`, `NotesContext`, `api/notes.ts`, `useTagEditor`, `NoteEditor`, `App`은 이슈 1~5와 같다.

### 확정된 결정

- 개수 계산은 `NoteItem` 안에서 `note.tags ?? []`의 길이를 바로 쓴다. 한 곳에서만 쓰는 로직이라 `utils` 함수를 만들지 않는다(분리 원칙: 규칙이 둘 이상일 때만 분리).
- AC 3·4(미저장은 반영 안 됨, 저장하면 카드 개수가 바뀜)는 `App` 통합 테스트(신규 `src/App.test.tsx`, `api/notes` mock)로 검증한다. 카드(`NoteList`)와 편집기(`NoteEditor`)가 한 화면에 있어야 실제 흐름을 재현할 수 있다.
- 카드 안의 배치(날짜 옆인지, 별도 줄인지)는 시나리오로 고정하지 않는다. 스펙과 디자인 문서에 위치 지정이 없으므로 구현(Green) 단계에서 디자인 문서 기준으로 정한다. 테스트는 표시 여부, 문구, 색 클래스만 확인한다.

### 에러 케이스

- `NoteItem`은 어떤 입력에도 던지지 않는다.
- `tags` 필드가 없는 기존 노트는 에러 없이 개수 표시를 생략한다.

## 테스트 시나리오

형식: `[분류] 대상 — should 기대동작 when 조건`. 앞의 ID는 아래 AC 커버리지 표에서 참조한다.

### NoteItem (props 기반 컴포넌트)

**정상**

- [x] N1 `[정상] NoteItem — should "태그 3"을 표시 when note.tags가 3개`
- [x] N2 `[정상] NoteItem — should "태그 1"을 표시 when note.tags가 1개 (표시 기준 1 이상의 하한)`
- [x] N3 `[정상] NoteItem — should 개수 텍스트가 text-on-surface-variant 클래스를 가짐 when note.tags가 있음 (jsdom은 색을 계산하지 못하므로 클래스 존재로 검증)`
- [x] N4 `[정상] NoteItem — should 개수 표시에 아이콘(svg, img)이 없음 when note.tags가 있음`

**경계**

- [x] N5 `[경계] NoteItem — should 개수 표시가 없음 when note.tags가 빈 배열`
- [x] N6 `[경계] NoteItem — should 에러 없이 렌더하고 개수 표시가 없음 when tags 필드가 없는 기존 노트`
- [x] N7 `[경계] NoteItem — should "태그 10"을 표시 when note.tags가 10개 (이슈 4의 최대 개수)`
- [x] N8 `[경계] NoteItem — should 제목과 내용을 그대로 표시 when note.tags가 있음 (기존 표시 유지)`

### App (통합: api mock, 카드와 편집기가 한 화면)

**정상**

- [x] P1 `[정상] App — should 태그 있는 노트 카드에만 "태그 2"가 표시되고 태그 없는 노트 카드에는 없음 when 목록이 로딩됨`
- [x] P3 `[정상] App — should 카드의 개수가 갱신 when 노트를 열어 태그를 추가하고 "저장"`
- [x] P6 `[정상] App — should 새 노트 카드에 "태그 2"가 표시 when "+ 새 노트"로 태그 2개를 추가해 저장`

**경계**

- [x] P2 `[경계] App — should 카드의 개수가 그대로 when 노트를 열어 태그를 추가했지만 저장하지 않음 (미저장 편집 미반영)`
- [x] P4 `[경계] App — should 카드의 개수가 줄어듦 when 태그를 삭제하고 "저장"`
- [x] P5 `[경계] App — should 카드의 개수 표시가 사라짐 when 마지막 태그를 모두 삭제하고 "저장"`

**예외**

- [x] P7 `[예외] App — should 카드의 개수가 그대로 when 저장 중 updateNote가 reject`

## AC 커버리지

이슈 #7의 완료조건 4개와 대조한 결과이다.

| #   | AC                                                                                           | 시나리오               |
| --- | -------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | 태그가 1개 이상인 카드에 아이콘 없이 "태그 3" 형식, 회색(`text-on-surface-variant`)으로 표시 | N1, N2, N3, N4, N7, P1 |
| 2   | 태그가 없거나 `tags` 필드가 없는 노트에는 아무것도 표시하지 않음                             | N5, N6, P1, P5         |
| 3   | 개수는 서버 저장값 기준이며 편집 중인 미저장 태그는 반영하지 않음                            | P2, P7                 |
| 4   | 태그를 저장하면 Context 갱신으로 카드의 개수가 함께 바뀜                                     | P3, P4, P5, P6         |

AC 밖에서 추가한 시나리오는 기존 표시가 유지되는지 확인하는 N8, 이슈 5의 새 노트 생성 경로까지 넓힌 P6, 저장 실패 시 서버 저장값을 유지하는 P7이다. 카드 안 배치는 스펙과 디자인 문서에 지정이 없어 시나리오로 고정하지 않았고 Green 단계에서 디자인 문서 기준으로 정한다.
