# [PRD] 대진전자통신고등학교 통합 알리미 서비스 (최종 완성본 v8.0)

## 1. 서비스 개요 (Overview)

* **서비스명:** 대진전자통신고 통합 알리미 (가칭: 대진 스마트 알리미)
* **목적:** 
  * NEIS Open API 및 DB 주기적 동기화를 통한 학사·시간표·급식 정보 제공
  * Supabase 기반의 **GitHub 및 Google 멀티 OAuth 인증** 체계 구축
  * 사용자별 **학적·개인정보 및 맞춤형 설정(시간표, 급식 알레르기 필터, 테마, GitHub 프로필 등)의 안전한 DB 저장 및 개인화**
  * 도메인 및 역할별 권한 체계(학생/교직원/외부 승인형 etc)
  * 신고 게시물 버전 그룹화 관리 및 자유게시판(닉네임, 30분 수정, 조건부 삭제) 시스템을 갖춘 반응형 웹/앱 서비스 구축
* **타겟 사용자:** 대진전자통신고등학교 학생 및 교직원, 승인된 외부 사용자(etc)

---

## 2. 디자인 및 테마 시스템 (Theme Specification)

* 🌙 **다크 모드 (Dark Theme):** 보랏빛 / 군청(Navy-Violet) 계열의 어두운 UI
* ☀ **화이트 모드 (Light Theme):** 청록 / 파랑(Cyan-Blue) 계열의 밝은 UI
* **동적 전환 및 개인화 저장:**
  * 상단 네비게이션을 통한 수동 토글 지원 (CSS Variables 적용)
  * 사용자가 선택한 테마 설정값은 Supabase `user_profiles` 테이블에 실시간 동기화되어, 다른 기기나 브라우저에서 로그인해도 개인 설정 유지.

---

## 3. 백엔드 및 인증/보안 아키텍처 (Supabase Multi-OAuth)

### ① 멀티 OAuth 인증 및 역할(Role) 자동 분리

* **인증 제공자 (OAuth Providers via Supabase):**
  * **Google OAuth:** 기존 학교 공식 도메인 기반 인증
  * **GitHub OAuth [v8.0 신규]:** 특성화고(전자/통신/SW) 학생들의 개발자 생태계 및 포트폴리오 연계를 위한 소셜 로그인 지원
* **도메인 및 계정별 역할(Role) 매핑 정책:**
  1. **Google OAuth 로그인 시:**
     * `@pdj.hs.kr` ➔ 학생 (`student`) 권한 자동 부여
     * `@pdj.ht.kr` 또는 `@korea.kr` ➔ 교직원 (`teacher`) 권한 자동 부여
  2. **GitHub OAuth 로그인 시 [v8.0 신규]:**
     * GitHub 계정의 기본/보조 이메일 중 학교 공식 도메인(`@pdj.hs.kr`, `@pdj.ht.kr`, `@korea.kr`)이 포함된 경우, 해당 도메인 규칙에 따라 `student` 또는 `teacher` 권한 자동 매핑.
     * 학교 도메인이 연동되지 않은 GitHub 일반 이메일 계정으로 최초 가입 시:
       * 1단계: Supabase Auth에 계정 생성 및 `pending` 상태로 진입.
       * 2단계: "학교 구글 계정 2차 연동" 또는 "학생증/학적 인증 코드 입력"을 거쳐 정식 `student`/`teacher` 권한으로 승격.
       * 승격되지 않은 외부 사용자는 기본적으로 서비스 이용이 제한되며, 아래의 '외부/기타 계정 승인 절차' 대상이 됨.
  3. **외부/기타 계정 (`etc`) 승인 시스템:**
     * 학교 도메인이나 학적 검증이 없는 계정은 기본적으로 가입/서비스 이용 차단.
     * 교직원(`teacher`) 관리자가 승인 패널에서 승인 처리 시에만 `etc` 권한 부여.
* **승인 기록 보존 (Audit Log):**
  * 교직원이 승인 시, 승인한 교사 이름/ID, 승인 일시, 대상 사용자의 이메일 및 GitHub 사용자명이 DB 감사 로그(`audit_logs`)에 영구 기록.
* **비인증 도메인/미승인 사용자 차단 문구:**
  * "죄송합니다. 학교 공식 이메일(@pdj.hs.kr / @pdj.ht.kr)로 로그인하시거나, 교직원 승인을 받은 계정으로 진행해 주십시오."

### ② 시간표 Fallback 데이터 구조 및 주기적 갱신 (CORS 문제 원천 해결)

