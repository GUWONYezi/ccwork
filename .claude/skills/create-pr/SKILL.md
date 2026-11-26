---
name: create-pr
description: 현재 브랜치의 변경사항을 요약해 PR 초안(제목/본문)을 만들고, 개발자 승인 후 E2E(npm run test:e2e)를 통과시킨 경우에만 git push + gh pr create로 PR을 생성하는 스킬. E2E가 실패하면 PR을 만들지 않고 Trace Viewer 확인 → 레이어 판별 → 단위 테스트 Red → 프로덕션 Green 순서의 복구 절차를 안내한다. 사용자가 "PR 만들어줘", "PR 올려줘", "PR 보내줘", "이거 머지하자", "create-pr", "/create-pr"을 말하거나 작업을 마치고 PR/머지 단계로 넘어가려는 의도를 보이면 스킬 이름을 직접 부르지 않아도 반드시 이 스킬을 사용한다. TDD 사이클의 8단계(commit → PR)에 해당하며 /tdd-security 이후에 쓴다. 명시적 호출은 /create-pr.
---

# create-pr

현재 브랜치를 PR로 올린다. 핵심은 **E2E를 통과하지 못한 코드는 PR이 되지 못하게 막는 게이트**다. 단위 테스트는 레이어별로 따로 검증하지만, UI → Context → API → `db.json`이 실제로 이어지는지는 E2E만 잡을 수 있다. 그래서 PR 직전에 한 번 관통 검증을 한다.

CLAUDE.md의 TDD 사이클처럼 각 단계에 사람의 승인 게이트가 있다. 승인 없이 다음 단계로 넘어가지 않는다.

## 절대 하지 않는 것

- **승인 전에 E2E, push, PR 생성을 하지 않는다.** 초안 승인(2단계)이 모든 후속 작업의 전제다. push와 PR은 외부에 공개되는 동작이라 되돌리기 어렵다.
- **E2E가 실패했을 때 `e2e/**`(spec, helpers, seed, config)를 고쳐서 통과시키지 않는다.\*\* 테스트가 드러낸 버그를 테스트 쪽에서 덮는 것은 근본 원인 회피다. 실패 → 단위 테스트에서 재현(Red) → 프로덕션 수정(Green)이 올바른 경로다. 사용자가 E2E를 고치자고 요청해도 이유를 짚고 위 경로를 제안한다. E2E 자체가 명백히 잘못된 경우(PRD와 어긋난 기대값 등)는 근거를 보여주고 사용자가 명시적으로 결정하게 한다.
- `--no-verify`, `--force` push 등으로 훅/보호를 우회하지 않는다.
- 커밋 훅(husky: lint-staged, commitlint)이나 push 중 오류가 나도 직접 고쳐서 밀어붙이지 않는다. **어느 파일에서 어떤 오류가 났는지**만 보고한다(CLAUDE.md 규칙).
- `main`을 PR 브랜치로 쓰지 않는다. 현재 브랜치가 `main`이면 중단하고 알린다.
- merge는 하지 않는다. PR 생성까지만이다. 머지(squash)와 이슈 클로즈는 사용자가 따로 요청한다. "이거 머지하자"는 말도 이 스킬에서는 **PR 생성 요청**으로 해석하고, 실제 머지는 PR이 만들어진 뒤 별도로 확인받는다.

## 절차

### 0. 사전 점검

한 번에 병렬로 확인한다.

- `git branch --show-current` — `main`이면 중단.
- `git status --short` — 커밋되지 않은 변경 확인.
  - **`db.json` 변경은 PR에 넣지 않는다.** json-server가 런타임에 수정하는 파일이라 의도치 않은 데이터 변경이 커밋될 수 있다(CLAUDE.md). 변경돼 있으면 알리고 제외한다.
  - 그 외 미커밋 변경이 있으면 "PR에는 커밋된 것만 담긴다"고 알리고, 커밋할지 사용자에게 묻는다. 커밋을 제안할 때는 commitlint 규칙(`type: 제목`, type은 feat/fix/docs/chore/test/refactor/style/ci, 제목 50자 이하, 본문 10자 이상)을 따른다. 승인 없이 커밋하지 않는다.
- 기준(base) 브랜치 결정: 이슈 의존성이 있으면 `feature/<spec>` 브랜치가 base다(CLAUDE.md 8단계). 기본값은 `main`. 브랜치 이름과 `git branch -r`, 이전 PR(`gh pr list --state merged --limit 5`)의 흐름으로 추정하되, 확실하지 않으면 초안 단계에서 base를 명시해 사용자가 확인하게 한다.
- 이미 이 브랜치의 열린 PR이 있는지 `gh pr view` 로 확인. 있으면 새로 만들지 않고 URL을 알린 뒤 push만 할지 묻는다.
- `gh auth status` 실패 시 `! gh auth login` 안내 후 중단.

### 1. PR 초안 작성

변경 범위는 `git log <base>..HEAD --oneline`과 `git diff <base>...HEAD --stat`으로 파악하고, 핵심 파일은 diff를 읽는다. 커밋 메시지만 믿지 않고 실제 변경을 본다.

가능하면 관련 문서도 참조한다: `docs/features/{feature}/issues.md`, `issue-{N}.md`(AC·시나리오), 이슈 번호가 브랜치/커밋에 보이면 `gh issue view`.

