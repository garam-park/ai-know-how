# 05-C-12. cron + 백업 쉘 스크립트 작성

**번호**: 05-C-12
**제목**: cron + 백업 쉘 스크립트 작성
**유형**: 실습 (15~20분)
**이전**: [05-C-11. pg_restore로 복구하기](../05-C-11-pg-restore-복구.md)
**다음**: [05-C-13. rclone으로 R2/S3에 백업 업로드 자동화](../05-C-13-rclone-백업업로드.md)

---

## 이 파일에서 하는 것

PostgreSQL 데이터베이스를 **매일 자동으로 백업**하도록 설정합니다.
쉘 스크립트(`.sh`)와 **cron**(크론)을 조합하여 정기적인 백업을 자동화합니다.

### FE 개발자를 위한 비유

- **cron**: GitHub Actions의 `schedule` 이벤트 또는 Vercel의 Cron Jobs와 같습니다.
- **쉘 스크립트**: 매번 손으로 입력하는 PostgreSQL 백업 명령어를 자동으로 실행하는 "자동화 스크립트"입니다.
- **조합**: 매일 새벽 3시에 자동으로 스크립트가 실행되어 최신 백업을 생성합니다.

---

## 사전 조건

- ✅ `pg_dump` 사용법 이해 ([05-C-10](../05-C-10-pg-dump-백업.md) 완료)
- ✅ 서버에 SSH로 접속 가능
- ✅ PostgreSQL이 설치되어 있고 `psql` / `pg_dump` 명령어 사용 가능
- ✅ 기본 쉘 스크립트(Bash) 문법 이해

---

## Step 1. 백업 쉘 스크립트 작성 (backup.sh)

### 목표

데이터베이스를 **날짜 기반 파일명**으로 백업하고, **오래된 백업을 자동으로 삭제**하는 스크립트를 만듭니다.

### 작업 내용

서버에 접속한 후, 백업 디렉토리를 생성하고 스크립트를 작성합니다.

```bash
# 1. 백업을 저장할 디렉토리 생성
mkdir -p ~/backups
cd ~/backups

# 2. 백업 스크립트 작성
cat > backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# ===============================================
# PostgreSQL 자동 백업 스크립트
# 매일 새벽에 cron으로 실행될 예정
# ===============================================

# cron 환경에서는 PATH가 제한적이므로 절대경로 사용 권장
# PG_DUMP="/usr/bin/pg_dump"  # which pg_dump 로 확인

# 설정 값
DB_USER="postgres"           # PostgreSQL 사용자
DB_NAME="myapp"              # 백업할 데이터베이스명 (예: supabase)
BACKUP_DIR="$HOME/backups"   # 백업 저장 디렉토리
LOG_FILE="$BACKUP_DIR/backup.log"
RETENTION_DAYS=7             # 7일 이상 된 백업 자동 삭제

# 날짜 변수 (YYYY-MM-DD-HHmmss 형식)
BACKUP_DATE=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${BACKUP_DATE}.sql.gz"

# ===============================================
# Step 1: 백업 실행
# ===============================================
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 시작: $DB_NAME" >> "$LOG_FILE"

pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F p \
  -v 2>> "$LOG_FILE" \
  | gzip > "$BACKUP_FILE"

# 백업 성공 여부 확인
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 완료: $BACKUP_FILE ($BACKUP_SIZE)" >> "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 실패!" >> "$LOG_FILE"
  exit 1
fi

# ===============================================
# Step 2: 오래된 백업 자동 삭제 (7일 이상)
# ===============================================
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 오래된 백업 정리 시작" >> "$LOG_FILE"

find "$BACKUP_DIR" \
  -name "backup_${DB_NAME}_*.sql.gz" \
  -mtime +$RETENTION_DAYS \
  -delete \
  -print >> "$LOG_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 스크립트 종료" >> "$LOG_FILE"
EOF
```

### 완료 기준

- ✅ `~/backups/backup.sh` 파일이 생성됨
- ✅ 파일 내용이 위의 스크립트와 동일함

---

## Step 2. 스크립트 실행 권한 설정

### 목표

스크립트를 **실행 가능**하게 만듭니다.

### 작업 내용

```bash
# 스크립트에 실행 권한 부여
chmod +x ~/backups/backup.sh

# 권한 확인 (x 플래그 확인)
ls -l ~/backups/backup.sh
```

### 예상 출력

```
-rwxr-xr-x 1 user user 1234 Apr  1 10:00 backup.sh
          ^^^
          실행 권한 확인
```

### 완료 기준

- ✅ 파일 권한에 `x` (실행 가능) 표시가 있음
- ✅ `ls -l`에서 처음 10자리 중 4번째, 7번째, 10번째 자리가 `x`

---

## Step 3. 수동 실행 테스트

### 목표

스크립트가 **제대로 작동**하는지 미리 테스트합니다.

### 작업 내용

```bash
# 스크립트 수동 실행
~/backups/backup.sh

# 로그 확인
cat ~/backups/backup.log

# 백업 파일 확인
ls -lh ~/backups/backup_*.sql.gz
```

### 예상 출력

