# 4단계: 멀티 에이전트 & MCP 확장

> ⏱️ 예상 학습 기간: **2주~**
> 🎯 목표: 여러 에이전트를 병렬로 조율하고, 외부 서비스와 연동하는 고급 워크플로우 구성하기

---

## 📋 학습 목표 체크리스트

- [ ] 멀티 에이전트 병렬 실행 이해
- [ ] 에이전트 간 Task 도구로 위임(delegation) 구현
- [ ] MCP(Model Context Protocol) 개념 이해
- [ ] GitHub / Slack / DB 등 외부 서비스와 MCP로 연동
- [ ] 실무 수준의 자율 워크플로우 설계

---

## 1. 멀티 에이전트란?

OpenCode는 **동일한 프로젝트에서 여러 에이전트를 동시에 실행**할 수 있습니다.

```
단일 에이전트 방식:
  작업 A → 작업 B → 작업 C (순차, 느림)

멀티 에이전트 방식:
  에이전트 1: 작업 A ─┐
  에이전트 2: 작업 B ─┼→ 결과 통합
  에이전트 3: 작업 C ─┘ (병렬, 빠름)
```

### 언제 멀티 에이전트를 쓰나?

- 독립적인 모듈을 동시에 개발할 때
- 여러 파일을 병렬로 리뷰할 때
- 테스트 작성 & 기능 구현을 동시에 할 때
- 긴 분석 작업을 분할해 빠르게 처리할 때

---

## 2. 에이전트 간 위임: Task 도구

에이전트가 다른 에이전트에게 작업을 넘길 수 있습니다.

### 오케스트레이터 에이전트 예시

```markdown
<!-- .opencode/agents/orchestrator.md -->
---
description: 큰 작업을 분석하고 전문 에이전트에게 위임하는 오케스트레이터
model: claude-sonnet-4-20250514
mode: primary
---

당신은 작업 조율자(orchestrator)입니다.
사용자의 요청을 분석하고, 적절한 서브 에이전트에게 작업을 위임하세요.

사용 가능한 서브 에이전트:
- @feature-builder: 새 기능 구현
- @test-writer: 테스트 작성
- @doc-writer: 문서화
- @security-reviewer: 보안 검토

작업을 분해하고 각 에이전트에게 Task 도구로 위임한 뒤 결과를 종합하세요.
```

### 서브 에이전트 예시

```markdown
<!-- .opencode/agents/feature-builder.md -->
---
description: 기능 구현 전문 에이전트
model: claude-sonnet-4-20250514
mode: subagent
hidden: true
permissions:
  - read
  - write
---

당신은 시니어 소프트웨어 엔지니어입니다.
주어진 명세에 따라 코드를 구현하세요.
- 기존 코드 패턴과 일관성을 유지하세요
- 엣지 케이스를 고려하세요
- 주요 로직에 주석을 달아주세요
```

```markdown
<!-- .opencode/agents/test-writer.md -->
---
description: 테스트 작성 전문 에이전트
model: claude-sonnet-4-20250514
mode: subagent
hidden: true
permissions:
  - read
  - write
---

당신은 QA 엔지니어입니다.
구현된 코드에 대한 포괄적인 테스트를 작성하세요.
- 단위 테스트, 통합 테스트를 구분하세요
- 경계값, 예외 케이스를 반드시 포함하세요
- 테스트 커버리지 80% 이상을 목표로 하세요
```

---

## 3. 병렬 멀티 에이전트 실전 예시

### 예시: 새 기능을 병렬로 구현 + 테스트

```
[오케스트레이터에게 요청]
"결제 시스템에 환불 기능을 추가해줘.
 기능 구현과 테스트 작성을 동시에 진행해줘."

[오케스트레이터 처리]
1. feature-builder에게 위임: 환불 로직 구현
2. test-writer에게 위임: 환불 테스트 케이스 작성  
   (두 작업을 병렬로 실행)
3. 결과 통합 후 보고
```

---

