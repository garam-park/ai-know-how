# 05-C-13: rclone으로 R2/S3에 백업 업로드 자동화

**실습 목표**: 로컬 PostgreSQL 백업을 클라우드 스토리지(Cloudflare R2 또는 AWS S3)에 자동 업로드하는 시스템 구축
**예상 시간**: 15~20분
**난이도**: 초급~중급

---

## 이 파일에서 하는 것

지금까지 `cron` + 백업 쉘 스크립트로 로컬 디스크에 자동 백업을 했다면, 이제는 그 백업 파일을 **클라우드에 자동으로 업로드**한다.

### FE 개발자를 위한 비유
- **로컬 백업** = 노트북에 소스코드 저장
- **rclone 업로드** = `git push` + 클라우드 배포처럼, 백업을 클라우드 스토리지(R2/S3)에 자동 푸시
- **자동 정리** = Netlify/Vercel의 오래된 빌드 자동 삭제처럼, 30일 이상 오래된 백업 자동 삭제

이렇게 하면 로컬 디스크가 고장 나도 **클라우드에 안전한 백업본**이 있다.

---

## 사전 조건

- ✅ **05-C-12** 백업 쉘 스크립트(`backup.sh`) 완성 및 cron 설정 완료
- ✅ Cloudflare R2 계정 또는 AWS S3 계정 (무료 선택 가능)
- ✅ 해당 계정에서 **Access Key** 및 **Secret Key** 준비

> R2는 월 10GB 무료 스토리지, S3는 월 5GB 무료(1년) 제공

---

## Step 1: rclone 설치

rclone은 60개 이상의 클라우드 스토리지를 지원하는 동기화 도구다.

### 명령어 실행

```bash
# 공식 설치 스크립트 다운로드 및 실행
curl https://rclone.org/install.sh | sudo bash
```

### 설치 확인

```bash
rclone version
```

**예상 출력:**
```
rclone v1.x.x
- os: linux
- arch: amd64
```

### 완료 기준
- `rclone version` 명령어가 버전 정보를 출력해야 함

---

## Step 2: rclone 원격 스토리지 설정

rclone을 처음 사용하면 원격 스토리지 연결 정보를 저장해야 한다. 대화형 설정 도구(`rclone config`)를 사용한다.

### 설정 시작

```bash
rclone config
```

대화형 메뉴가 나타난다. 아래 선택을 따르자.

---

### 옵션 A: Cloudflare R2 설정 (권장)

```
n) New remote
s) Set configuration password
q) Quit config

n/s/q> n

name> r2backup          # 원격 저장소 이름 (영어, 띄어쓰기 없음)

Option Storage>
...
35 / Cloudflare R2
   \ (s3)

Type of storage> 35    # S3 호환 API를 사용하므로 35번 선택

env_auth> false        # Cloudflare 계정 환경변수 없으므로 false

access_key_id> {YOUR_R2_ACCESS_KEY}          # R2 Access Key ID

secret_access_key> {YOUR_R2_SECRET_KEY}      # R2 Secret Access Key

region> auto           # R2는 보통 auto로 OK

endpoint> https://{ACCOUNT_ID}.r2.cloudflarestorage.com
           # Cloudflare 계정 ID 확인: R2 대시보드 > 우측 API 토큰 클릭

list_url_base>
location_constraint>
acl> private           # 프라이빗 설정

save_metadata> n

Edit advanced config?> n

Keep this 'r2backup' remote?> y
```

---

### 옵션 B: AWS S3 설정

```
n/s/q> n

name> s3backup         # 원격 저장소 이름

Option Storage>
...
32 / Amazon S3
   \ (s3)

Type of storage> 32

env_auth> false

access_key_id> {YOUR_AWS_ACCESS_KEY}

secret_access_key> {YOUR_AWS_SECRET_KEY}

region> ap-northeast-2   # 서울 (또는 선호 지역)

endpoint>
location_constraint> ap-northeast-2

acl> private

edit metadata> n

Edit advanced config?> n

Keep this 's3backup' remote?> y
```

---

### 설정 완료 확인

```bash
# 저장된 원격 저장소 목록 확인
rclone config show

# 또는 config 파일 직접 확인
cat ~/.config/rclone/rclone.conf
```

