# husky + lint-staged — 커밋할 때 자동으로 코드 점검하기

> **목적**: husky와 lint-staged가 뭔지 이해하고, 프로젝트에 직접 설정할 수 있게 된다.
> 완료 후에는 `git commit`만 하면 lint/format이 자동으로 돌아가는 환경이 만들어진다.
>
> **소요 시간**: 약 20분
>
> **사전 준비**: Node.js 18+, npm, Git이 초기화된 프로젝트

---

## 목차

1. [왜 필요한가?](#1-왜-필요한가)
2. [Git hook이 뭔가?](#2-git-hook이-뭔가)
3. [husky가 뭔가?](#3-husky가-뭔가)
4. [lint-staged가 뭔가?](#4-lint-staged가-뭔가)
5. [직접 설정해 보기](#5-직접-설정해-보기)
6. [동작 확인하기](#6-동작-확인하기)
7. [자주 묻는 질문](#7-자주-묻는-질문)

---

## 1. 왜 필요한가?

코드를 커밋하기 전에 lint나 format을 돌려야 한다는 건 알지만, 사람은 잊어버린다.

````
"아 lint 안 돌리고 푸시해버렸다..."
"prettier 안 돌려서 diff가 지저분하다..."
```

이걸 사람이 기억하는 대신, **커밋할 때 자동으로 실행**되게 만들면 된다.
그 도구가 husky + lint-staged이다.

---

## 2. Git hook이 뭔가?

Git에는 **특정 시점에 스크립트를 자동 실행**하는 기능이 내장되어 있다. 이걸 "hook"이라 부른다.

```
git commit 실행
  ├── pre-commit   ← 커밋 직전에 실행 (여기서 lint를 돌린다)
  ├── commit-msg   ← 커밋 메시지 검증
  └── 커밋 완료
```

직접 확인해 볼 수 있다:

```bash
ls .git/hooks/
```

`pre-commit.sample`, `commit-msg.sample` 같은 파일들이 보인다.
`.sample`을 떼면 실제로 동작하는데, 문제가 있다:

- `.git/hooks/`는 Git으로 추적되지 않는다 (공유 불가)
- 쉘 스크립트를 직접 관리해야 한다 (번거롭다)

**husky는 이 문제를 해결한다.**

---

## 3. husky가 뭔가?

husky는 Git hook을 **프로젝트 코드로 관리**할 수 있게 해주는 도구다.

### husky 없이 (기존 방식)

```
.git/hooks/pre-commit   ← Git이 추적 안 함, 팀원과 공유 불가
```

### husky 있으면

```
.husky/pre-commit        ← 프로젝트 파일로 존재, Git으로 공유 가능
```

`npm install` 시 husky가 자동으로 `.git/hooks/`를 `.husky/`로 연결해준다.
결과적으로 팀원이 clone + install만 하면 같은 hook이 동작한다.

### husky가 하는 일 요약

| 기존                               | husky 사용                     |
| ---------------------------------- | ------------------------------ |
| `.git/hooks/`에 직접 스크립트 작성 | `.husky/` 폴더에 파일로 관리   |
| 팀원마다 따로 설정                 | `npm install`만 하면 자동 적용 |
| 버전 관리 불가                     | Git으로 추적, PR 리뷰 가능     |

---

## 4. lint-staged가 뭔가?

pre-commit hook에서 lint를 돌릴 때, **모든 파일**을 검사하면 느리고 불필요하다.
lint-staged는 `git add`로 **스테이징된 파일만** 대상으로 명령을 실행한다.

### lint-staged 없이

```bash
# pre-commit에서 이렇게 하면?
npx markdownlint-cli2 "**/*.md"
# → 프로젝트의 모든 .md 파일을 검사 (내가 안 건드린 파일까지)
```

### lint-staged 있으면

```bash
# 내가 수정해서 git add한 파일만 검사
# 예: docs/guide.md만 수정했으면 그것만 검사
```

### 전체 흐름

```
git commit
  → husky가 pre-commit hook 실행
    → lint-staged가 스테이징된 파일만 골라서
      → *.md 파일이면 → markdownlint --fix → prettier --write
      → *.ts 파일이면 → eslint --fix
      → 에러가 남아있으면 → 커밋 차단
      → 깨끗하면 → 커밋 완료
```

---

## 5. 직접 설정해 보기

### Step 1 — 패키지 설치

```bash
npm install -D husky lint-staged
```

### Step 2 — husky 초기화

```bash
npx husky init
```

이 명령이 하는 일:

- `.husky/` 폴더 생성
- `.husky/pre-commit` 파일 생성 (기본 내용: `npm test`)
- `package.json`에 `"prepare": "husky"` 스크립트 추가

### Step 3 — pre-commit hook 수정

`.husky/pre-commit` 파일을 열어서 내용을 바꾼다:

```bash
npx lint-staged
```

이제 커밋할 때 `npm test` 대신 `lint-staged`가 실행된다.

### Step 4 — lint-staged 설정

`package.json`에 추가한다:

```json
{
  "lint-staged": {
    "*.md": ["markdownlint-cli2 --fix", "prettier --write"]
  }
}
```

이 설정의 의미:

- 스테이징된 파일 중 `*.md`에 해당하는 것만 골라서
- `markdownlint-cli2 --fix`를 먼저 실행하고 (lint 에러 자동 수정)
- `prettier --write`를 실행한다 (포맷 정리)
- 명령이 실패(exit code !== 0)하면 커밋이 차단된다

### 최종 파일 구조

```
프로젝트/
├── .husky/
│   └── pre-commit          ← "npx lint-staged"
├── package.json            ← lint-staged 설정 포함
└── ...
```

---

## 6. 동작 확인하기

### 정상 케이스

```bash
# markdown 파일 하나 수정
echo "# 테스트" >> docs/test.md

# 스테이징
git add docs/test.md

# 커밋 — lint-staged가 자동으로 돌아간다
git commit -m "test: lint-staged 동작 확인"
```

출력 예시:

```
✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up...
[main abc1234] test: lint-staged 동작 확인
```

### 에러 케이스

lint 규칙에 어긋나는 내용이 있고, `--fix`로 자동 수정이 안 되는 경우:

```
✖ markdownlint-cli2 --fix:
  docs/test.md:3 MD040 Fenced code blocks should have a language specified
✖ 1 file(s) failed.
husky - pre-commit hook exited with code 1 (error)
```

커밋이 차단된다. 에러를 수정하고 다시 커밋하면 된다.

---

## 7. 자주 묻는 질문

### Q. hook을 임시로 건너뛰고 싶으면?

```bash
git commit --no-verify -m "긴급 수정"
```

`--no-verify` 플래그가 pre-commit hook을 건너뛴다.
단, 습관적으로 쓰면 hook을 설정한 의미가 없어지니 정말 급할 때만 사용한다.

### Q. CI에서도 lint를 돌려야 하나?

**예.** hook은 로컬에서만 동작하고, `--no-verify`로 우회할 수도 있다.
CI에서 한 번 더 검증하는 게 안전하다. hook은 "빠른 피드백", CI는 "최종 방어선"이다.

### Q. TypeScript나 CSS도 같이 검사하려면?

`lint-staged` 설정에 패턴을 추가하면 된다:

```json
{
  "lint-staged": {
    "*.md": ["markdownlint-cli2 --fix", "prettier --write"],
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.css": ["prettier --write"]
  }
}
```

### Q. OpenCode나 Claude Code에서 커밋해도 동작하나?

**예.** husky는 Git 자체에 걸리는 hook이다.
어떤 도구를 써서 `git commit`을 하든, Git이 hook을 실행한다.
터미널, VS Code, OpenCode, Claude Code 모두 동일하게 동작한다.

### Q. 팀원이 clone하면 자동으로 적용되나?

`npm install`(또는 `npm ci`)을 실행하면 `package.json`의 `"prepare": "husky"` 스크립트가 자동으로 실행되어 hook이 설정된다. 별도 작업이 필요 없다.
````
