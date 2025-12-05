# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: wordtest-academy
   - **Database Password**: 안전한 비밀번호 생성 (저장 필수!)
   - **Region**: Northeast Asia (Seoul) 선택
4. "Create new project" 클릭 (약 2분 소요)

## 2. 데이터베이스 마이그레이션 실행

프로젝트 생성 완료 후:

1. Supabase 대시보드에서 **SQL Editor** 메뉴 클릭
2. "New query" 클릭
3. `supabase/migrations/20241205_initial_schema.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭하여 실행
6. 성공 메시지 확인

## 3. API 키 가져오기

1. Supabase 대시보드에서 **Settings** → **API** 메뉴 클릭
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (긴 토큰)
   - **service_role key**: `eyJhbGc...` (긴 토큰, 비밀!)

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **중요**: 실제 값으로 교체하세요!

## 5. 초기 Super Admin 계정 생성

SQL Editor에서 다음 쿼리 실행:

```sql
-- 비밀번호 해싱 (bcrypt)은 애플리케이션에서 처리하므로
-- 임시로 평문 비밀번호를 사용합니다 (나중에 변경 필요)

INSERT INTO users (username, password_hash, full_name, role, status)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere', -- 실제 해시된 비밀번호로 교체
  'Super Administrator',
  'super_admin',
  'active'
);
```

**비밀번호 해싱 방법:**

Node.js에서 실행:
```javascript
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

또는 온라인 bcrypt 생성기 사용: https://bcrypt-generator.com/

## 6. Row Level Security (RLS) 정책 설정

현재는 RLS가 활성화되어 있지만 정책이 없습니다. 개발 중에는 다음을 실행하여 임시로 비활성화할 수 있습니다:

```sql
-- 개발 중 임시로 RLS 비활성화 (프로덕션에서는 절대 사용 금지!)
ALTER TABLE academies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... (모든 테이블에 대해 반복)
```

**프로덕션 배포 전에 반드시 RLS 정책을 구현하세요!**

## 7. 개발 서버 실행

```bash
cd wordtest-academy
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 로그인 페이지로 리다이렉트

## 8. Vercel 배포 (선택사항)

1. [Vercel](https://vercel.com) 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (Vercel 도메인)
5. "Deploy" 클릭

## 문제 해결

### TypeScript 오류
VSCode를 재시작하면 해결됩니다.

### 데이터베이스 연결 오류
- `.env.local` 파일이 올바른 위치에 있는지 확인
- API 키가 정확한지 확인
- 개발 서버 재시작

### 로그인 실패
- Super Admin 계정이 생성되었는지 확인
- 비밀번호 해시가 올바른지 확인
- 브라우저 콘솔에서 오류 확인