## 4. MCP (Model Context Protocol) 이해

MCP는 AI가 외부 도구·서비스와 통신하기 위한 **표준 프로토콜**입니다.  
"AI를 위한 USB-C 포트"라고 생각하면 됩니다.

```
OpenCode ←→ MCP ←→ GitHub
                ←→ Slack
                ←→ PostgreSQL
                ←→ Jira
                ←→ Notion
```

### MCP 설정 방법

`~/.config/opencode/config.json` 에 추가:

```json
{
  "mcp": {
    "servers": {
      "github": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_TOKEN": "ghp_your_token_here"
        }
      },
      "postgres": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {
          "DATABASE_URL": "postgresql://user:pass@localhost/mydb"
        }
      },
      "slack": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-slack"],
        "env": {
          "SLACK_BOT_TOKEN": "xoxb-your-token"
        }
      }
    }
  }
}
```

---

## 5. MCP 활용 실전 워크플로우

### 워크플로우 A: PR 자동 리뷰 → Slack 알림

```
사용자 요청:
"PR #42를 리뷰하고 결과를 #dev-review Slack 채널에 보내줘"

OpenCode 처리:
1. GitHub MCP → PR #42 코드 diff 가져오기
2. Review 에이전트 → 코드 분석
3. Slack MCP → #dev-review 채널에 리뷰 결과 전송
```

```
[TUI에서]
GitHub PR #42를 리뷰하고, 버그와 개선사항을 찾아서
#dev-review 슬랙 채널에 요약을 보내줘.
```

### 워크플로우 B: DB 스키마 기반 코드 자동 생성

```
[TUI에서]
PostgreSQL에서 users 테이블 스키마를 읽고,
TypeScript 타입 정의, Zod 유효성 검사 스키마,
그리고 CRUD Repository 클래스를 생성해줘.
```

### 워크플로우 C: Jira 이슈 기반 코드 구현

```
[TUI에서]
Jira에서 내 담당 이슈 중 "In Progress" 상태인 것들을 가져오고,
가장 우선순위가 높은 이슈의 명세를 분석해서
구현 계획을 세워줘.
```

---

## 6. 자주 쓰는 MCP 서버 목록

| 서버 | 패키지 | 용도 |
|------|--------|------|
| GitHub | `@modelcontextprotocol/server-github` | PR, 이슈, 코드 탐색 |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | DB 쿼리, 스키마 조회 |
| Slack | `@modelcontextprotocol/server-slack` | 메시지 전송, 채널 조회 |
| Filesystem | `@modelcontextprotocol/server-filesystem` | 파일 시스템 접근 |
| Brave Search | `@modelcontextprotocol/server-brave-search` | 웹 검색 |
| Notion | `@modelcontextprotocol/server-notion` | 문서 읽기/쓰기 |
| Google Drive | `@modelcontextprotocol/server-gdrive` | 드라이브 파일 접근 |

---

## 7. 실습 과제

**과제 1**: GitHub MCP를 연결하고, 아래 명령을 실행해보세요.
```
내 최근 커밋 10개를 분석하고 커밋 메시지 품질을 평가해줘.
```

**과제 2**: 오케스트레이터 에이전트를 만들고 두 개의 서브 에이전트에게 독립적인 작업을 위임해보세요.

**과제 3**: 본인 팀의 실제 워크플로우 중 자동화할 수 있는 것을 하나 선택해 MCP 기반 워크플로우로 설계해보세요.

---

## ✅ 4단계 완료 기준

- MCP 서버를 최소 1개 연결해서 외부 서비스와 대화할 수 있다
- 오케스트레이터 에이전트가 서브 에이전트에게 작업을 위임하는 흐름을 구현했다
- 실무에서 반복하던 작업 하나를 에이전트 워크플로우로 대체했다

---

**← 이전 단계** [03_자동화_커스텀명령.md](./03_자동화_커스텀명령.md) | **다음 단계 →** [05_아키텍처_심화.md](./05_아키텍처_심화.md)