**제목**: commitlint와 같은 형식 `type: 제목`, 50자 이하, 한국어. 브랜치가 squash merge되면 이 제목이 커밋 메시지가 되므로 같은 규칙을 쓴다.

**본문** (한국어, 아래 틀을 기본으로 하되 해당 없는 섹션은 뺀다):

```markdown
## 요약

무엇을, 왜 바꿨는지 1~3문장.

## 변경 사항

- 계층/파일 단위로 핵심만 (api → context → components 등)

## 테스트

- 단위 테스트: 추가/변경한 것
- E2E: (승인 후 실행 결과를 여기에 채운다 — 초안 단계에서는 "PR 생성 전 실행 예정")

## 관련 이슈

Closes #N (이슈가 확인될 때만. 추측해서 쓰지 않는다)
```

본문 끝에 시스템이 지정한 PR 어트리뷰션 줄(🤖 Generated with Claude Code)을 붙인다.

### 2. 승인 요청 (게이트)

초안(base 브랜치, 제목, 본문)을 그대로 보여주고 묻는다: **"이대로 진행할까요? 수정할 부분이 있으면 알려주세요."** 사용자가 수정을 요청하면 반영해서 다시 보여주고 재승인을 받는다. 명시적 승인 전에는 3단계로 가지 않는다.

### 3. E2E 실행

```bash
npm run test:e2e
```

- Playwright가 별도 API(`e2e/start-api.mjs`, `e2e/seed.json` 복사본)를 3001 포트에 띄우므로 개발용 `db.json`은 영향받지 않는다. 그 대신 **개발 서버(`npm run dev`/`npm run server`)가 3001을 쓰고 있으면 충돌**한다. 포트 충돌로 실패하면 이를 테스트 실패와 구분해서 알리고, 사용자에게 서버를 끄도록 안내한다(임의로 프로세스를 종료하지 않는다). 이 경우는 4단계의 "버그 복구 절차"가 아니라 환경 문제다.
- 실행 시간이 길 수 있으므로 타임아웃을 넉넉히(최대 600000ms) 준다.
- 종료 코드와 통과/실패 개수를 기록한다.

### 4. E2E 실패 시: PR 생성 중단

PR을 만들지 않고, push도 하지 않는다. 실패한 테스트 이름과 에러 요지를 요약한 뒤 아래 안내를 **그대로** 출력한다.

```
❌ E2E 실패 — PR 생성을 중단했습니다.

다음 순서로 처리하세요.
① Trace Viewer 실행 (npx playwright show-report) → 실패 지점 확인
② 어느 레이어(API / 렌더링 / 로직)에서 깨졌는지 판별
③ 해당 단위 테스트에 케이스 추가 (Red)
④ 프로덕션 코드 수정 (Green) → 다시 /create-pr

⚠ E2E 코드를 고쳐 통과시키는 것은 금지 — 근본 원인 회피.
```

안내에 덧붙일 프로젝트 특화 정보 (도움이 될 때만 짧게):

- 이 프로젝트의 `playwright.config.ts`는 `trace: 'on-first-retry'`이고 `retries`는 CI에서만 1이다. 즉 **로컬에서는 기본적으로 trace가 남지 않는다.** 리포트에 trace가 없으면 `npx playwright test <실패 spec> --trace on`으로 해당 테스트만 다시 돌려 trace를 만든 뒤 `npx playwright show-report`를 열라고 안내한다. (설정 파일은 고치지 않는다.)
- 레이어 판별 힌트: 네트워크 탭에서 요청이 실패/잘못된 응답이면 **API**(`src/api/`), 응답은 맞는데 화면이 안 바뀌면 **렌더링**(components), 화면과 요청은 맞지만 값/상태가 틀리면 **로직**(Context, `utils/`, `hooks/`).
- 복구 후 다시 `/create-pr`을 호출하면 0단계부터 다시 시작한다. 승인된 초안은 유효하지만 변경 내용이 달라졌을 수 있으므로 초안을 다시 확인받는다.

개발자가 `npx playwright show-report`를 직접 실행해야 하는 경우(브라우저가 열리는 서버 프로세스)가 많다. 이 스킬이 대신 실행해 세션을 붙잡지 않는다. 사용자가 원하면 `! npx playwright show-report`를 안내한다.

### 5. E2E 통과 시: push + PR 생성

1. push: 업스트림이 없으면 `git push -u origin <현재 브랜치>`, 있으면 `git push`. 훅/원격 오류가 나면 직접 해결하지 말고 원인(파일·메시지)을 보고하고 멈춘다.
2. PR 생성: 본문은 줄바꿈/특수문자가 깨지지 않도록 heredoc으로 넘긴다. 본문의 E2E 항목은 실제 결과(통과 N개)로 채운다.

```bash
gh pr create --base <base> --title "<제목>" --body "$(cat <<'EOF'
<본문>
EOF
)"
```

3. 결과 PR URL을 보여준다.

### 6. 마무리 보고

- PR URL, base 브랜치, E2E 결과를 요약한다.
- 다음 단계를 제안하고 승인을 기다린다: 리뷰/CI 확인 → squash merge → 이슈 클로즈. 자동으로 머지하지 않는다.
