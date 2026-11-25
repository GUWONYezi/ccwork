# 이슈 4. 태그 길이(50자)와 개수(10개)를 제한한다 — 테스트 시나리오

> GitHub 이슈: #5 / 기준 문서: prd.md, spec-fixed.md / 선행: 이슈 1(`issue-1.md`), 이슈 2(`issue-2.md`), 이슈 3(`issue-3.md`)

## 시그니처

선언만 기록한다. 이슈 3의 시그니처 중 변경되는 부분만 적는다.

### src/utils/tags.ts (수정, 규칙)

```ts
// 시그니처와 TagValidationResult는 이슈 3과 동일. 검사 규칙만 늘어난다.
// existing.length를 개수 검사에 쓴다 (로컬 tags 기준)
export declare function validateTag(input: string, existing: string[]): TagValidationResult;
```

`TagValidationResult.message`가 가질 수 있는 값은 다음과 같다.

| 조건                        | message                                     |
| --------------------------- | ------------------------------------------- |
| 빈 값 / 공백만              | `null` (canAdd false)                       |
| 중복                        | `'이미 있는 태그입니다'`                    |
| trim 후 51자 이상           | `'태그는 최대 50자까지 입력할 수 있습니다'` |
| `existing`이 이미 10개 이상 | `'태그는 최대 10개까지 추가할 수 있습니다'` |
| 통과                        | `null` (canAdd true)                        |

### 변경되지 않는 시그니처

- `useTagEditor`, `TagInput`, `Tag`, `TagList`, `NoteEditorProps`, `api.updateNote`, `NotesContext.updateNote`는 이슈 1~3과 같다.
- `addTag`는 이미 거절 시 `result.message`를 `errorMessage`에 넣고 `tags`와 `inputValue`를 유지한다. `changeInput`은 이미 문구를 지운다. 이 동작은 시그니처 변경 없이 시나리오로만 검증한다.

### 확정된 결정

- 검사 순서: **빈 값 → 중복 → 길이 → 개수**. 여러 조건이 동시에 걸리면 앞 조건의 문구를 반환한다.
- 길이는 `string.length`(UTF-16 코드 단위)로 센다. 한글은 1자, 일부 이모지는 2로 센다. 코드 포인트 기준은 spec 범위 밖이다.
- 한계값 상수(`MAX_TAG_LENGTH`, `MAX_TAGS`)는 export하지 않는다. 테스트는 50/51, 10/11을 숫자로 직접 쓴다.

### 에러 케이스

- `validateTag`는 어떤 입력에도 던지지 않는다. 길이/개수 초과는 `{ canAdd: false, tag: 트림값, message: 해당 문구 }`를 반환한다.
- 길이 초과 시 `tag`는 trim된 전체 값이다(잘라내지 않는다).

## 테스트 시나리오

형식: `[분류] 대상 — should 기대동작 when 조건`. 앞의 ID는 아래 AC 커버리지 표에서 참조한다.

### validateTag (단위)

**정상**

- [x] V1 `[정상] validateTag — should canAdd true, message null을 반환 when trim 후 50자인 입력`
- [x] V2 `[정상] validateTag — should canAdd false, message '태그는 최대 50자까지 입력할 수 있습니다'를 반환 when trim 후 51자인 입력`
- [x] V3 `[정상] validateTag — should canAdd true, message null을 반환 when existing이 9개인 상태에서 10번째 태그`
- [x] V4 `[정상] validateTag — should canAdd false, message '태그는 최대 10개까지 추가할 수 있습니다'를 반환 when existing이 이미 10개`

**경계**

- [x] V5 `[경계] validateTag — should canAdd true when 앞뒤 공백 포함 총 52자이지만 trim 후 50자`
- [x] V6 `[경계] validateTag — should 길이 초과로 거절하고 tag는 잘리지 않은 trim 값 전체를 반환 when 앞뒤 공백이 있는 trim 후 51자`
- [x] V7 `[경계] validateTag — should canAdd true when 한글 50자`
- [x] V8 `[경계] validateTag — should 길이 초과로 거절 when 한글 51자`
- [x] V9 `[경계] validateTag — should 개수 초과로 거절 when existing이 11개 이상`
- [x] V10 `[경계] validateTag — should 길이 초과와 개수 초과가 서로 다른 message를 반환 when 각각 51자 입력과 10개 existing`
- [x] V11 `[경계] validateTag — should 중복 문구 '이미 있는 태그입니다'를 반환 when existing이 10개이고 그 안의 태그를 다시 입력 (검사 순서: 중복 > 개수)`
- [x] V12 `[경계] validateTag — should 길이 초과 문구를 반환 when existing이 10개이고 51자 입력 (검사 순서: 길이 > 개수)`
- [x] V13 `[경계] validateTag — should canAdd false, tag '', message null을 반환 when existing이 10개이고 빈 값 (검사 순서: 빈 값 > 개수)`
- [x] V14 `[경계] validateTag — should 개수 초과로 거절하고 tag는 trim 값을 반환 when existing이 10개이고 '  vue  ' 입력`

