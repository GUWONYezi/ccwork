# 검색 기능 이슈 목록 (수평 슬라이싱)

> 기준 문서: [`spec-fixed.md`](./spec-fixed.md) (확정본), 구조 결정은 [`prd.md`](./prd.md)의 ADR-001(검색 아키텍처)을 따른다. 이 문서는 **수평 슬라이싱**으로 분해했다. 이슈 하나가 레이어(타입 → 규칙 → 표현 → 조립 → 상태 연결 → 통합 검증) 하나를 맡으며, 사용자에게 보이는 동작은 마지막 레이어까지 끝나야 나타난다.

## 이슈 요약

| #   | 이슈                                     | 레이어           | 대상 파일                        | 의존       |
| --- | ---------------------------------------- | ---------------- | -------------------------------- | ---------- |
| 1   | 검색 타입을 정의한다                     | 타입             | `src/types/search.ts`            | 없음       |
| 2   | 노트 필터링 규칙을 구현한다              | 규칙 (`utils`)   | `src/utils/searchNotes.ts`       | #1         |
| 3   | `SearchBar` 컴포넌트를 구현한다          | 표현 + 로컬 상태 | `src/components/SearchBar.tsx`   | #1         |
| 4   | `NoteList`가 필터된 목록을 표시하게 한다 | 표현             | `src/components/NoteList.tsx`    | 없음       |
| 5   | `NoteSidebar` 조립 컴포넌트를 구현한다   | 조립             | `src/components/NoteSidebar.tsx` | #2, #3, #4 |
| 6   | `App`에 확정 조건 상태를 연결한다        | 상태 연결        | `src/App.tsx`                    | #1, #5     |
| 7   | 검색 흐름을 통합 검증한다                | 통합 테스트      | `src/**/*.test.tsx`              | #1~#6      |

- #2, #3, #4는 #1 이후(#4는 #1과 무관) 서로 독립적이라 병렬 진행이 가능하다.
- #4~#6은 `NoteList`의 props 시그니처가 바뀌어 호출부(`App`)가 함께 바뀌어야 하므로, 같은 브랜치에서 연속으로 머지한다(중간 상태에서는 빌드가 깨질 수 있다).
- 사용자가 화면에서 검색 동작을 확인할 수 있는 시점은 #6 완료 후이다.

## 공통 사항

- TDD로 진행한다. 각 이슈는 자기 레이어의 테스트를 함께 작성하고, #7에서 레이어를 가로지르는 시나리오를 검증한다.
- 선행 조건: 태그 기능의 `Note.tags?: string[]`(`docs/features/tag/spec-fixed.md`)가 먼저 반영되어 있어야 태그 검색을 테스트할 수 있다. 태그가 없는 기존 노트는 모든 이슈에서 `note.tags ?? []`로 처리하며 에러가 나지 않아야 한다.
- 구조는 ADR-001과 태그 PRD의 ADR-002를 따른다: 규칙은 `utils`의 순수 함수, 표현은 props만 받는 컴포넌트, `useNotes()` 호출은 조립 컴포넌트(`NoteSidebar`)에서만 한다. `NotesContext`와 `api/`는 변경하지 않는다.
- UI 문구는 한국어, 입력 요소(`select`, `input`)에는 `aria-label`을 단다.
- 이번 범위는 정의서 기준이다. 최근 검색어 저장(ADR-002)은 정의서에 UI/규칙이 아직 없어 이 문서에서 다루지 않는다.

---

## 이슈 1. 검색 타입을 정의한다

### 설명

검색 조건을 표현하는 타입과 선택박스 옵션 상수를 정의한다. 이후 모든 레이어(규칙, 표현, 조립, 상태)가 공유하는 계약이다.

### 레이어와 범위

- 타입: `src/types/search.ts` (신규, 타입 파일은 단수형)
  - `SearchField`: `'all' | 'title' | 'content' | 'tag'`
  - `SearchCondition`: `{ field: SearchField; keyword: string }`
- 상수: 선택박스 옵션(순서와 라벨: 전체, 제목, 내용, 태그)과 초기 조건(`{ field: 'all', keyword: '' }`)

### 완료조건 (Acceptance Criteria)