* **문제점 해결:** 프론트엔드가 외부 PHP 사이트(`eznel.com`)를 직접 호출할 경우 발생하는 CORS 에러 및 외부 서버 장애 리스크 방지를 위해 클라이언트 직접 fetch 방식 폐지.
* **Supabase DB 주기적 자동 갱신 및 수동 동기화 시스템:**
  * 백엔드 스케줄러(Supabase Edge Functions 또는 Cron Job)를 통해 매년 3월, 6월, 9월, 12월마다 정기적으로 외부 데이터 소스(`eznel.com`)에서 시간표 데이터를 미리 수집하여 Supabase DB에 파싱 및 적재.
  * **[학기 시작 시점 대응 수동 동기화]:** 고정 정기 크론의 시차(학기 시작 직후 구버전 노출 공백)를 방지하기 위해, 교직원 관리자 페이지 내 **"시간표 강제 동기화(Manual Sync)"** 버튼 제공.
  * 실시간 조회 시 외부 사이트가 아닌 자체 Supabase DB를 참조하여 고속 응답 및 무중단 안정성 확보.

---

## 4. 개인정보 저장 및 사용자 프로필 시스템 [v8.0 신규]

### ① 개인정보 및 프로필 테이블 구조 (`user_profiles`)

Supabase의 `auth.users`와 1:1로 매핑되는 `public.user_profiles` 테이블을 신설하여 학생·교직원의 개인정보와 개인화 설정을 안전하게 보관합니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, References `auth.users(id)` ON DELETE CASCADE | 사용자 고유 식별자 |
| `email` | `TEXT` | NOT NULL | 주 로그인 이메일 |
| `role` | `VARCHAR(20)` | NOT NULL, DEFAULT 'student' | 역할 (`student`, `teacher`, `etc`) |
| `auth_provider` | `VARCHAR(20)` | NOT NULL | 최초/주요 인증 수단 (`github`, `google`) |
| **[신원 / 학적 정보]** | | | |
| `real_name` | `VARCHAR(50)` | NULL (가입/프로필 설정 시 입력) | 사용자 실명 |
| `grade` | `SMALLINT` | CHECK (grade BETWEEN 1 AND 3) | 학년 (학생 전용) |
| `class_number` | `SMALLINT` | CHECK (class_number BETWEEN 1 AND 15) | 반 (학생 전용) |
| `student_number` | `SMALLINT` | CHECK (student_number BETWEEN 1 AND 40) | 번호 (학생 전용) |
| `department` | `VARCHAR(50)` | NULL | 전공 학과 (전자과, 통신과, SW과 등) |
| `phone_number` | `VARCHAR(20)` | NULL | 연락처 (비상연락망용, 암호화 저장) |
| **[GitHub 연동 정보]** | | | |
| `github_username` | `TEXT` | NULL | GitHub 계정명 (@username) |
| `github_avatar_url`| `TEXT` | NULL | GitHub 프로필 이미지 URL |
| `github_profile_url`| `TEXT` | NULL | GitHub 프로필 링크 |
| `bio` | `TEXT` | NULL | 자기소개 / 한 줄 소개 |
| **[개인화 / 서비스 설정]** | | | |
| `community_nickname`| `VARCHAR(30)` | UNIQUE, NOT NULL | 자유게시판 활동용 닉네임 |
| `theme_preference` | `VARCHAR(10)` | DEFAULT 'dark' | 테마 설정 (`dark`, `light`, `system`) |
| `default_schedule` | `JSONB` | DEFAULT '{"grade": 1, "class": 1}' | 대시보드 기본 표시 시간표 (학년/반) |
| `allergy_filters` | `TEXT[]` | DEFAULT '{}' | 급식 알레르기 유발 성분 필터링 목록 |
| `notification_opt_in`| `BOOLEAN` | DEFAULT TRUE | 중요 학사/시간표 변경 알림 수신 동의 |
| **[약관 및 메타데이터]** | | | |
| `privacy_agreed` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | 개인정보 수집 및 이용 동의 여부 |
| `privacy_agreed_at`| `TIMESTAMPTZ` | NULL | 개인정보 동의 일시 |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | 계정 생성 일시 |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | 프로필 최근 수정 일시 |

### ② Supabase Database Trigger를 통한 프로필 자동 초기화

* 사용자가 GitHub 또는 Google OAuth로 최초 로그인하여 `auth.users`에 레코드가 생성될 때, PostgreSQL 함수 및 트리거(`on_auth_user_created`)가 자동 실행됨.
* **자동 동기화 로직:**
  * GitHub 메타데이터(`raw_user_meta_data`)에서 `user_name`, `avatar_url`, `preferred_username` 등을 추출하여 `github_username`, `github_avatar_url`에 자동 기입.
  * 커뮤니티 닉네임(`community_nickname`)은 GitHub 닉네임 또는 이메일 접두어를 기반으로 임시 고유값 부여 (이후 마이페이지에서 수정 가능).
  * 역할(`role`)은 로그인 이메일 도메인 및 메타데이터에 따라 자동 산정(`student`, `teacher`, `etc`).