```
$ cat ~/backups/backup.log
[2026-04-01 10:15:23] 백업 시작: myapp
[2026-04-01 10:15:45] 백업 완료: /home/user/backups/backup_myapp_2026-04-01-101545.sql.gz (245M)
[2026-04-01 10:15:46] 오래된 백업 정리 시작
[2026-04-01 10:15:46] 백업 스크립트 종료

$ ls -lh ~/backups/backup_*.sql.gz
-rw-r--r-- 1 user user 245M Apr  1 10:15 backup_myapp_2026-04-01-101545.sql.gz
```

### 완료 기준

- ✅ 백업 파일이 생성됨
- ✅ 로그에 "백업 완료" 메시지가 있음
- ✅ 백업 파일 크기가 0이 아님 (실제 데이터가 포함됨)

---

## Step 4. cron 기본 문법 이해

### 목표

**cron의 스케줄 형식**을 이해합니다.

### cron 스케줄 형식

```
분  시  일  월  요일  명령어
0   3   *   *   *     ~/backups/backup.sh
│   │   │   │   │
│   │   │   │   └─ 요일 (0=일요일, 1=월요일, ..., 6=토요일)
│   │   │   └───── 월 (1~12)
│   │   └───────── 일 (1~31)
│   └───────────── 시 (0~23, 24시간 형식)
└─────────────── 분 (0~59)
```

### 자주 사용하는 예시

| 스케줄 | 의미 |
|--------|------|
| `0 3 * * *` | 매일 새벽 3시 0분 |
| `0 */6 * * *` | 매 6시간마다 (0시, 6시, 12시, 18시) |
| `0 2 * * 0` | 매주 일요일 새벽 2시 |
| `0 1 1 * *` | 매월 1일 새벽 1시 |
| `30 14 * * 1-5` | 평일(월~금) 오후 2시 30분 |

### 완료 기준

- ✅ cron 스케줄의 다섯 가지 필드를 이해함
- ✅ 예시를 보고 스케줄의 의미를 설명할 수 있음

---

## Step 5. crontab에 백업 스크립트 등록

### 목표

cron이 **매일 새벽 3시에 백업 스크립트를 자동으로 실행**하도록 설정합니다.

### 작업 내용

```bash
# crontab 편집기 열기
crontab -e
```

편집기가 열리면 (nano 또는 vim), 다음 줄을 추가합니다:

```bash
# PostgreSQL 자동 백업 (매일 새벽 3시)
0 3 * * * /home/user/backups/backup.sh >> /home/user/backups/cron.log 2>&1
```

### 주의사항

- **절대 경로 사용**: `/home/user/backups/backup.sh` (상대 경로 `~/` 사용 금지)
- **로그 리다이렉트**: `>> ... 2>&1`로 stdout과 stderr을 모두 기록
- **저장 및 종료**: `Ctrl+O` (저장) → `Enter` → `Ctrl+X` (nano의 경우)

### 확인

```bash
# 등록된 crontab 확인
crontab -l
```

### 예상 출력

```
# PostgreSQL 자동 백업 (매일 새벽 3시)
0 3 * * * /home/user/backups/backup.sh >> /home/user/backups/cron.log 2>&1
```

### 완료 기준

- ✅ `crontab -l`에 백업 스크립트 항목이 보임
- ✅ 스케줄이 `0 3 * * *` (매일 새벽 3시)로 설정됨
- ✅ 로그 파일 경로가 절대 경로임

---

## Step 6. cron 로그 확인 및 실행 검증

### 목표

cron이 **제대로 스크립트를 실행했는지** 확인합니다.

### 작업 내용

cron 실행은 매일 새벽 3시이므로, 즉시 테스트하려면:

```bash
# 현재 시간을 새벽 3시 이후로 설정하여 테스트
# (또는 다음 날 새벽까지 대기)

# cron 로그 확인 (시스템 로그)
tail -f /var/log/syslog  # Debian/Ubuntu
# 또는
tail -f /var/log/cron    # CentOS/RHEL

# 우리가 지정한 로그 파일 확인
tail -f /home/user/backups/cron.log
```

### 테스트: 즉시 cron 실행

다음 날까지 기다리기 싫다면, crontab을 임시로 매 1분마다 실행하도록 변경:

```bash
# 매 1분마다 실행하도록 임시 변경
crontab -e
# 내용: * * * * * /home/user/backups/backup.sh >> /home/user/backups/cron.log 2>&1

# 1분 대기
sleep 60

# 로그 확인
cat /home/user/backups/cron.log

# 테스트 완료 후 원래대로 복구 (새벽 3시)
crontab -e
# 내용: 0 3 * * * /home/user/backups/backup.sh >> /home/user/backups/cron.log 2>&1
```

### 예상 출력

```
$ cat /home/user/backups/cron.log
[2026-04-01 10:20:15] 백업 시작: myapp
[2026-04-01 10:20:38] 백업 완료: /home/user/backups/backup_myapp_2026-04-01-102038.sql.gz (245M)
[2026-04-01 10:20:39] 오래된 백업 정리 시작
[2026-04-01 10:20:39] 백업 스크립트 종료
```