- [ ] `SearchField`는 `all`, `title`, `content`, `tag` 네 값만 허용한다.
- [ ] `SearchCondition`은 `field`와 `keyword`를 가진다.
- [ ] 선택박스 옵션 상수는 전체 → 제목 → 내용 → 태그 순서이고 라벨이 한국어이다.
- [ ] 초기 조건은 `field: 'all'`, `keyword: ''`이다.
- [ ] `npm run build`(`tsc`)가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 1-1. 허용된 검색 대상**

- Given: `SearchCondition` 타입이 정의되어 있다.
- When: `{ field: 'title', keyword: 'react' }`를 `SearchCondition`에 할당한다.
- Then: 타입 검사를 통과한다.

**시나리오 1-2. 허용되지 않은 검색 대상**

- Given: `SearchCondition` 타입이 정의되어 있다.
- When: `{ field: 'date', keyword: 'react' }`를 할당한다.
- Then: 타입 검사에서 에러가 난다.

**시나리오 1-3. 옵션 순서와 초기값**

- Given: 선택박스 옵션 상수와 초기 조건이 정의되어 있다.
- When: 옵션 배열과 초기 조건을 읽는다.
- Then: 옵션은 전체, 제목, 내용, 태그 순서이고 초기 조건은 `field: 'all'`, `keyword: ''`이다.

### 테스트

- 타입 검사(`tsc`), 옵션 상수의 순서와 값 단위 테스트.

---

## 이슈 2. 노트 필터링 규칙을 구현한다

### 설명

노트 배열과 확정된 검색 조건을 받아 결과 배열을 돌려주는 순수 함수를 만든다. 목록과 건수가 같은 규칙에서 나오도록 이 함수 하나가 필터 규칙을 전부 가진다.

### 레이어와 범위

- 규칙: `src/utils/searchNotes.ts` (신규)
  - `filterNotes(notes, condition)`: 조건에 맞는 노트를 기존 순서 그대로 반환
  - `hasSearchKeyword(condition)`: trim 후 검색어가 비어 있지 않은지 판단(필터 적용 여부, 건수 문구 표시 조건에 재사용)

### 완료조건 (Acceptance Criteria)

- [ ] 검색어는 trim하고 대소문자를 무시하여 부분 일치(`includes`)로 비교한다.
- [ ] `title`은 제목, `content`는 내용, `tag`는 태그 중 하나라도 검색어를 포함하면 일치한다.
- [ ] `all`은 제목 OR 내용 OR 태그 중 하나라도 일치하면 결과에 포함한다.
- [ ] 태그가 없는 기존 노트(`tags`가 `undefined`)는 `note.tags ?? []`로 처리하며 에러가 나지 않는다.
- [ ] 일치 필드에 따른 정렬 없이 기존 노트 순서를 유지한다.
- [ ] trim 후 검색어가 비어 있으면 필터를 적용하지 않고 전체 노트를 반환한다(`field` 값과 무관).
- [ ] 입력 배열을 변경하지 않는다.
- [ ] `hasSearchKeyword`는 trim 후 비어 있으면 `false`, 아니면 `true`를 반환한다.

### 시나리오 (Given / When / Then)

**시나리오 2-1. 제목 검색**

- Given: 제목이 `React 노트`, `Vue 노트`인 노트가 있다.
- When: `{ field: 'title', keyword: 'react' }`로 필터링한다.
- Then: `React 노트`만 반환된다(대소문자 무시).

**시나리오 2-2. 검색어 trim**

- Given: 제목이 `React 노트`인 노트가 있다.
- When: `{ field: 'title', keyword: '  react  ' }`로 필터링한다.
- Then: `React 노트`가 반환된다.

**시나리오 2-3. 전체 검색은 OR 조건**

- Given: 제목에만 `hook`이 있는 노트 A, 내용에만 있는 노트 B, 태그에만 있는 노트 C, 어디에도 없는 노트 D가 있다.
- When: `{ field: 'all', keyword: 'hook' }`로 필터링한다.
- Then: A, B, C가 기존 순서대로 반환되고 D는 제외된다.

**시나리오 2-4. 태그 검색**

