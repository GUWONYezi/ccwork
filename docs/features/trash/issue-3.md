# 이슈 3. 휴지통 노트를 복구한다 — 테스트 시나리오

> GitHub 이슈: #11 / 기준 문서: prd.md, spec-fixed.md

## 시그니처

선언만 기록한다. 구현은 TDD에서 테스트를 먼저 쓴 뒤 작성한다.

### src/context/NotesContext.tsx (수정, 상태)

```ts
interface NotesContextType {
  // ... 기존 멤버 유지
  restoreNote: (id: string) => Promise<void>; // 신규
}
```

### src/components/TrashList.tsx (수정, 표현)

```ts
interface TrashListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void; // 신규. "복구 Confirm 요청"을 의미 (NoteItem.onDelete와 같은 방식)
  onBack: () => void;
}
// 각 항목에 '복구' 버튼. 클릭이 항목 선택(onSelect)으로 번지지 않는다 (stopPropagation)
// 버튼 aria-label: `${제목 또는 '(제목 없음)'} 복구`
// 기존 TrashList.test.tsx의 render 호출에는 onRestore를 추가해야 한다 (Red 단계에서 반영)
```

### src/App.tsx (수정, 조립)

```ts
interface TrashSidebarProps {
  selectedTrashId: string | null;
  onSelect: (id: string) => void;
  onRestored: (id: string) => void; // 신규. 복구 성공 후 호출
  onBack: () => void;
}
// TrashSidebar: useNotes().restoreNote + useConfirmAction<string>로 복구 Confirm을 직접 렌더링
//   Confirm title '노트 복구', 본문 '이 노트를 복구할까요?', 확인 시 restoreNote(id) 후 onRestored(id)
//   실패 시 console.error + alert('복구에 실패했습니다')
handleRestored(id: string): void; // id === selectedTrashId 이면 selectedTrashId = null, 사이드바는 휴지통 뷰 유지
```

#### 에러 케이스

- `restoreNote`: PATCH 응답 `!res.ok`이면 `api.updateNote`가 `Error('Failed to update note')`를 던지고, Context는 로컬 상태를 바꾸지 않고 reject로 전파한다. `TrashSidebar`가 `try/catch`에서 `alert`로 알린다. 별도 `api.restoreNote` 래퍼 없이 `api.updateNote(id, { deletedAt: null })`을 호출한다. `updatedAt`은 `api.updateNote`가 자동으로 현재 일시로 갱신한다.
- `useConfirmAction`(기존): `action`이 reject하면 에러를 전파하고 `pending`을 닫으며, 확인 버튼을 연속으로 눌러도 `action`은 한 번만 호출된다 (이슈 1 선례). 재사용만 하고 시그니처는 바꾸지 않는다.

## 테스트 시나리오

### 정상

- [x] N1 `[정상] updateNote — should PATCH 본문에 deletedAt: null과 현재 일시의 updatedAt을 담음 when updates가 { deletedAt: null }`
- [x] R1 `[정상] restoreNote — should api.updateNote를 해당 id와 { deletedAt: null }로 호출 when restoreNote(id)`
- [x] R2 `[정상] restoreNote — should 해당 노트를 trashedNotes에서 제거하고 notes에 포함 when 서버가 성공 응답`
- [x] R3 `[정상] restoreNote — should 서버 응답의 updatedAt과 tags를 가진 노트로 notes에 반영 when 태그가 있는 휴지통 노트를 복구`
- [x] T1 `[정상] TrashList — should 각 항목에 "{제목} 복구" 버튼을 표시 when 휴지통 노트가 여러 개`
- [x] T2 `[정상] TrashList — should onRestore를 해당 id로 호출 when 항목의 복구 버튼 클릭`
- [x] A1 `[정상] App — should 복구 Confirm을 표시하고 서버 호출 없이 노트는 휴지통에 그대로 있음 when 항목의 복구 버튼 클릭`
- [x] A2 `[정상] App — should 서버 호출 없이 Confirm이 닫히고 노트가 휴지통에 남음 when 복구 Confirm에서 취소 클릭`
- [x] A3 `[정상] App — should updateNote를 해당 id와 { deletedAt: null }로 호출하고 휴지통 목록에서 노트가 사라짐 when 복구 Confirm에서 확인 클릭`
- [x] A4 `[정상] App — should 복구한 노트가 일반 목록에 나타남 when 복구 후 "목록으로 돌아가기" 클릭`
- [x] A5 `[정상] App — should 일반 목록 카드에 태그 개수가 표시됨 when 태그가 있는 휴지통 노트를 복구하고 일반 목록으로 돌아감`
- [x] A6 `[정상] App — should 사이드바는 휴지통 뷰에 머물고 미리보기는 안내 문구로 바뀜 when 미리보기 중인 노트를 복구`
- [x] A7 `[정상] App — should 카드의 수정일(updatedAt)이 복구한 날짜로 표시됨 when 복구 후 일반 목록으로 돌아감`

