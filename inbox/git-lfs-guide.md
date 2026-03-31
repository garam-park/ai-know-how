# Git LFS 가이드

대용량 바이너리 파일(예: 모델 파일, 영상, 대용량 산출물)을 일반 Git 객체로 직접 관리하면 저장소가 빠르게 비대해집니다.
Git LFS(Large File Storage)는 실제 파일 대신 포인터를 Git에 저장하고, 원본 바이너리는 LFS 저장소에 분리 저장해 이 문제를 줄여줍니다.

## 1) 설치 및 초기 설정

macOS(Homebrew):

```bash
brew install git-lfs
git lfs install
```

확인:

```bash
git lfs version
git lfs env
```

## 2) 어떤 파일을 LFS로 관리할지 지정

예시:

```bash
git lfs track "*.zip"
git lfs track "*.hwp"
git lfs track "*.mp4"
```

프로젝트 정책 예시(`docs`는 대부분 LFS, `md`만 제외):

```gitattributes
docs/** filter=lfs diff=lfs merge=lfs -text
docs/**/*.md -filter -diff -merge text
docs/**/*.MD -filter -diff -merge text
```

위 명령을 실행하면 `.gitattributes`가 갱신됩니다. 반드시 `.gitattributes`를 함께 커밋하세요.

```bash
git add .gitattributes
git commit -m "chore: add git lfs tracking rules"
```

현재 추적 규칙 확인:

```bash
git lfs track
cat .gitattributes
```

## 3) LFS 파일 추가/커밋/푸시

```bash
git add path/to/large-file.zip
git commit -m "feat: add large asset via git lfs"
git push
```

확인:

```bash
git lfs ls-files
```

## 4) 이미 Git에 올라간 대용량 파일을 LFS로 전환

이미 일반 Git 객체로 커밋된 파일은 `git lfs track`만으로는 전환되지 않습니다.
이 경우 이력 재작성(`migrate import`)이 필요합니다.

예시:

```bash
git lfs migrate import --include="*.zip,*.hwp,*.mp4"
```

주의사항:

- 히스토리가 바뀌므로 팀 협의 후 진행하세요.
- 원격 브랜치 강제 푸시(`--force-with-lease`)가 필요할 수 있습니다.
- 전환 전 백업 브랜치를 권장합니다.

## 5) 클론/풀 시 동작

일반 `git clone`, `git pull` 시 LFS 객체도 함께 내려받습니다.
문제가 있을 때는 아래 명령으로 수동 동기화할 수 있습니다.

```bash
git lfs fetch --all
git lfs pull
```

## 6) 자주 쓰는 점검/문제 해결 명령

```bash
git lfs status
git lfs ls-files
git lfs logs last
```

원격 LFS 업로드 누락 시:

```bash
git lfs push origin --all
```

워킹트리 파일이 포인터로 보이거나 꼬였을 때:

```bash
git lfs checkout
```

## 7) 팀 작업 권장 사항

- 저장소 규칙은 루트 `.gitattributes`에서 일관되게 관리하세요.
- 새 바이너리 확장자 추가 시 PR에 `.gitattributes` 변경을 반드시 포함하세요.
- 불필요한 대용량 산출물은 가능하면 `docs/deliverables` 등 보관 정책과 연계해 관리하세요.

## 8) 빠른 시작(요약)

```bash
brew install git-lfs
git lfs install
git lfs track "*.zip"
git add .gitattributes
git add <large-file>
git commit -m "chore: use git lfs"
git push
```