### useTagEditor (renderHook)

**정상**

- [x] H1 `[정상] addTag — should tags를 바꾸지 않고 errorMessage를 길이 초과 문구로 when 51자를 입력`
- [x] H2 `[정상] addTag — should 태그를 추가하고 errorMessage를 null로 when 50자를 입력`
- [x] H3 `[정상] addTag — should tags를 바꾸지 않고 errorMessage를 개수 초과 문구로 when 태그가 10개인 상태에서 추가`
- [x] H4 `[정상] addTag — should 10번째 태그를 추가 when 태그가 9개`

**경계**

- [x] H5 `[경계] addTag — should inputValue를 비우지 않고 유지 when 길이 초과로 거절`
- [x] H6 `[경계] addTag — should inputValue를 비우지 않고 유지 when 개수 초과로 거절`
- [x] H7 `[경계] changeInput — should errorMessage를 null로 when 길이 초과 문구가 있는 상태에서 값을 변경`
- [x] H8 `[경계] changeInput — should errorMessage를 null로 when 개수 초과 문구가 있는 상태에서 값을 변경`
- [x] H9 `[경계] addTag — should 다시 추가할 수 있음 when 10개에서 removeTag로 하나 삭제한 뒤 추가 (개수는 현재 tags 기준)`
- [x] H10 `[경계] addTag — should errorMessage를 null로 when 개수 초과로 거절된 뒤 removeTag로 하나 삭제하고 같은 입력값으로 다시 addTag`

### NoteEditor (통합: api mock 또는 NotesProvider)

**정상**

- [x] E1 `[정상] NoteEditor — should 태그가 추가되지 않고 입력창 아래에 "태그는 최대 50자까지 입력할 수 있습니다"를 표시 when 51자를 입력하고 Enter`
- [x] E2 `[정상] NoteEditor — should 태그가 추가되고 안내 문구가 없음 when 50자를 입력하고 Enter`
- [x] E3 `[정상] NoteEditor — should 태그가 추가되지 않고 "태그는 최대 10개까지 추가할 수 있습니다"를 표시 when 태그 10개인 노트에서 입력하고 Enter`
- [x] E4 `[정상] NoteEditor — should 10번째 태그가 추가됨 when 태그 9개인 노트에서 입력하고 Enter`

**경계**

- [x] E5 `[경계] NoteEditor — should 입력창 값을 비우지 않음 when 길이 초과로 거절`
- [x] E6 `[경계] NoteEditor — should 입력창 값을 비우지 않음 when 개수 초과로 거절`
- [x] E7 `[경계] NoteEditor — should 안내 문구가 사라짐 when 길이/개수 초과 문구가 표시된 상태에서 입력창에 타이핑`
- [x] E8 `[경계] NoteEditor — should 태그가 추가됨 when 10개 노트에서 태그 하나를 삭제한 뒤 입력하고 Enter`
- [x] E9 `[경계] NoteEditor — should updateNote의 tags에 초과 입력이 포함되지 않음 when 길이 초과로 거절된 뒤 저장`

## AC 커버리지

이슈 #5의 완료조건 7개와 대조한 결과이다.

| #   | AC                                                                                              | 시나리오                                          |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | trim 후 50자까지 추가, 51자부터 거절 + 안내 문구                                                | V1, V2, V5~V8, H1, H2, E1, E2                     |
| 2   | 9개일 때 10번째 추가, 10개일 때 거절 + 안내 문구                                                | V3, V4, V9, H3, H4, E3, E4                        |
| 3   | 길이/개수 안내 문구가 서로 구분된다                                                             | V10, E1, E3                                       |
| 4   | 문구 텍스트: 길이 "…최대 50자까지 입력할 수 있습니다", 개수 "…최대 10개까지 추가할 수 있습니다" | V2, V4, E1, E3                                    |
| 5   | 거절돼도 입력창 값 유지, 문구는 값이 바뀔 때 사라진다                                           | H5~H8, E5~E7                                      |
| 6   | 경계값(50/51자, 10/11개)이 `validateTag` 단위 테스트에 포함된다                                 | V1/V2(50/51자), V3/V4(10번째 허용/추가 시도 거절) |
| 7   | 개수 제한은 로컬 `tags` 기준이며 삭제하면 다시 추가할 수 있다                                   | H9, H10, E8                                       |

AC 밖에서 추가한 시나리오는 검사 순서를 고정하는 V11~V13, `tag` 값 반환과 거절 후 저장을 확인하는 V14·E9, 초과 상태를 확인하는 V9이다. 던지지 않음 시나리오(V15)는 V2·V4가 이미 결과 객체를 단언해 중복이므로 제외했다. `TagInput`은 이슈 3의 I1~I6으로 충분해 새 시나리오를 만들지 않았다.