- Given: `tags: ['React', 'design']`인 노트와 `tags: ['vue']`인 노트가 있다.
- When: `{ field: 'tag', keyword: 'rea' }`로 필터링한다.
- Then: 첫 번째 노트만 반환된다(태그 중 하나라도 포함하면 일치).

**시나리오 2-5. 태그가 없는 기존 노트**

- Given: `tags` 필드가 없는 노트가 있다.
- When: `{ field: 'tag', keyword: 'react' }` 또는 `{ field: 'all', keyword: 'react' }`로 필터링한다.
- Then: 에러 없이 해당 노트는 태그 일치에서 제외된다(`all`에서는 제목/내용으로만 판단).

**시나리오 2-6. 빈 검색어**

- Given: 노트 3개가 있다.
- When: `{ field: 'title', keyword: '   ' }`로 필터링한다.
- Then: 노트 3개가 원래 순서대로 모두 반환된다.

**시나리오 2-7. 결과 없음**

- Given: 노트 3개가 있고 어떤 필드에도 `zzz`가 없다.
- When: `{ field: 'all', keyword: 'zzz' }`로 필터링한다.
- Then: 빈 배열이 반환된다.

### 테스트

- `filterNotes`, `hasSearchKeyword` 단위 테스트(렌더링 없음). 필드별, 대소문자, trim, 태그 없는 노트, 순서 유지, 빈 검색어, 입력 불변.

---

## 이슈 3. `SearchBar` 컴포넌트를 구현한다

### 설명

사이드바 상단에 놓을 검색창 UI를 만든다. 선택박스와 입력 중인 텍스트는 로컬 상태로 갖고, Enter 또는 검색 버튼을 눌렀을 때만 `onSearch`로 조건을 올린다. 건수 문구는 전달받은 값을 표시만 한다.

### 레이어와 범위

- 표현 + 로컬 상태: `src/components/SearchBar.tsx` (신규)
  - named export `SearchBar`, props 인터페이스 `SearchBarProps` (`onSearch`, `resultCount?` 등)
  - 로컬 `useState`: 선택박스 값(`field`), 입력 텍스트(`keyword`)

### 완료조건 (Acceptance Criteria)

- [ ] 한 줄(`flex`)에 `[선택박스] [입력창] [검색 버튼]` 순서로 배치한다.
- [ ] 선택박스: 옵션 순서 전체 → 제목 → 내용 → 태그, 기본값 "전체", `aria-label="검색 대상"`, 고정 너비.
- [ ] 입력창: placeholder "검색어를 입력하세요", `aria-label="검색어"`, `min-w-0 flex-1`.
- [ ] 검색 버튼: 돋보기 아이콘만 표시(텍스트 없음), `aria-label="검색"`, `cursor-pointer hover:opacity-75`.
- [ ] 입력창에서 Enter 또는 검색 버튼 클릭 시에만 `onSearch({ field, keyword })`를 호출한다.
- [ ] 타이핑만 하거나 선택박스만 바꿔도 `onSearch`를 호출하지 않는다.
- [ ] 입력창을 비우고 Enter(또는 검색 버튼)를 누르면 `keyword: ''`로 `onSearch`를 호출한다(필터 해제는 호출부에서 처리). 이때 선택박스 값은 유지된다.
- [ ] 지우기(x) 버튼, 초기화 버튼은 두지 않는다.
- [ ] `resultCount`가 주어지면 검색창 하단 좌측에 `text-muted-foreground` 작은 글씨로 "검색 결과 N건"을 표시한다(0이어도 표시). 주어지지 않으면 표시하지 않는다.
- [ ] `useNotes()`를 호출하지 않는다(props만 받는 표현 컴포넌트).

### 시나리오 (Given / When / Then)

**시나리오 3-1. Enter로 검색**

- Given: `SearchBar`가 렌더링되어 있고 선택박스는 "전체"이다.
- When: 입력창에 `react`를 입력하고 Enter를 누른다.
- Then: `onSearch`가 `{ field: 'all', keyword: 'react' }`로 한 번 호출된다.

**시나리오 3-2. 검색 버튼으로 검색**

