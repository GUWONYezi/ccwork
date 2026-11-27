# 이슈 2. 휴지통 노트를 읽기 전용으로 미리 보고 새 노트를 작성한다 — 테스트 시나리오

> GitHub 이슈: #10 / 기준 문서: prd.md, spec-fixed.md

## 시그니처

선언만 기록한다. 구현은 TDD에서 테스트를 먼저 쓴 뒤 작성한다.

### src/components/NotePreview.tsx (신규, 표현)

```ts
interface NotePreviewProps {
  note: Note | null; // null이면 "선택 안내" 문구를 표시
}

export declare function NotePreview({ note }: NotePreviewProps): JSX.Element;
// input/textarea/버튼 없이 제목과 내용만 렌더링 (읽기 전용)
// 빈 값은 '(제목 없음)', '(내용 없음)' 표시 (NoteItem과 동일)
```

### src/components/TrashList.tsx (수정, 표현)

```ts
interface TrashListProps {
  notes: Note[]; // 이미 정렬된 휴지통 노트
  selectedId: string | null; // 신규. 선택된 항목 강조용
  onSelect: (id: string) => void; // 신규. 항목 클릭 시 호출
  onBack: () => void;
}
// 기존 TrashList.test.tsx의 render 호출에는 selectedId, onSelect를 추가해야 한다 (Red 단계에서 반영)
```

### src/App.tsx (수정, 조립)

```ts
// 신규 상태: selectedTrashId: string | null
handleSelectTrash(id: string): void; // selectedTrashId = id
handleCloseTrash(): void; // 기존 + selectedTrashId = null
handleNewNote(): void; // 기존 + sidebarView = 'notes', selectedTrashId = null

// 신규 내부 컴포넌트 (기존 TrashSidebar와 같은 방식으로 useNotes 연결)
interface TrashPreviewProps {
  selectedTrashId: string | null;
}
function TrashPreview({ selectedTrashId }: TrashPreviewProps): JSX.Element;
// trashedNotes.find(id) ?? null 을 NotePreview에 전달

// main 슬롯: sidebarView === 'trash' ? <TrashPreview /> : <NoteEditor />
```

#### 에러 케이스

- 이 이슈에는 `throw`와 서버 호출이 없다. 에러 케이스는 없다.
- `selectedTrashId`가 `trashedNotes`에 없으면 `null`로 취급해 `NotePreview`가 선택 안내 문구를 보여준다 (결과값 처리, 에러 아님).

## 테스트 시나리오

### 정상

- [x] P1 `[정상] NotePreview — should 제목과 내용을 표시 when note가 주어짐`
- [x] P2 `[정상] NotePreview — should 입력창/저장 버튼 없이 읽기 전용으로 렌더링 when note가 주어짐`
- [x] T1 `[정상] TrashList — should onSelect를 해당 id로 호출 when 항목 클릭`
- [x] T2 `[정상] TrashList — should 해당 항목을 선택 상태로 강조 when selectedId가 노트 id와 일치`
- [x] A1 `[정상] App — should 메인 영역에 해당 노트의 제목과 내용을 표시하고 그 항목을 강조 when 휴지통 뷰에서 항목 클릭`
- [x] A2 `[정상] App — should 메인 영역이 일반 NoteEditor로 돌아감 when 노트를 미리보기 중 "목록으로 돌아가기" 클릭`
- [x] A3 `[정상] App — should 사이드바가 일반 목록으로 전환되고 빈 NoteEditor가 생성 모드로 열림 when 휴지통 뷰에서 헤더 "+ 새 노트" 클릭`
- [x] A4 `[정상] App — should 미리보기가 사라지고 휴지통 선택이 해제됨 when 노트를 미리보기 중 "+ 새 노트" 클릭`
- [x] A5 `[정상] App — should 새 노트가 일반 목록에 나타나고 휴지통에는 나타나지 않음 when 휴지통 뷰에서 "+ 새 노트"로 새 노트를 저장`
- [x] A6 `[정상] App — should 선택 안내 문구가 표시됨(이전 선택이 해제됨) when 미리보기 후 일반 목록으로 돌아갔다가 휴지통을 다시 연 경우`

### 경계

- [x] P3 `[경계] NotePreview — should "(제목 없음)"을 표시 when title이 빈 문자열`
- [x] P4 `[경계] NotePreview — should "(내용 없음)"을 표시 when content가 빈 문자열`
- [x] P5 `[경계] NotePreview — should 선택 안내 문구를 표시하고 제목/내용 영역은 없음 when note가 null`
- [x] T3 `[경계] TrashList — should 어떤 항목도 강조하지 않음 when selectedId가 null이고, id 지정 후 다시 null로 바뀜`
- [x] T4 `[경계] TrashList — should 어떤 항목도 강조하지 않고 에러가 나지 않음 when selectedId가 notes에 없는 id`
- [x] A7 `[경계] App — should 메인 영역에 선택 안내 문구를 표시 when 휴지통 뷰를 열었고 아직 선택한 노트가 없음`
- [x] A8 `[경계] App — should 미리보기가 새로 선택한 노트로 교체되고 강조도 옮겨감 when 미리보기 중 다른 휴지통 항목 클릭`
- [x] A10 `[경계] App 미리보기 — should 메인에 "(제목 없음)"과 "(내용 없음)"이 표시되고 에러가 없음 when 제목/내용이 빈 휴지통 노트를 선택`
- [x] A11 `[경계] App — should 이전 일반 목록 선택/생성 상태가 에디터에 남지 않음 when 노트 선택 후 휴지통을 열었다가 "+ 새 노트" 클릭`

### 예외

해당 없음. 이 이슈에는 `throw`와 서버 호출이 없다(시그니처 에러 케이스 참고). 미선택이나 없는 id는 P5, T4에서 결과값 처리로 검증한다.

## AC 커버리지

| AC                                                                     | 시나리오           |
| ---------------------------------------------------------------------- | ------------------ |
| 항목 클릭 → 메인에 제목/내용 표시 + 항목 강조                          | P1, T1, T2, A1, A8 |
| 미리보기는 입력창/저장 버튼 없이 읽기 전용                             | P2                 |
| 선택이 없으면 메인은 비어 있거나 안내 문구                             | P5, T3, A7         |
| 일반 목록으로 돌아가면 `NoteEditor` 복귀, 휴지통 선택 해제             | A2, A6             |
| 제목/내용이 빈 노트는 `(제목 없음)`, `(내용 없음)`                     | P3, P4, A10        |
| 휴지통 뷰에서 "+ 새 노트" → 일반 목록 전환 + 빈 `NoteEditor` 생성 모드 | A3, A11            |
| 미리보기 중 "+ 새 노트" → 선택 해제, 미리보기 사라짐                   | A4                 |
| 휴지통 뷰에서 저장한 새 노트는 일반 목록에만 나타남                    | A5                 |

AC 밖 시나리오: T4(시그니처 계약: 없는 id).
