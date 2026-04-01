# 04-A-05 Realtime & Storage 이해

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: GoTrue (Auth 서버) 이해 | 다음: Supabase Studio 이해

---

## 이 파일에서 배우는 것

Supabase의 실시간 데이터 동기화(Realtime)와 파일 저장(Storage) 서비스의 역할과 구조를 이해합니다.
두 서비스를 하나의 파일에서 함께 다루는 이유는, 셀프호스팅에서 이 둘이 선택적(optional)인 서비스이기 때문입니다.

---

## 본문

### Part 1: Realtime 서버

#### Realtime이란?

Realtime은 PostgreSQL의 **데이터 변경 이벤트를 WebSocket으로 클라이언트에 실시간 전달**하는 서버입니다. Elixir(Phoenix 프레임워크)로 만들어졌습니다.

FE 비유: Socket.io 서버가 DB 변경을 감지해서 자동으로 클라이언트에 이벤트를 보내는 것과 같습니다.

#### 동작 방식

```
1. 클라이언트가 WebSocket 연결
   supabase.channel('todos').on('INSERT', callback).subscribe()

2. Realtime 서버가 PostgreSQL의 변경 감지
   (PostgreSQL의 Logical Replication 기능 활용)

3. 변경 발생 시 연결된 클라이언트에 이벤트 전송
```

#### Realtime이 지원하는 3가지 모드

| 모드 | 설명 | 사용 예 |
|---|---|---|
| **Postgres Changes** | DB 테이블 변경 감지 (INSERT/UPDATE/DELETE) | 실시간 채팅, 알림 |
| **Broadcast** | 클라이언트 간 메시지 전달 (DB 거치지 않음) | 커서 위치 공유, 타이핑 표시 |
| **Presence** | 접속 중인 사용자 상태 추적 | 온라인 사용자 목록 |

#### 셀프호스팅에서 Realtime 주의사항

- Realtime은 **메모리 사용량이 높을 수 있습니다**. 동시 접속자가 많으면 서버 리소스를 잡아먹습니다.
- 실시간 기능이 필요 없다면 `docker-compose.yml`에서 **비활성화하여 리소스를 절약**할 수 있습니다.
- PostgreSQL의 `wal_level`이 `logical`로 설정되어야 Postgres Changes가 동작합니다 (Supabase 기본 compose에서는 이미 설정됨).

---

### Part 2: Storage 서버

#### Storage란?

Storage는 **파일(이미지, 동영상, 문서 등)을 저장하고 관리**하는 서비스입니다. S3 호환 API를 제공합니다.

FE 비유: Cloudinary나 AWS S3 + presigned URL 패턴을 서버에서 직접 운영하는 것입니다.

#### 핵심 개념: 버킷(Bucket)

Storage는 파일을 **버킷** 단위로 관리합니다.

```
Storage
├── avatars (버킷)        ← public: 누구나 읽기 가능
│   ├── user1/profile.jpg
│   └── user2/profile.jpg
├── documents (버킷)      ← private: 인증된 사용자만
│   ├── user1/report.pdf
│   └── user2/contract.pdf
└── ...
```

#### Storage API 예시

```javascript
// 파일 업로드
const { data } = await supabase.storage
  .from('avatars')
  .upload('user1/profile.jpg', file)

// 공개 URL 가져오기
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl('user1/profile.jpg')

// 비공개 파일 다운로드 (인증 필요)
const { data } = await supabase.storage
  .from('documents')
  .download('user1/report.pdf')
```

#### 파일 저장 위치

셀프호스팅에서 Storage의 실제 파일은 **Docker 볼륨**에 저장됩니다. `docker-compose.yml`에서 볼륨 매핑을 확인할 수 있습니다:

```yaml
storage:
  volumes:
    - ./volumes/storage:/var/lib/storage
```

이 디렉토리를 백업하지 않으면 **업로드된 파일이 모두 유실**됩니다.

#### Storage의 RLS

Storage도 PostgreSQL의 RLS를 활용합니다. `storage.objects` 테이블에 RLS 정책을 설정하면, 파일 접근 권한을 세밀하게 제어할 수 있습니다.

---

## 핵심 정리

- **Realtime**은 DB 변경을 WebSocket으로 실시간 전달하는 서비스로, 실시간 기능이 불필요하면 비활성화하여 리소스를 절약할 수 있다.
- **Storage**는 파일을 버킷 단위로 관리하는 S3 호환 서비스로, 실제 파일은 Docker 볼륨에 저장된다.
- 두 서비스 모두 PostgreSQL의 보안 기능(RLS)을 활용하여 접근 권한을 제어한다.

---

## 다음 파일 예고

Supabase의 웹 기반 관리 대시보드인 Studio가 어떤 기능을 제공하는지, 셀프호스팅에서 어떻게 접근하는지 알아봅니다.