- Given: 선택박스를 "태그"로 바꾸고 입력창에 `design`을 입력했다.
- When: 검색 버튼을 클릭한다.
- Then: `onSearch`가 `{ field: 'tag', keyword: 'design' }`로 호출된다.

**시나리오 3-3. 타이핑만으로는 검색하지 않음**

- Given: `SearchBar`가 렌더링되어 있다.
- When: 입력창에 글자를 입력하고, 선택박스를 "제목"으로 바꾼다(Enter/버튼은 누르지 않는다).
- Then: `onSearch`는 호출되지 않는다.

**시나리오 3-4. 빈 값으로 검색(해제 요청)**

- Given: 선택박스를 "내용"으로 두고 입력창에 `react`를 입력해 검색한 적이 있다.
- When: 입력창을 비우고 Enter를 누른다.
- Then: `onSearch`가 `{ field: 'content', keyword: '' }`로 호출되고, 선택박스는 "내용"으로 유지된다.

**시나리오 3-5. 건수 문구 표시**

- Given: `resultCount`가 `3`으로 전달된다.
- When: `SearchBar`를 렌더링한다.
- Then: 검색창 하단 좌측에 "검색 결과 3건"이 표시된다. `resultCount`가 `0`이면 "검색 결과 0건"이 표시된다.

**시나리오 3-6. 건수 문구 숨김**

- Given: `resultCount`가 전달되지 않는다.
- When: `SearchBar`를 렌더링한다.
- Then: "검색 결과" 문구가 표시되지 않는다.

### 테스트

- props 기반 컴포넌트 테스트(Testing Library): 렌더링, `aria-label` 조회, Enter/클릭 시 `onSearch` 호출 인자, 호출되지 않는 경우, 건수 문구.

---

## 이슈 4. `NoteList`가 필터된 목록을 표시하게 한다

### 설명

`NoteList`를 props만 받는 표현 컴포넌트로 바꿔, 이미 걸러진 목록을 렌더링하고 "노트가 없습니다"와 "검색 결과가 없습니다"를 구분해 보여준다. 데이터 조회(`useNotes()`)는 조립 컴포넌트로 옮긴다.

### 레이어와 범위

- 표현: `src/components/NoteList.tsx` (수정)
  - 필터 결과 목록, 로딩/에러 상태, 전체 노트 존재 여부(노트 없음과 검색 결과 없음 구분)를 props로 받는다.
  - 기존 선택/삭제 관련 props와 `NoteItem` 렌더링은 유지한다.

### 완료조건 (Acceptance Criteria)

- [ ] early return 순서: `loading` → `error` → 노트 없음("노트가 없습니다") → 검색 결과 없음("검색 결과가 없습니다") → 본문.
- [ ] 전체 노트가 하나도 없으면 "노트가 없습니다"를, 노트는 있으나 필터 결과가 0건이면 "검색 결과가 없습니다"를 표시한다.
- [ ] 받은 목록을 순서 그대로 렌더링하며, 목록을 다시 필터링하거나 정렬하지 않는다.
- [ ] `useNotes()`를 직접 호출하지 않는다.
- [ ] 기존 동작(선택 강조, 삭제 버튼의 `stopPropagation`)은 변하지 않는다.

### 시나리오 (Given / When / Then)

**시나리오 4-1. 필터된 목록 렌더링**

- Given: 전체 노트 5개 중 필터 결과 2개가 props로 전달된다.
- When: `NoteList`를 렌더링한다.
- Then: 노트 카드 2개가 전달받은 순서대로 표시된다.

**시나리오 4-2. 노트가 없음**

- Given: 전체 노트가 0개이고 필터 결과도 비어 있다.
- When: `NoteList`를 렌더링한다.
- Then: "노트가 없습니다"가 표시되고 "검색 결과가 없습니다"는 표시되지 않는다.

**시나리오 4-3. 검색 결과 없음**

- Given: 전체 노트는 있으나 필터 결과가 0건이다.
- When: `NoteList`를 렌더링한다.
- Then: "검색 결과가 없습니다"가 표시되고 "노트가 없습니다"는 표시되지 않는다.

**시나리오 4-4. 로딩/에러 우선**