```sql
-- 사용자 가입 시 user_profiles 자동 생성 트리거 함수 예시
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    auth_provider,
    github_username,
    github_avatar_url,
    community_nickname,
    role,
    privacy_agreed,
    privacy_agreed_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_app_meta_data->>'provider', 'unknown'),
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email LIKE '%@pdj.ht.kr' OR new.email LIKE '%@korea.kr' THEN 'teacher'
      WHEN new.email LIKE '%@pdj.hs.kr' THEN 'student'
      ELSE 'etc'
    END,
    TRUE,
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ③ 개인정보 보호 및 RLS (Row Level Security) 접근 제어 정책

* **본인 데이터 격리 원칙:**
  * 모든 일반 사용자는 `auth.uid() = id` 조건을 만족하는 본인의 개인정보만 `SELECT`, `UPDATE` 가능.
  * 학년, 반, 번호, 실명, 연락처 등 민감 정보는 타 사용자에게 절대 노출되지 않음.
* **커뮤니티 공개 뷰 분리:**
  * 자유게시판 등 커뮤니티에서는 전체 프로필 테이블을 직접 조회하지 않고, `id`, `community_nickname`, `github_avatar_url`만 노출하는 공개 뷰(`public_user_view`)를 통해서만 접근 가능.
* **교직원(`teacher`) 권한 특별 정책:**
  * 학생 생활지도 및 시간표 매핑을 위해, 교직원 권한 사용자에게는 학생들의 학적 기본 정보(`real_name`, `grade`, `class_number`, `student_number`, `department`)에 대한 읽기(SELECT) 권한 허용.
* **권한 변조 방지 (Tamper-Proofing):**
  * `role`, `privacy_agreed_at` 컬럼은 클라이언트(프론트엔드)에서 직접 수정할 수 없도록 RLS 및 DB UPDATE 트리거로 방어.

### ④ 개인화 기능과의 연계

1. **시간표 자동 맞춤 제공:**
   * 프로필에 저장된 `grade`(학년)와 `class_number`(반) 정보를 기반으로, 메인 대시보드 진입 시 별도의 반 선택 없이 본인 반의 일일/전체 시간표가 자동 로딩.
2. **급식 알레르기 성분 하이라이트/경고:**
   * 사용자가 `allergy_filters`에 등록한 알레르기 유발 번호(예: 1. 난류, 2. 우유 등)가 오늘의 급식 식단에 포함되어 있을 경우, 식단표 카드에 경고 뱃지 및 하이라이트 시각화.
3. **GitHub 포트폴리오 연동 뱃지:**
   * GitHub 인증을 마친 학생의 경우 프로필에 GitHub 연동 인증 뱃지 부여 및 자유게시판 프로필 클릭 시 본인의 공개 프로젝트 링크 연결 가능.

### ⑤ 회원 탈퇴 및 개인정보 파기 정책 (개인정보보호법 준수)

* **원클릭 탈퇴 지원:** 마이페이지 내 "회원 탈퇴 및 개인정보 삭제" 요청 기능 제공.
* **영구 파기 메커니즘:**
  * Supabase `auth.users` 삭제 시 CASCADE 제약 조건에 의해 `user_profiles` 레코드 즉시 영구 삭제.
  * 자유게시판에 남긴 게시글 및 댓글의 작성자 식별값은 `(탈퇴한 사용자)`로 익명 마스킹 처리하여 개인정보 추적 차단.

---

## 5. 자유게시판 및 교직원 관리 시스템

### ① 닉네임 및 수정/삭제 정책

* **닉네임 시스템:** 
  * 커뮤니티 전용 닉네임(`community_nickname`) 사용으로 학생 실명 및 개인정보 노출 방지.
  * 단, 교직원 계정은 건전한 커뮤니티 지도를 위해 실명 또는 교직원 인증 뱃지 표기 가능.
* **30분 수정 제한:** 게시물 작성 후 30분 이내에만 본인 수정 가능.
* **조건부 삭제 정책:**
  * **미신고 게시물:** 작성자 본인이 원할 시 완전 삭제 가능.
  * **신고 누적 게시물:** 피드에서는 즉시 숨김 처리되나, 증빙 및 이력 관리를 위해 백업 테이블(`reported_posts_backup`)에 원본 보존.

### ② 신고된 게시물 및 수정본 그룹화 알림 시스템 (교직원 전용)

* **신고 상태에서의 수정 제한 적용:** 신고된 상태의 게시물이 수정될 경우, 작성자와 수정 내역이 명시적으로 스냅샷에 기록.
* **DB 레벨의 10초 쿨타임 무결성 보장:**
  * 프론트엔드 차원의 버튼 비활성화 외에, **Supabase Database Trigger 또는 PostgreSQL 함수(PL/pgSQL) 레벨**에서 로직 강제.
  * `snapshots` 테이블의 최근 생성 시간과 `NOW()`를 비교하여 10초 이내의 중복 INSERT 요청은 DB 레벨에서 원천 차단하여 데이터 오염 방지.
* **그룹화된 알림 뷰 (파일형 UI):**
  * 교직원이 알리미 서비스에 접속했을 때만 `[알림]` 탭에 뱃지 및 리스트 표기.
  * 각 알림 항목은 `[1. 사용자] | [2. 게시물(최초 내용)] | [3. 그룹(하위 수정 이력 폴더)]` 형태로 계층화된 파일 캐비닛 구조로 표기되며, 10초 쿨타임 규칙에 따라 최신 버전이 하위 그룹에 누적·정렬.

---

## 6. 보안 및 인프라 요구사항

### ① Rate Limiting (IP 대신 user_id 기반)

* **학교 네트워크 특성 고려:** 학교 내부 Wi-Fi 환경에서는 수백 명의 학생이 동일한 공인 IP(공유기 NAT)를 공유하므로, 순수 IP 기반 Rate Limiting 적용 시 특정 사용자의 요청 폭주로 인해 학교 전체 학생의 API 호출이 차단(`429 Too Many Requests`)되는 장애 우려 해결.
* **정책:**
  * 기본 Rate Limiting 기준은 IP 주소가 아닌 **Supabase Auth의 고유 `user_id` 기반 토큰 버킷(Token Bucket) 알고리즘** 적용.
  * 비인증(Anonymous) 엔드포인트에 한해서만 예외적으로 IP 기반 제한을 최소한으로 적용하되, 임계치를 상향 조정.

### ② 데이터 보안 및 OAuth 토큰 관리

* Supabase RLS(Row Level Security) 정책을 전 테이블에 강제하여 개인정보, 개인 메모, 민감 감사 로그의 인가되지 않은 접근 차단.
* GitHub 및 Google OAuth 연동 시 발급되는 외부 액세스 토큰(Access Token)은 서버 측 암호화 저장소에서만 취급되며, 프론트엔드 로컬 스토리지에 원문 노출 금지.

---

## 7. UI/UX 네비게이션 및 레이아웃 구조 (반응형 설계)

### 🗂 네비게이션 체계

* **메인 상단 탭 (PC) / 하단 아이콘 바 (모바일):**
  * **일반 사용자 (학생/외부):** 메인 | 시간표 | 학사일정 | 급식표 | 자유게시판 | **[내 정보 (마이페이지)]**
  * **교직원 사용자:** 위 목록 + `[알림(신고 백업 및 수정 그룹)]` 탭 추가 활성화
* **시간표 서브 상단 탭:** `[일일 시간표]` / `[전체 시간표]`
* **[내 정보 (마이페이지)] 화면 구성 [v8.0 신규]:**
  * **프로필 영역:** GitHub 프로필 사진, 깃허브 계정명(@username), 학교 인증 상태 뱃지
  * **학적 정보 입력/수정:** 실명, 학년, 반, 번호, 전공 학과 (최초 1회 설정 후 교직원 승인 시 고정)
  * **알레르기 설정:** 1~19번 식품군 체크박스 선택기
  * **테마 및 UI 설정:** 다크 / 화이트 모드 즉시 전환
  * **계정 관리:** GitHub 계정 연결 상태 확인, 로그아웃, 회원 탈퇴 버튼

### 📐 화면 비율에 따른 동적 배치 규칙

* **💻 가로가 긴 화면 (Wide View / PC 및 태블릿 가로모드):**
  * **좌측 영역:** 시간표 (사용자 프로필의 학년/반 기본 자동 연동)
  * **우측 상단 영역:** 개인 메모장 & 미니 프로필 (GitHub 연동 카드)
  * **우측 하단 영역:** 급식표 (개인 알레르기 필터 자동 적용)

* **📱 세로가 긴 화면 (Portrait View / 모바일 및 태블릿 세로모드):**
  * **상단 영역:** 시간표 (일일 시간표 중심, 사용자 학년/반 기준)
  * **하단 좌측 영역:** 개인 메모장 (Supabase 개인 공간)
  * **하단 우측 영역:** 급식표 (개인 알레르기 성분 하이라이트)
  * *(※ 메모, 마이페이지, 자유게시판 등 부가 기능은 필요 시 토글/플로팅 버튼을 통해 전체 화면으로 확장 가능)*