**예상 출력** (R2 예시):
```
[r2backup]
type = s3
provider = Cloudflare
access_key_id = xxxxxxx
secret_access_key = xxxxxxx
endpoint = https://xxx.r2.cloudflarestorage.com
acl = private
```

---

## Step 3: rclone 연결 테스트

원격 저장소가 정상적으로 연결되었는지 확인한다.

### 버킷 목록 확인

```bash
# R2의 경우
rclone lsd r2backup:

# S3의 경우
rclone lsd s3backup:
```

**예상 출력:**
```
          -1 2026-04-01 10:30:00         0 backup-bucket
```

아직 버킷을 만들지 않았다면 다음 명령어로 생성한다:

```bash
# R2: 버킷 생성 (rclone 통해서도 가능)
rclone mkdir r2backup:backup-bucket

# S3: 콘솔에서 버킷 생성 후 rclone에서 확인
# (AWS S3 버킷 생성은 AWS 콘솔이나 AWS CLI 추천)
```

### 테스트 파일 업로드

```bash
# 테스트 파일 생성
echo "test backup" > /tmp/test-backup.txt

# R2에 업로드
rclone copy /tmp/test-backup.txt r2backup:backup-bucket/

# 업로드 확인
rclone ls r2backup:backup-bucket/
```

**예상 출력:**
```
        11 2026-04-01 10:35:00    test-backup.txt
```

### 완료 기준
- ✅ `rclone lsd` 명령어가 버킷을 출력
- ✅ 테스트 파일이 정상 업로드되고 목록에 나타남

---

## Step 4: 백업 파일 업로드 테스트

이전 단계(05-C-12)에서 생성한 백업 파일을 실제로 업로드해본다.

### 단일 백업 업로드

```bash
# 최신 백업 파일 찾기
ls -lh /home/postgres/backups/

# 특정 백업 파일 업로드
rclone copy /home/postgres/backups/mydb_20260401_103000.sql.gz r2backup:backup-bucket/

# 업로드 확인
rclone ls r2backup:backup-bucket/
```

### 전체 백업 디렉토리 동기화

```bash
# --delete 옵션 없이 동기화 (로컬 → 클라우드)
rclone sync /home/postgres/backups/ r2backup:backup-bucket/backups/ -v

# -v: verbose (상세 로그 출력)
```

**예상 출력:**
```
2026/04/01 10:40:00 INFO  : mydb_20260401_103000.sql.gz: Copied (file hash matched)
2026/04/01 10:40:05 INFO  : Synced 1 file to the remote
```

### 완료 기준
- ✅ 백업 파일이 R2/S3에 정상 업로드됨
- ✅ `rclone ls`로 클라우드 파일 목록 확인 가능

---

## Step 5: 백업 스크립트에 rclone 통합

기존 `backup.sh` 스크립트를 수정하여 백업 완료 후 자동으로 클라우드에 업로드하도록 변경한다.

### 현재 backup.sh 구조 (복습)

```bash
#!/bin/bash

BACKUP_DIR="/home/postgres/backups"
DB_NAME="mydb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# 백업 생성
pg_dump -U postgres "$DB_NAME" | gzip > "$BACKUP_FILE"

# 완료 로그
echo "[$(date)] Backup completed: $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"
```

### 수정된 backup.sh (rclone 통합)

```bash
#!/bin/bash

# 설정
BACKUP_DIR="/home/postgres/backups"
DB_NAME="mydb"
RCLONE_REMOTE="r2backup:backup-bucket/backups"  # 또는 "s3backup:backup-bucket/backups"
RCLONE_CONFIG="/root/.config/rclone/rclone.conf"  # cron 실행 시 명시적 경로 지정
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 백업 생성
log_message "Starting backup of $DB_NAME..."
pg_dump -U postgres "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log_message "Backup created: $BACKUP_FILE"
else
    log_message "ERROR: Backup failed!"
    exit 1
fi

# rclone으로 클라우드 업로드
log_message "Uploading to cloud storage..."
rclone --config "$RCLONE_CONFIG" copy "$BACKUP_FILE" "$RCLONE_REMOTE/" -v

if [ $? -eq 0 ]; then
    log_message "Upload successful to $RCLONE_REMOTE"
else
    log_message "ERROR: Upload failed! File still exists locally."
    exit 1
fi

log_message "Backup and upload complete!"
```