- Given: `loading`이 `true`(또는 `error`가 있음)이고 목록이 비어 있다.
- When: `NoteList`를 렌더링한다.
- Then: 로딩(또는 에러) 표시만 나타나고 빈 목록 문구는 나타나지 않는다.

### 테스트

- props 기반 컴포넌트 테스트: 분기 우선순위, 문구 구분, 렌더링 순서. `NotesProvider` 없이 렌더링되는지 확인.

---

## 이슈 5. `NoteSidebar` 조립 컴포넌트를 구현한다

### 설명

`useNotes()`를 한 번 호출해 확정 조건으로 목록과 건수를 같은 결과에서 계산하고, `SearchBar`와 `NoteList`를 배치하는 조립 컴포넌트를 만든다. 목록과 건수는 별도 저장 없이 `notes`와 조건에서 렌더링마다 파생한다.

### 레이어와 범위

- 조립: `src/components/NoteSidebar.tsx` (신규)
  - props: 확정 조건(`condition`), `onSearch`, `NoteList`에 필요한 기존 선택/삭제 props
  - `useNotes()`로 `notes`, `loading`, `error`를 받아 `filterNotes`로 결과 계산

### 완료조건 (Acceptance Criteria)

- [ ] `useNotes()`는 이 컴포넌트에서 한 번만 호출한다.
- [ ] 결과 목록은 `filterNotes(notes, condition)`로 계산하고, 상태로 저장하지 않는다(memo 계열 훅 없음).
- [ ] `hasSearchKeyword(condition)`이 `true`일 때만 `SearchBar`에 `resultCount`(= 결과 목록 길이)를 전달한다. `false`이면 전달하지 않는다.
- [ ] 결과가 0건이어도 검색어가 있으면 `resultCount`는 `0`으로 전달된다.
- [ ] `SearchBar`의 `onSearch`를 상위(`App`)에서 받은 `onSearch`로 연결한다.
- [ ] `NoteList`에 결과 목록, `loading`, `error`, 전체 노트 존재 여부를 전달한다.
- [ ] 노트가 생성/수정/삭제되어 `notes`가 바뀌면 같은 조건으로 목록과 건수가 다시 계산된다.
- [ ] 검색 조건이 없는 초기 상태에서는 전체 노트가 표시되고 건수 문구는 나타나지 않는다.

### 시나리오 (Given / When / Then)

**시나리오 5-1. 조건 없음**

- Given: `NotesProvider` 안에 노트 3개가 있고 조건은 초기값(`keyword: ''`)이다.
- When: `NoteSidebar`를 렌더링한다.
- Then: 노트 3개가 모두 표시되고 "검색 결과 N건"은 표시되지 않는다.

**시나리오 5-2. 조건 적용**

- Given: 노트 3개 중 제목에 `react`가 있는 노트가 2개이고, 조건이 `{ field: 'title', keyword: 'react' }`이다.
- When: `NoteSidebar`를 렌더링한다.
- Then: 해당 노트 2개만 표시되고 "검색 결과 2건"이 표시된다.

**시나리오 5-3. 0건**

- Given: 조건이 `{ field: 'all', keyword: 'zzz' }`이고 일치하는 노트가 없다.
- When: `NoteSidebar`를 렌더링한다.
- Then: "검색 결과가 없습니다"와 "검색 결과 0건"이 표시된다.

**시나리오 5-4. 노트 변경 후 재계산**

- Given: 조건 `{ field: 'title', keyword: 'react' }`이 적용되어 2건이 표시되어 있다.
- When: 제목에 `react`가 없는 노트를 `react`가 들어가도록 수정해 저장한다(`notes` 갱신).
- Then: 조건은 그대로이고 목록과 건수가 3건으로 다시 계산된다.

**시나리오 5-5. `onSearch` 전달**

- Given: `NoteSidebar`에 `onSearch` 모의 함수를 전달했다.
- When: 검색창에 `react`를 입력하고 Enter를 누른다.
- Then: 상위로 전달한 `onSearch`가 `{ field: 'all', keyword: 'react' }`로 호출된다.

### 테스트

- 통합 테스트: `NotesProvider`로 감싸거나 `useNotes`/`api`를 mock해 조건별 목록, 건수 문구, 노트 변경 후 재계산을 검증한다.

