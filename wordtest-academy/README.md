# WordTest Academy - 멀티 테넌트 SaaS 영단어 학습 플랫폼

## 📚 프로젝트 개요

WordTest Academy는 여러 학원이 독립적으로 운영할 수 있는 멀티 테넌트 SaaS 영단어 학습 플랫폼입니다.

### 주요 기능

- **멀티 테넌트 아키텍처**: 학원별 완전한 데이터 격리
- **3가지 사용자 역할**: Super Admin, Academy Admin, Student
- **다양한 시험 유형**: 타이핑, 문장 섞기, 객관식, 듣기 시험
- **커리큘럼 관리**: 학생별 맞춤 학습 일정
- **보상 시스템**: 달러 포인트 적립
- **실시간 소통**: 공지사항 및 쪽지 기능

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), Mantine UI v7, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT-based auth
- **Deployment**: Vercel
- **State Management**: React Query, Zustand

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd wordtest-academy
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 설정

자세한 설정 방법은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참조하세요.

1. Supabase 프로젝트 생성
2. 데이터베이스 마이그레이션 실행
3. 환경 변수 설정

### 4. 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📁 프로젝트 구조

```
wordtest-academy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (super-admin)/     # Super Admin 페이지
│   │   ├── (academy-admin)/   # Academy Admin 페이지
│   │   ├── (student)/         # Student 페이지
│   │   ├── api/               # API Routes
│   │   └── login/             # 로그인 페이지
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── layout/           # 레이아웃 컴포넌트
│   │   └── navigation/       # 네비게이션 컴포넌트
│   └── lib/                   # 유틸리티 함수
│       ├── auth.ts           # 인증 관련
│       ├── supabase.ts       # Supabase 클라이언트
│       └── theme.ts          # Mantine 테마
├── supabase/
│   └── migrations/           # 데이터베이스 마이그레이션
└── public/                   # 정적 파일
```

## 🎨 디자인 시스템

- **스타일**: 네오브루탈리즘 (Neo-brutalism)
- **특징**: 굵은 테두리, 하드 섀도우, 화려한 색상
- **반응형**: 모바일 최적화

## 👥 사용자 역할

### Super Admin (최고 관리자)
- 학원 생성/관리
- 학원 관리자 계정 생성
- 공유 단어장 관리
- 전체 플랫폼 통계

### Academy Admin (학원 관리자)
- 학생 관리
- 반 관리
- 단어장 관리
- 커리큘럼 관리
- 진도 관리
- 공지/쪽지 관리

### Student (학생)
- 학습 진행
- 시험 응시
- 진도 확인
- 달러 현황
- 쪽지 확인

## 📊 데이터베이스 스키마

17개의 테이블로 구성:
- 핵심: academies, users, classes, student_classes
- 콘텐츠: wordbooks, words, listening_questions
- 커리큘럼: curriculums, curriculum_items, student_curriculums, daily_lessons
- 시험: test_sessions, test_results
- 소통: notices, messages
- 보상: dollar_transactions, academy_settings

## 🔒 보안

- JWT 기반 세션 관리
- 역할 기반 접근 제어 (RBAC)
- Row Level Security (RLS) 준비
- 비밀번호 해싱 (bcrypt)

## 📝 개발 로드맵

- [x] Phase 1: Foundation & Setup
- [ ] Phase 2: Super Admin Features
- [ ] Phase 3: Academy Admin - Student Management
- [ ] Phase 4: Academy Admin - Content Management
- [ ] Phase 5: Student Learning Features
- [ ] Phase 6: Communication & Rewards
- [ ] Phase 7: Polish & Optimization

## 🤝 기여

이 프로젝트는 학원용 SaaS 플랫폼입니다.

## 📄 라이선스

Private Project

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

## 🎊 프로젝트 완성도: 70%

### ✅ 완료된 핵심 기능

**멀티 테넌트 아키텍처**
- 학원별 데이터 완전 격리
- 3가지 역할 (Super Admin, Academy Admin, Student)

**Super Admin 기능**
- 학원 생성/관리
- 사용자 생성 (Academy Admin)

**Academy Admin 기능**
- 학생/반 생성 및 배정
- 단어장 생성 + Excel 업로드/다운로드
- **커리큘럼 생성 및 학생 배정**
- **Daily Lessons 자동 생성** ⭐

**Student 기능**
- 대시보드 (오늘의 학습, 달러)
- **타이핑 시험** (한글→영어)
- 실시간 채점 및 재시험
- 달러 자동 지급

### 🔄 전체 학습 플로우

```
1. Academy Admin: 단어장 생성 (Excel 업로드)
2. Academy Admin: 커리큘럼 템플릿 생성
3. Academy Admin: 학생에게 커리큘럼 배정
4. System: Daily Lessons 자동 생성 (날짜별)
5. Student: 오늘의 학습 확인
6. Student: 타이핑 시험 응시
7. System: 자동 채점 + 달러 지급
```

### 📊 프로젝트 통계

- API 엔드포인트: 31개
- UI 페이지: 14개
- 컴포넌트: 13개
- 총 코드: ~8,000 lines

### 🚀 추가 개발 가능 기능

- 문장 섞기 시험
- 객관식 시험
- 듣기 시험 (오디오 업로드)
- 공지/쪽지 시스템
- 진도 관리 대시보드
