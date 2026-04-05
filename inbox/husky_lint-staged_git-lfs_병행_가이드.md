# Husky + lint-staged + Git LFS 병행 가이드

> **목적**: Husky/lint-staged와 Git LFS를 한 프로젝트에서 함께 사용할 때 발생하는 충돌을 이해하고, 안전하게 설정할 수 있게 된다.
>
> **사전 지식**: [husky*lint-staged*가이드.md](husky_lint-staged_가이드.md), [git-lfs-guide.md](git-lfs-guide.md)

---

## 목차

1. [왜 충돌이 생기나?](#1-왜-충돌이-생기나)
2. [Hook 공존 문제와 해결](#2-hook-공존-문제와-해결)
3. [lint-staged와 LFS 파일 패턴 분리](#3-lint-staged와-lfs-파일-패턴-분리)
4. [설정 순서](#4-설정-순서)
5. [최종 파일 구조](#5-최종-파일-구조)
6. [동작 확인하기](#6-동작-확인하기)
7. [체크리스트](#7-체크리스트)

---

## 1. 왜 충돌이 생기나?

Husky와 Git LFS는 둘 다 **Git hook을 사용**한다. 문제는 같은 hook 파일을 서로 덮어쓸 수 있다는 점이다.

```
.git/hooks/
├── pre-commit      ← husky가 사용 (lint-staged 실행)
├── pre-push        ← Git LFS가 사용 (LFS 객체 푸시)
├── post-merge      ← Git LFS가 사용 (LFS 객체 체크아웃)
└── post-checkout   ← Git LFS가 사용 (LFS 객체 체크아웃)
```

husky는 `.git/hooks/`를 `.husky/` 폴더로 리다이렉트한다.
이때 Git LFS가 설치한 hook이 무시되면서 **LFS 파일이 제대로 푸시/풀되지 않는** 현상이 발생한다.

또 하나의 문제는 lint-staged가 스테이징된 파일에 명령을 실행하는데, LFS 추적 대상 파일이 포함되면 **LFS 포인터 텍스트에 lint를 시도**해서 오류가 날 수 있다.

---

## 2. Hook 공존 문제와 해결

husky가 hook을 관리하므로, LFS가 필요로 하는 hook을 `.husky/` 안에 명시적으로 추가해야 한다.

### pre-push

LFS 객체를 원격에 푸시하는 핵심 hook이다. 이것이 빠지면 포인터만 올라가고 실제 파일은 올라가지 않는다.

```bash
# .husky/pre-push
git lfs pre-push "$@"
```

### post-merge

`git pull`이나 `git merge` 후 LFS 파일을 체크아웃한다. 빠지면 pull 후 파일이 포인터 텍스트로 보인다.

```bash
# .husky/post-merge
git lfs post-merge "$@"
```

### post-checkout

브랜치 전환 시 LFS 파일을 체크아웃한다.

```bash
# .husky/post-checkout
git lfs post-checkout "$@"
```

### pre-commit (기존 lint-staged와 합치기)

기존 `.husky/pre-commit`에 LFS 명령을 추가한다:

```bash
# .husky/pre-commit
git lfs pre-commit "$@"
npx lint-staged
```

`git lfs pre-commit`이 먼저 실행되어야 LFS 포인터 변환이 정상적으로 이루어진 후 lint-staged가 동작한다.

---

## 3. lint-staged와 LFS 파일 패턴 분리

### 핵심 원칙

> **lint-staged가 실행하는 명령의 대상과 LFS 추적 대상이 겹치면 안 된다.**

### 예시: docs 디렉토리 정책

`.gitattributes`에서 docs 아래 바이너리는 LFS, markdown은 일반 Git으로 관리하는 경우:

```gitattributes
docs/** filter=lfs diff=lfs merge=lfs -text
docs/**/*.md -filter -diff -merge text
docs/**/*.MD -filter -diff -merge text
```

이 설정에서 `*.md`는 LFS에서 제외되므로 lint-staged에서 안전하게 처리할 수 있다:

```json
{
  "lint-staged": {
    "*.md": ["markdownlint-cli2 --fix", "prettier --write"]
  }
}
```

### 위험한 패턴 예시

만약 `.gitattributes`에서 `*.md`도 LFS로 추적하면서 lint-staged에서도 `*.md`를 처리하면:

```
1. git add docs/guide.md
2. Git LFS가 guide.md를 포인터로 변환
3. lint-staged가 포인터 텍스트에 markdownlint 실행
4. 포인터 텍스트가 markdown 문법 에러로 잡힘 → 커밋 차단
```

### 패턴 정합성 확인 방법

```bash
# LFS가 추적하는 패턴 확인
git lfs track

# .gitattributes 전체 확인
cat .gitattributes

# 실제로 LFS로 관리되는 파일 목록
git lfs ls-files
```

lint-staged 설정의 glob 패턴과 대조해서 겹치는 부분이 없는지 확인한다.

---

## 4. 설정 순서

새 프로젝트에 처음 설정하는 경우 아래 순서를 따른다.

### Step 1 — Git LFS 설치 및 추적 규칙 설정

```bash
brew install git-lfs
git lfs install
```

`.gitattributes`에 추적 규칙을 작성한다:

```bash
git lfs track "*.zip"
git lfs track "*.hwp"
git lfs track "*.mp4"
```

텍스트 파일을 LFS에서 명시적으로 제외한다:

```gitattributes
docs/** filter=lfs diff=lfs merge=lfs -text
docs/**/*.md -filter -diff -merge text
```

```bash
git add .gitattributes
git commit -m "chore: add git lfs tracking rules"
```

### Step 2 — husky + lint-staged 설치

```bash
npm install -D husky lint-staged
npx husky init
```

### Step 3 — husky hook 파일에 LFS 명령 추가

```bash
# .husky/pre-commit 수정
echo 'git lfs pre-commit "$@"
npx lint-staged' > .husky/pre-commit

# LFS용 hook 추가
echo 'git lfs pre-push "$@"' > .husky/pre-push
echo 'git lfs post-merge "$@"' > .husky/post-merge
echo 'git lfs post-checkout "$@"' > .husky/post-checkout
```

### Step 4 — lint-staged 설정 (LFS 대상 제외 확인)

`package.json`에 추가:

```json
{
  "lint-staged": {
    "*.md": ["markdownlint-cli2 --fix", "prettier --write"]
  }
}
```

### Step 5 — 커밋

```bash
git add .husky/ package.json
git commit -m "chore: configure husky, lint-staged with git lfs hooks"
```

---

## 5. 최종 파일 구조

```
프로젝트/
├── .gitattributes              ← LFS 추적 규칙
├── .husky/
│   ├── pre-commit              ← git lfs pre-commit + npx lint-staged
│   ├── pre-push                ← git lfs pre-push
│   ├── post-merge              ← git lfs post-merge
│   └── post-checkout           ← git lfs post-checkout
├── package.json                ← lint-staged 설정 + prepare 스크립트
└── ...
```

---

## 6. 동작 확인하기

### LFS hook 동작 확인

```bash
# LFS 추적 대상 파일 추가
git add assets/large-file.zip
git commit -m "test: lfs file commit"
git push
# → "Uploading LFS objects" 메시지가 나오면 정상
```

### lint-staged 동작 확인

```bash
# markdown 파일 수정
echo "# 테스트" >> docs/test.md
git add docs/test.md
git commit -m "test: lint-staged 동작 확인"
# → lint-staged가 markdownlint + prettier를 실행하면 정상
```

### LFS 파일에 lint가 안 걸리는지 확인

```bash
git lfs ls-files
# 여기 나오는 파일이 lint-staged 대상에 포함되지 않는지 확인
```

---

## 7. 체크리스트

| 항목           | 확인 사항                                                                            | 확인 |
| -------------- | ------------------------------------------------------------------------------------ | ---- |
| hook 공존      | `.husky/pre-push`에 `git lfs pre-push` 호출이 있는가                                 | ☐    |
| hook 공존      | `.husky/post-merge`에 `git lfs post-merge` 호출이 있는가                             | ☐    |
| hook 공존      | `.husky/post-checkout`에 `git lfs post-checkout` 호출이 있는가                       | ☐    |
| hook 순서      | `.husky/pre-commit`에서 `git lfs pre-commit`이 `npx lint-staged`보다 먼저 실행되는가 | ☐    |
| 패턴 분리      | lint-staged 대상 glob과 LFS 추적 패턴이 겹치지 않는가                                | ☐    |
| .gitattributes | 텍스트 파일(md 등)이 LFS에서 명시적으로 제외되어 있는가                              | ☐    |
| 설치 순서      | `git lfs install` 후에 `npx husky init`을 실행했는가                                 | ☐    |
| 팀 공유        | `.husky/` 폴더와 `.gitattributes`가 모두 커밋되어 있는가                             | ☐    |