### 경계

- [x] R4 `[경계] restoreNote — should 다른 휴지통 노트와 일반 노트를 그대로 둠 when 휴지통 노트 하나만 복구`
- [x] T3 `[경계] TrashList — should onSelect를 호출하지 않음 when 복구 버튼 클릭`
- [x] T4 `[경계] TrashList — should "(제목 없음) 복구" 버튼을 표시 when 제목이 빈 노트`
- [x] A8 `[경계] App — should 미리보기가 그대로 유지됨 when 다른 노트를 미리보기 중 다른 노트를 복구`
- [x] A9 `[경계] App — should updateNote를 한 번만 호출 when 복구 Confirm의 확인을 연속으로 두 번 클릭`
- [x] A11 `[경계] App — should 복구한 노트가 선택되지 않고 메인에 선택 안내 문구가 표시됨 when 복구 후 "목록으로 돌아가기" 클릭`

### 예외

- [x] R5 `[예외] restoreNote — should reject하고 notes와 trashedNotes를 바꾸지 않음 when 서버가 !res.ok 응답`
- [x] A10 `[예외] App — should alert로 실패를 알리고 노트가 휴지통에 남음 when updateNote가 reject`

## AC 커버리지

| AC                                                                                | 시나리오       |
| --------------------------------------------------------------------------------- | -------------- |
| 1. '복구'를 누르면 `Confirm`이 나타나고 아직 복구되지 않음                        | T1, T2, A1     |
| 2. 취소 → 서버 호출 없이 닫히고 노트는 휴지통에 남음                              | A2             |
| 3. 확인 → `PATCH`로 `deletedAt` 제거(`null`), `updatedAt` 현재 일시               | N1, R1, A3     |
| 4. 복구 성공 → 휴지통에서 사라지고(휴지통 뷰 유지), 일반 목록으로 돌아가면 나타남 | R2, R4, A3, A4 |
| 5. 태그가 있는 노트 복구 → 일반 목록에서 태그 보존, 카드에 개수 표시              | R3, A5         |
| 6. 미리보기 중이던 노트 복구 → 휴지통 뷰 유지, 미리보기 비워짐                    | A6, A8         |
| 7. 복구한 노트의 수정일이 복구 시각으로 표시됨                                    | N1, R3, A7     |
| 8. 서버 오류 → `alert`, 노트는 휴지통에 남음                                      | R5, A10        |
| 9. 복구한 노트는 일반 목록으로 돌아가도 자동 선택되지 않고 선택 안내 문구가 보임  | A11            |

이슈 3의 AC가 8개에서 9개로 늘었다(AC 9는 "복구한 노트를 자동 선택하지 않는다"는 결정을 고정하는 경계 AC).

AC 밖 시나리오: T3(복구 버튼 클릭이 항목 선택으로 번지지 않음), A9(확인 이중 클릭 방어), T4(빈 제목의 `aria-label` 계약), R4(다른 노트 불변 계약).