### 스크립트 파일로 저장

```bash
# 스크립트 편집
sudo nano /home/postgres/backups/backup.sh

# 위 내용을 파일에 붙여넣기
# (또는 기존 파일에서 rclone 부분만 추가)

# 실행 권한 부여
sudo chmod +x /home/postgres/backups/backup.sh
```

### 수동 테스트

```bash
# 스크립트 직접 실행
/home/postgres/backups/backup.sh

# 로그 확인
tail -f /home/postgres/backups/backup.log
```

**예상 로그:**
```
[2026-04-01 10:45:00] Starting backup of mydb...
[2026-04-01 10:45:05] Backup created: /home/postgres/backups/mydb_20260401_104500.sql.gz
[2026-04-01 10:45:06] Uploading to cloud storage...
[2026-04-01 10:45:08] Upload successful to r2backup:backup-bucket/backups
[2026-04-01 10:45:08] Backup and upload complete!
```

### 완료 기준
- ✅ 스크립트 실행 후 로컬 백업과 클라우드 업로드 모두 성공
- ✅ 로그 파일에 각 단계가 기록됨
- ✅ 클라우드에서 파일이 실제로 업로드되었는지 확인

### 중요: cron 실행 시 고려사항

> **--config 옵션 필수**: cron 작업은 일반 사용자 셀과 다른 홈 디렉토리 환경에서 실행될 수 있습니다.
> - 직접 실행: `~/.config/rclone/rclone.conf` (사용자 홈 기준)
> - cron 실행: 홈 디렉토리가 `/root` 또는 다를 수 있으므로 `--config` 옵션으로 명시적 경로 지정 필수
> - 위 스크립트에서 `RCLONE_CONFIG="/root/.config/rclone/rclone.conf"`로 설정하여 모든 rclone 명령어에 `--config "$RCLONE_CONFIG"` 추가됨

---

## Step 6: 오래된 원격 백업 자동 삭제

시간이 지나면 클라우드 스토리지가 가득 찬다. 오래된 백업을 자동 삭제하도록 설정한다.

### 원격 백업 목록 확인

```bash
# 30일 이상 오래된 파일 확인
rclone ls r2backup:backup-bucket/backups/ --min-age 30d
```

### 오래된 백업 자동 삭제

```bash
# 30일 이상 오래된 파일 삭제 (--dry-run으로 먼저 미리보기)
rclone --config /root/.config/rclone/rclone.conf delete r2backup:backup-bucket/backups/ --min-age 30d --dry-run -v

# 실제 삭제 (--dry-run 제거)
rclone --config /root/.config/rclone/rclone.conf delete r2backup:backup-bucket/backups/ --min-age 30d -v
```

**예상 출력:**
```
2026/04/01 10:50:00 INFO  : mydb_20260302_000000.sql.gz: Deleted
2026/04/01 10:50:01 INFO  : mydb_20260301_000000.sql.gz: Deleted
```

### cleanup.sh 스크립트 작성 (선택사항)

```bash
#!/bin/bash

# 파일: /home/postgres/backups/cleanup.sh

RCLONE_REMOTE="r2backup:backup-bucket/backups"
RCLONE_CONFIG="/root/.config/rclone/rclone.conf"  # cron 실행 시 명시적 경로 지정
LOG_FILE="/home/postgres/backups/backup.log"
KEEP_DAYS=30  # 30일 이상 오래된 파일 삭제

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Cleaning up backups older than $KEEP_DAYS days..."
rclone --config "$RCLONE_CONFIG" delete "$RCLONE_REMOTE/" --min-age ${KEEP_DAYS}d -v

if [ $? -eq 0 ]; then
    log_message "Cleanup successful"
else
    log_message "ERROR: Cleanup failed"
fi
```

### crontab에 정기 정리 추가

```bash
# crontab 편집
crontab -e

# 매주 일요일 02:00에 정리 실행
0 2 * * 0 /home/postgres/backups/cleanup.sh
```