### 완료 기준

- ✅ cron 로그에 스크립트 실행 기록이 있음
- ✅ "백업 완료" 메시지가 포함됨
- ✅ 새로운 백업 파일이 생성됨

---

## 확인 체크리스트

이 파일의 모든 단계를 완료했으면 아래 항목을 확인하세요.

```
☐ Step 1: ~/backups/backup.sh 파일 생성 완료
☐ Step 2: chmod +x로 실행 권한 부여 완료
☐ Step 3: 수동 실행으로 백업 파일 생성 확인
☐ Step 4: cron 스케줄 형식 이해
☐ Step 5: crontab -e로 스크립트 등록 완료
☐ Step 6: cron 로그 확인으로 실행 검증 완료

☐ 매일 새벽 3시에 자동 백업이 실행될 준비 완료
☐ 7일 이상 된 오래된 백업이 자동으로 삭제됨
☐ 백업 로그(/backups/backup.log)가 기록됨
```

---

## 자주 겪는 오류와 해결 방법

### 오류 1: cron이 스크립트를 실행하지 않음

```
증상: crontab -l에 등록되어 있는데 실행이 안됨
```

**원인**: 상대 경로(`~/backups/backup.sh`) 사용
**해결**: **절대 경로**로 변경
```bash
crontab -e
# 변경 전: ~/backups/backup.sh
# 변경 후: /home/user/backups/backup.sh
```

### 오류 2: pg_dump 명령어를 찾을 수 없음

```
pg_dump: command not found
```

**원인**: cron 환경에서 `$PATH` 변수가 제대로 설정되지 않음
**해결**: `pg_dump`의 절대 경로 사용
```bash
# pg_dump 위치 확인
which pg_dump
# 예: /usr/bin/pg_dump 또는 /usr/lib/postgresql/15/bin/pg_dump

# 스크립트에서 절대경로로 설정
PG_DUMP="/usr/bin/pg_dump"  # which pg_dump 로 확인

# 스크립트에서 사용
$PG_DUMP -U postgres -d myapp ...
# 또는 직접 사용
/usr/bin/pg_dump -U postgres -d myapp ...
```

### 오류 3: Permission denied (실행 권한 부족)

```
-bash: ./backup.sh: Permission denied
```

**원인**: 파일에 실행 권한이 없음
**해결**: chmod로 권한 추가
```bash
chmod +x ~/backups/backup.sh
ls -l ~/backups/backup.sh  # x 확인
```

### 오류 4: 데이터베이스 접근 불가

```
pg_dump: [archiver (db)] connection to database "myapp" failed
```

**원인**: PostgreSQL 인증 설정 문제
**해결**: `.pgpass` 파일 또는 crontab 환경에서 암호 설정
```bash
# ~/.pgpass 파일 생성
cat > ~/.pgpass << 'EOF'
localhost:5432:myapp:postgres:your_password
EOF

chmod 600 ~/.pgpass
```

### 오류 5: 로그 파일에 기록이 안됨

```
증상: cron.log가 생성되지 않거나 내용이 없음
```

**원인**: 로그 파일 디렉토리 권한 문제
**해결**: 로그 디렉토리의 쓰기 권한 확인
```bash
chmod 755 ~/backups
ls -ld ~/backups  # drwxr-xr-x 확인
```

### 오류 6: cron 환경 변수 문제

```
증상: 스크립트 내 환경 변수(예: $HOME)가 작동하지 않음
```

**원인**: cron은 최소한의 환경만 제공
**해결**: 스크립트에서 절대 경로 명시
```bash
# 변경 전: $HOME/backups
# 변경 후: /home/user/backups
```

---

## FE 개발자 팁

### GitHub Actions와 cron 비교

| 항목 | GitHub Actions | cron (서버) |
|------|----------------|-----------|
| **트리거** | `on: schedule:` | crontab |
| **스케줄 형식** | cron 표현식 | 5필드 cron |
| **로그** | Actions 탭에서 확인 | 파일 또는 `/var/log/syslog` |
| **실패 알림** | 자동 이메일 | 별도 설정 필요 |
| **환경변수** | 명시적 선언 | 최소 환경만 제공 |

```yaml
# GitHub Actions의 예시
on:
  schedule:
    - cron: '0 3 * * *'  # 매일 새벽 3시
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - run: ./backup.sh
```

---

## 다음 단계

다음 파일에서는 **rclone**을 사용하여 백업 파일을 **Cloudflare R2 또는 AWS S3**로 자동 업로드합니다.

### 예상 내용
- rclone 설치 및 설정
- R2/S3 원격 저장소 연결
- 백업 파일 자동 업로드
- 오래된 원격 백업 삭제

→ [05-C-13. rclone으로 R2/S3에 백업 업로드 자동화](../05-C-13-rclone-백업업로드.md)

---

## 참고 자료

- [Linux cron 공식 문서](https://man7.org/linux/man-pages/man5/crontab.5.html)
- [PostgreSQL pg_dump 공식 문서](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Bash 스크립트 튜토리얼](https://www.gnu.org/software/bash/manual/)