---

## 이슈 6. `App`에 확정 조건 상태를 연결한다

### 설명

`App`이 확정된 검색 조건을 `useState`로 보관하고, `Layout`의 사이드바 슬롯에 `NoteSidebar`를 주입한다. 조건 상태는 `selectedNoteId`, `isCreating`과 독립이다.

### 레이어와 범위

- 상태 연결: `src/App.tsx` (수정)
  - `condition` `useState`(초기값은 #1의 초기 조건), `handleSearch`
  - `Layout` `sidebar` 슬롯에 `NoteSidebar` 주입, 기존 선택/생성 상태 props 연결

### 완료조건 (Acceptance Criteria)

- [ ] `App`이 `SearchCondition` 타입의 `condition`을 `useState`로 보관하고 초기값은 `{ field: 'all', keyword: '' }`이다.
- [ ] `handleSearch`(`SearchBar`의 `onSearch` 구현)가 `condition`을 갱신한다.
- [ ] `NoteSidebar`가 `Layout`의 `sidebar` 슬롯에 들어간다.
- [ ] 검색 조건을 바꿔도 `selectedNoteId`와 `isCreating`은 변하지 않는다(편집 화면 유지).
- [ ] `NotesContext`에는 검색 상태를 추가하지 않는다.
- [ ] 기존 동작(노트 선택, "+ 새 노트", 저장 후 흐름)이 그대로 동작한다.

### 시나리오 (Given / When / Then)

**시나리오 6-1. 검색 실행**

- Given: 앱이 렌더링되어 노트 목록이 표시되어 있다.
- When: 검색창에 `react`를 입력하고 Enter를 누른다.
- Then: 목록이 `react`가 포함된 노트로 필터링되고 "검색 결과 N건"이 표시된다.

**시나리오 6-2. 타이핑·선택박스 변경은 적용되지 않음**

- Given: `react`로 검색해 필터가 적용되어 있다.
- When: 입력창을 다른 글자로 바꾸고, 선택박스를 "태그"로 바꾼다(Enter/버튼은 누르지 않는다).
- Then: 목록과 건수는 이전 확정 조건 그대로이다.

**시나리오 6-3. 편집 화면 유지**

- Given: 노트 A를 선택해 편집 중이다.
- When: 노트 A가 포함되지 않는 조건으로 검색한다.
- Then: 목록에서 노트 A는 사라지지만 편집 화면(`selectedNoteId`)은 그대로 유지된다.

### 테스트

- `App` 통합 테스트(api mock 또는 `NotesProvider`): 조건 갱신, 선택 상태 불변, 기존 흐름 회귀.

---

## 이슈 7. 검색 흐름을 통합 검증한다

### 설명

레이어 이슈 #1~#6이 맞물렸을 때 정의서의 전체 동작이 성립하는지 사용자 시점으로 검증한다. 레이어별 이슈의 테스트가 다루지 못하는 레이어 간 상호작용을 확인하고, 발견된 어긋남을 수정한다.

### 레이어와 범위

- 통합 테스트: `App`을 `NotesProvider`와 함께(또는 `api` mock으로) 렌더링해 검증. 필요하면 수동 확인(`npm run dev`)을 병행한다.

### 완료조건 (Acceptance Criteria)

- [ ] Enter/검색 버튼으로만 필터가 적용되고, 실시간(타이핑 중) 필터링은 일어나지 않는다.
- [ ] 검색 대상(전체/제목/내용/태그)별 결과가 정의서의 검색 규칙과 일치한다.
- [ ] 입력창을 비우고 Enter를 누르면 필터가 해제되고 전체 목록이 보이며, 선택박스 값은 유지된다.
- [ ] 필터가 걸린 상태에서 노트를 생성/수정/삭제해도 조건이 유지되고 목록과 건수가 함께 바뀐다.
- [ ] 저장 후 조건에 맞지 않게 된 노트가 목록에서 사라져도 편집 화면이 유지된다.
- [ ] "노트가 없습니다"와 "검색 결과가 없습니다"가 올바른 상황에서 구분되어 표시된다.
- [ ] 태그가 없는 기존 노트(`db.json` 기존 데이터)가 있어도 어떤 검색 대상에서도 에러가 나지 않는다.
- [ ] `npm test`, `npm run lint`, `npm run build`가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 7-1. 전체 검색**

- Given: 제목, 내용, 태그에 각각 `hook`이 들어간 노트와 무관한 노트가 있다.
- When: 대상 "전체", 검색어 `  HOOK  `으로 Enter를 누른다.
- Then: 세 노트만 기존 순서로 표시되고 "검색 결과 3건"이 표시된다.

**시나리오 7-2. 필터 해제**

- Given: 대상 "제목", 검색어 `react`로 필터가 적용되어 있다.
- When: 입력창을 비우고 Enter를 누른다.
- Then: 전체 목록이 표시되고 건수 문구가 사라지며, 선택박스는 "제목"으로 유지된다.

**시나리오 7-3. 필터 유지 상태에서 노트 삭제**

- Given: `react` 검색으로 2건이 표시되어 있다.
- When: 그 중 한 노트를 삭제한다.
- Then: 조건은 유지된 채 목록은 1건, 문구는 "검색 결과 1건"이 된다.

**시나리오 7-4. 저장 후 조건 밖으로 벗어난 노트**

- Given: `react` 검색 결과에 있는 노트를 열어 편집 중이다.
- When: 제목에서 `react`를 지우고 저장한다.
- Then: 해당 노트가 목록에서 사라지고 건수가 줄어들지만, 편집 화면은 그대로 열려 있다.

**시나리오 7-5. 노트가 없을 때와 결과가 없을 때**

- Given: (a) `notes`가 비어 있는 상태, (b) 노트는 있으나 일치하는 노트가 없는 검색 상태가 각각 있다.
- When: 각 상태를 렌더링한다.
- Then: (a)는 "노트가 없습니다", (b)는 "검색 결과가 없습니다"와 "검색 결과 0건"이 표시된다.

**시나리오 7-6. 태그가 없는 기존 노트**

- Given: `tags` 필드가 없는 노트와 태그가 있는 노트가 섞여 있다.
- When: 대상 "태그"로 검색한 뒤 대상 "전체"로 다시 검색한다.
- Then: 에러 없이 동작하고, 태그가 없는 노트는 태그 검색 결과에서 제외된다.

### 테스트

- 통합 테스트로 위 시나리오를 자동화하고, 브라우저에서 수동으로 한 번 더 확인한다.

---

## 확인이 필요한 항목

- **`NoteList` 구조 차이**: `spec-fixed.md`는 `NoteList`가 조건을 받아 직접 필터링한다고 쓰고, ADR-001은 `NoteSidebar`가 필터링하고 `NoteList`는 결과를 받아 표시하도록 정했다. 이 문서는 ADR-001을 따랐다. `spec-fixed.md`의 UI 명세와 구현 순서도 ADR-001에 맞게 정리가 필요하다.
- **스타일 기준**: 정의서는 `border-border`, `bg-card` 같은 기존 시맨틱 토큰을 쓰라고 하지만, 디자인 시스템은 영역 구분 테두리 금지(No-Line)와 입력창은 포커스 때만 `tertiary`로 바꾸는 규칙을 둔다. #3 구현 시 어느 기준을 따를지 확정이 필요하다.

## 수평 슬라이싱 특성 (참고)

- #1~#6 각각은 자기 레이어만 다루므로 개별 이슈는 작고 병렬 작업이 쉽다. 반면 어느 하나도 단독으로 사용자 가치를 내지 못하고, 실제로 맞물리는지는 #6 이후 #7에서야 확인된다.
- #4처럼 시그니처가 바뀌는 이슈는 호출부와 함께 머지해야 해서, 레이어별로 독립 머지할 수 없는 구간이 생긴다.
- 같은 기능을 수직으로 나눈 방식은 `docs/features/tag/issues.md`(태그 기능)를 참고한다.

## Out of Scope

`prd.md`의 4번(Out of Scope)을 따른다. 실시간 필터링, 일치 필드별 정렬과 하이라이트, 지우기/초기화 버튼, 서버 측 검색, 검색 조건 영속화 등은 이슈로 만들지 않는다.