---

## 확인 방법 및 체크리스트

### Step-by-step 확인

- [ ] rclone이 정상 설치되었는가?
  ```bash
  rclone version
  ```

- [ ] 원격 저장소가 정상 연결되었는가?
  ```bash
  rclone lsd r2backup:  # 또는 s3backup:
  ```

- [ ] 백업 파일이 클라우드에 업로드되었는가?
  ```bash
  rclone ls r2backup:backup-bucket/backups/
  ```

- [ ] backup.sh 스크립트가 정상 작동하는가?
  ```bash
  /home/postgres/backups/backup.sh
  tail /home/postgres/backups/backup.log
  ```

- [ ] cron 백업이 자동으로 클라우드까지 업로드되는가?
  ```bash
  # 다음 cron 실행까지 기다린 후
  rclone ls r2backup:backup-bucket/backups/
  # 최신 파일이 나타나는지 확인
  ```

---

## 자주 겪는 오류와 해결

### 1. "ERROR: command not found: rclone"
**원인**: rclone이 설치되지 않았거나 PATH에 없음
**해결**:
```bash
# 설치 다시 확인
curl https://rclone.org/install.sh | sudo bash

# 경로 확인
which rclone
```

---

### 2. "ERROR: InvalidAccessKeyId"
**원인**: R2/S3 Access Key 또는 Secret Key가 잘못됨
**해결**:
```bash
# 설정 재확인
rclone config

# 계정 페이지에서 Key 다시 확인 및 교체
# R2: https://dash.cloudflare.com/ > R2 > 우측 API 토큰
# S3: AWS 콘솔 > IAM > 액세스 키 관리
```

---

### 3. "ERROR: bucket does not exist"
**원인**: R2/S3 버킷이 없거나 이름이 잘못됨
**해결**:
```bash
# 버킷 목록 확인
rclone lsd r2backup:

# 없으면 생성
rclone mkdir r2backup:backup-bucket
```

---

### 4. "ERROR: context deadline exceeded"
**원인**: 네트워크 타임아웃, 파일이 너무 큼, 또는 클라우드 서버 응답 지연
**해결**:
```bash
# 재시도 횟수 및 타임아웃 시간 증가
rclone copy /path/to/file r2backup:backup-bucket/ \
    --retries 3 \
    --transfers 2 \
    --timeout 30s

# 또는 대용량 파일은 따로 분할
```

---

### 5. "permission denied" (backup.sh 실행 불가)
**원인**: 스크립트 실행 권한 없음 또는 디렉토리 권한 문제
**해결**:
```bash
# 실행 권한 부여
sudo chmod +x /home/postgres/backups/backup.sh

# 소유자 확인
ls -l /home/postgres/backups/backup.sh

# cron으로 실행하려면 postgres 사용자로 실행 권한 필요
sudo chown postgres:postgres /home/postgres/backups/backup.sh
```

---

### 6. "rclone.conf 파일이 없거나 손상됨"
**원인**: 설정 파일이 없거나 읽기 불가
**해결**:
```bash
# 설정 파일 위치 확인
cat ~/.config/rclone/rclone.conf

# 없으면 새로 설정
rclone config

# 또는 수동 설정
sudo mkdir -p ~/.config/rclone/
sudo nano ~/.config/rclone/rclone.conf
```

---

## 다음 단계

다음 파일에서는 **그룹 D**로 넘어가 **PostgreSQL 슬로우 쿼리 로그**를 활성화하고 분석한다.

- **다음**: 05-D-01 슬로우 쿼리 로그 활성화 및 확인
  - 슬로우 쿼리 설정 (`log_min_duration_statement`)
  - 로그 파일 모니터링
  - 느린 쿼리 분석 및 최적화

---

## 참고 자료

- **rclone 공식 문서**: https://rclone.org/
- **Cloudflare R2**: https://developers.cloudflare.com/r2/
- **AWS S3 가격**: https://aws.amazon.com/s3/pricing/
- **cron 정기 작업**: 05-C-12에서 학습

---

**작성 완료**: 2026-04-01
**학습 목표 달성 시간**: 약 15~20분
**다음 진행**: 그룹 D - 슬로우 쿼리 로그
