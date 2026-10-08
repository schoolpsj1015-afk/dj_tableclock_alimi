/**
 * 대진전자통신고등학교 통합 알리미 - 데이터 모델 및 초기 Fallback 데이터 (TypeScript)
 */

export interface AllergyCode {
  id: number;
  name: string;
  icon: string;
}

export interface PeriodItem {
  period: number;
  subject: string;
  teacher: string;
  room: string;
  color: string;
}

export interface MenuItem {
  name: string;
  allergies: number[];
}

export interface MealDay {
  date: string;
  dayName: string;
  type: string;
  calories: string;
  menu: MenuItem[];
}

export interface AcademicEvent {
  id: number;
  title: string;
  date: string;
  dDayText: string;
  category: 'exam' | 'festival' | 'activity' | 'school' | 'vacation';
  desc: string;
}

export interface PostSnapshot {
  snapshotId: string;
  modifiedAt: string;
  content: string;
  authorNickname: string;
  label?: string;
}

export interface PostItem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorRole: 'student' | 'teacher' | 'etc' | 'guest';
  authorAvatar: string;
  githubUsername?: string | null;
  createdAt: string;
  updatedAt: string;
  likes: number;
  commentsCount: number;
  isReported: boolean;
  reportReason?: string;
  reportedAt?: string;
  isDeleted: boolean;
  deletedReason?: string;
  snapshots: PostSnapshot[];
}

export interface UserProfile {
  id: string;
  email: string;
  auth_provider: 'github' | 'google' | 'guest';
  role: 'student' | 'teacher' | 'etc' | 'guest';
  real_name: string;
  grade: number;
  class_number: number;
  student_number: number;
  department: string;
  phone_number?: string;
  community_nickname: string;
  theme_preference: 'dark' | 'light' | 'system';
  default_schedule: { grade: number; class: number };
  allergy_filters: number[];
  github_username?: string | null;
  github_avatar_url?: string | null;
  github_profile_url?: string | null;
  bio?: string;
  privacy_agreed: boolean;
  privacy_agreed_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  targetEmail: string;
  action: string;
  reason: string;
  timestamp: string;
}

export interface BlacklistUser {
  username: string;
  email: string;
  reason: string;
}

// 19대 식품 알레르기 유발 물질 목록
export const ALLERGY_CODES: AllergyCode[] = [
  { id: 1, name: "난류(계란)", icon: "🥚" },
  { id: 2, name: "우유", icon: "🥛" },
  { id: 3, name: "메밀", icon: "🍜" },
  { id: 4, name: "땅콩", icon: "🥜" },
  { id: 5, name: "대두(콩)", icon: "🌱" },
  { id: 6, name: "밀", icon: "🌾" },
  { id: 7, name: "고등어", icon: "🐟" },
  { id: 8, name: "게", icon: "🦀" },
  { id: 9, name: "새우", icon: "🦐" },
  { id: 10, name: "돼지고기", icon: "🥓" },
  { id: 11, name: "복숭아", icon: "🍑" },
  { id: 12, name: "토마토", icon: "🍅" },
  { id: 13, name: "아황산류", icon: "🧪" },
  { id: 14, name: "호두", icon: "🌰" },
  { id: 15, name: "닭고기", icon: "🍗" },
  { id: 16, name: "쇠고기", icon: "🥩" },
  { id: 17, name: "오징어", icon: "🦑" },
  { id: 18, name: "조개류(굴/전복/홍합)", icon: "🦪" },
  { id: 19, name: "잣", icon: "🌲" }
];

// 대진전자통신고 학과 목록
export const DEPARTMENTS = [
  "스마트소프트웨어과",
  "전자통신과",
  "스마트전자과",
  "인공지능통신과"
];

// 시간표 샘플 데이터
export const SCHEDULE_DATA: Record<string, { dept: string; weekly: Record<string, PeriodItem[]> }> = {
  "1-1": {
    dept: "스마트소프트웨어과",
    weekly: {
      mon: [
        { period: 1, subject: "프로그래밍", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 2, subject: "프로그래밍", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 3, subject: "국어", teacher: "박교사", room: "1-1 교실", color: "rose" },
        { period: 4, subject: "수학", teacher: "이교사", room: "1-1 교실", color: "amber" },
        { period: 5, subject: "정보통신일반", teacher: "최교사", room: "통신실습실", color: "cyan" },
        { period: 6, subject: "영어", teacher: "정교사", room: "1-1 교실", color: "emerald" },
        { period: 7, subject: "체육", teacher: "강교사", room: "대진체육관", color: "blue" }
      ],
      tue: [
        { period: 1, subject: "수학", teacher: "이교사", room: "1-1 교실", color: "amber" },
        { period: 2, subject: "자료구조", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 3, subject: "자료구조", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 4, subject: "영어", teacher: "정교사", room: "1-1 교실", color: "emerald" },
        { period: 5, subject: "한국사", teacher: "문교사", room: "1-1 교실", color: "orange" },
        { period: 6, subject: "진로활동", teacher: "담임교사", room: "1-1 교실", color: "violet" },
        { period: 7, subject: "자율활동", teacher: "담임교사", room: "1-1 교실", color: "violet" }
      ],
      wed: [
        { period: 1, subject: "전자회로기초", teacher: "송교사", room: "전자실습2", color: "sky" },
        { period: 2, subject: "전자회로기초", teacher: "송교사", room: "전자실습2", color: "sky" },
        { period: 3, subject: "국어", teacher: "박교사", room: "1-1 교실", color: "rose" },
        { period: 4, subject: "통합사회", teacher: "윤교사", room: "1-1 교실", color: "teal" },
        { period: 5, subject: "프로그래밍", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 6, subject: "동아리활동", teacher: "지도교사", room: "동아리실", color: "fuchsia" }
      ],
      thu: [
        { period: 1, subject: "웹프로그래밍", teacher: "조교사", room: "SW실습2", color: "indigo" },
        { period: 2, subject: "웹프로그래밍", teacher: "조교사", room: "SW실습2", color: "indigo" },
        { period: 3, subject: "통합과학", teacher: "배교사", room: "과학실", color: "teal" },
        { period: 4, subject: "통합과학", teacher: "배교사", room: "과학실", color: "teal" },
        { period: 5, subject: "수학", teacher: "이교사", room: "1-1 교실", color: "amber" },
        { period: 6, subject: "영어", teacher: "정교사", room: "1-1 교실", color: "emerald" },
        { period: 7, subject: "음악/미술", teacher: "신교사", room: "예술관", color: "pink" }
      ],
      fri: [
        { period: 1, subject: "디지털논리회로", teacher: "송교사", room: "전자실습1", color: "sky" },
        { period: 2, subject: "디지털논리회로", teacher: "송교사", room: "전자실습1", color: "sky" },
        { period: 3, subject: "국어", teacher: "박교사", room: "1-1 교실", color: "rose" },
        { period: 4, subject: "체육", teacher: "강교사", room: "운동장", color: "blue" },
        { period: 5, subject: "네트워크기초", teacher: "최교사", room: "네트워크실", color: "cyan" },
        { period: 6, subject: "네트워크기초", teacher: "최교사", room: "네트워크실", color: "cyan" },
        { period: 7, subject: "학급자치", teacher: "담임교사", room: "1-1 교실", color: "violet" }
      ]
    }
  },
  "2-1": {
    dept: "스마트소프트웨어과",
    weekly: {
      mon: [
        { period: 1, subject: "데이터베이스", teacher: "황교사", room: "SW실습3", color: "indigo" },
        { period: 2, subject: "데이터베이스", teacher: "황교사", room: "SW실습3", color: "indigo" },
        { period: 3, subject: "문학", teacher: "박교사", room: "2-1 교실", color: "rose" },
        { period: 4, subject: "수학Ⅰ", teacher: "이교사", room: "2-1 교실", color: "amber" },
        { period: 5, subject: "서버구축실무", teacher: "김교사", room: "서버실", color: "cyan" },
        { period: 6, subject: "영어Ⅰ", teacher: "정교사", room: "2-1 교실", color: "emerald" },
        { period: 7, subject: "체육", teacher: "강교사", room: "체육관", color: "blue" }
      ],
      tue: [
        { period: 1, subject: "스마트앱개발", teacher: "조교사", room: "모바일실", color: "indigo" },
        { period: 2, subject: "스마트앱개발", teacher: "조교사", room: "모바일실", color: "indigo" },
        { period: 3, subject: "스마트앱개발", teacher: "조교사", room: "모바일실", color: "indigo" },
        { period: 4, subject: "수학Ⅰ", teacher: "이교사", room: "2-1 교실", color: "amber" },
        { period: 5, subject: "확률과통계", teacher: "이교사", room: "2-1 교실", color: "amber" },
        { period: 6, subject: "진로활동", teacher: "담임교사", room: "2-1 교실", color: "violet" },
        { period: 7, subject: "자율활동", teacher: "담임교사", room: "2-1 교실", color: "violet" }
      ],
      wed: [
        { period: 1, subject: "마이크로프로세서", teacher: "송교사", room: "하드웨어실", color: "sky" },
        { period: 2, subject: "마이크로프로세서", teacher: "송교사", room: "하드웨어실", color: "sky" },
        { period: 3, subject: "영어Ⅰ", teacher: "정교사", room: "2-1 교실", color: "emerald" },
        { period: 4, subject: "문학", teacher: "박교사", room: "2-1 교실", color: "rose" },
        { period: 5, subject: "자료구조실습", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 6, subject: "동아리활동", teacher: "지도교사", room: "동아리실", color: "fuchsia" }
      ],
      thu: [
        { period: 1, subject: "풀스택웹개발", teacher: "조교사", room: "SW실습2", color: "indigo" },
        { period: 2, subject: "풀스택웹개발", teacher: "조교사", room: "SW실습2", color: "indigo" },
        { period: 3, subject: "풀스택웹개발", teacher: "조교사", room: "SW실습2", color: "indigo" },
        { period: 4, subject: "문학", teacher: "박교사", room: "2-1 교실", color: "rose" },
        { period: 5, subject: "수학Ⅰ", teacher: "이교사", room: "2-1 교실", color: "amber" },
        { period: 6, subject: "인공지능기초", teacher: "최교사", room: "AI랩", color: "violet" },
        { period: 7, subject: "인공지능기초", teacher: "최교사", room: "AI랩", color: "violet" }
      ],
      fri: [
        { period: 1, subject: "정보보안실무", teacher: "최교사", room: "보안실습실", color: "cyan" },
        { period: 2, subject: "정보보안실무", teacher: "최교사", room: "보안실습실", color: "cyan" },
        { period: 3, subject: "영어Ⅰ", teacher: "정교사", room: "2-1 교실", color: "emerald" },
        { period: 4, subject: "운동과건강", teacher: "강교사", room: "운동장", color: "blue" },
        { period: 5, subject: "프로젝트실습", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 6, subject: "프로젝트실습", teacher: "김교사", room: "SW실습1", color: "indigo" },
        { period: 7, subject: "학급자치", teacher: "담임교사", room: "2-1 교실", color: "violet" }
      ]
    }
  },
  "3-1": {
    dept: "전자통신과",
    weekly: {
      mon: [
        { period: 1, subject: "사물인터넷(IoT)", teacher: "송교사", room: "IoT실", color: "sky" },
        { period: 2, subject: "사물인터넷(IoT)", teacher: "송교사", room: "IoT실", color: "sky" },
        { period: 3, subject: "통신시스템", teacher: "최교사", room: "통신실", color: "cyan" },
        { period: 4, subject: "통신시스템", teacher: "최교사", room: "통신실", color: "cyan" },
        { period: 5, subject: "실용영어", teacher: "정교사", room: "3-1 교실", color: "emerald" },
        { period: 6, subject: "취업포트폴리오", teacher: "취업지원관", room: "3-1 교실", color: "amber" },
        { period: 7, subject: "체육", teacher: "강교사", room: "체육관", color: "blue" }
      ],
      tue: [
        { period: 1, subject: "임베디드시스템", teacher: "송교사", room: "임베디드실", color: "sky" },
        { period: 2, subject: "임베디드시스템", teacher: "송교사", room: "임베디드실", color: "sky" },
        { period: 3, subject: "임베디드시스템", teacher: "송교사", room: "임베디드실", color: "sky" },
        { period: 4, subject: "실용국어", teacher: "박교사", room: "3-1 교실", color: "rose" },
        { period: 5, subject: "직업윤리", teacher: "문교사", room: "3-1 교실", color: "orange" },
        { period: 6, subject: "진로상담", teacher: "담임교사", room: "3-1 교실", color: "violet" },
        { period: 7, subject: "자율활동", teacher: "담임교사", room: "3-1 교실", color: "violet" }
      ],
      wed: [
        { period: 1, subject: "무선통신구축", teacher: "최교사", room: "RF실습실", color: "cyan" },
        { period: 2, subject: "무선통신구축", teacher: "최교사", room: "RF실습실", color: "cyan" },
        { period: 3, subject: "실용수학", teacher: "이교사", room: "3-1 교실", color: "amber" },
        { period: 4, subject: "실용수학", teacher: "이교사", room: "3-1 교실", color: "amber" },
        { period: 5, subject: "캡스톤디자인", teacher: "송교사", room: "창작공방", color: "purple" },
        { period: 6, subject: "동아리활동", teacher: "지도교사", room: "동아리실", color: "fuchsia" }
      ],
      thu: [
        { period: 1, subject: "캡스톤디자인", teacher: "송교사", room: "창작공방", color: "purple" },
        { period: 2, subject: "캡스톤디자인", teacher: "송교사", room: "창작공방", color: "purple" },
        { period: 3, subject: "전자캐드(CAD)", teacher: "조교사", room: "CAD실", color: "sky" },
        { period: 4, subject: "전자캐드(CAD)", teacher: "조교사", room: "CAD실", color: "sky" },
        { period: 5, subject: "실용영어", teacher: "정교사", room: "3-1 교실", color: "emerald" },
        { period: 6, subject: "면접실무", teacher: "담임교사", room: "3-1 교실", color: "amber" },
        { period: 7, subject: "창의체험", teacher: "담임교사", room: "3-1 교실", color: "violet" }
      ],
      fri: [
        { period: 1, subject: "네트워크관리", teacher: "최교사", room: "서버실", color: "cyan" },
        { period: 2, subject: "네트워크관리", teacher: "최교사", room: "서버실", color: "cyan" },
        { period: 3, subject: "실용국어", teacher: "박교사", room: "3-1 교실", color: "rose" },
        { period: 4, subject: "체육", teacher: "강교사", room: "운동장", color: "blue" },
        { period: 5, subject: "전공자격증대비", teacher: "송교사", room: "전자실습1", color: "teal" },
        { period: 6, subject: "전공자격증대비", teacher: "송교사", room: "전자실습1", color: "teal" },
        { period: 7, subject: "학급자치", teacher: "담임교사", room: "3-1 교실", color: "violet" }
      ]
    }
  }
};

// 급식 식단표 데이터
export const MEAL_DATA: MealDay[] = [
  {
    date: "2026-10-08",
    dayName: "목요일 (오늘)",
    type: "중식",
    calories: "824.5 Kcal",
    menu: [
      { name: "친환경 흑미밥", allergies: [] },
      { name: "얼큰 순두부찌개", allergies: [1, 5, 6, 9, 10, 18] },
      { name: "수제 안심 돈까스 & 브라운소스", allergies: [1, 2, 5, 6, 10, 12, 13] },
      { name: "감자채 파프리카 볶음", allergies: [5] },
      { name: "숙주 미나리 무침", allergies: [5, 6] },
      { name: "배추김치", allergies: [9] },
      { name: "친환경 귤", allergies: [] }
    ]
  },
  {
    date: "2026-10-09",
    dayName: "금요일 (내일)",
    type: "중식",
    calories: "792.0 Kcal",
    menu: [
      { name: "해물 빠에야 볶음밥", allergies: [5, 6, 9, 13, 17, 18] },
      { name: "맑은 콩나물국", allergies: [5, 6] },
      { name: "크리스피 치킨 텐더 & 머스터드", allergies: [1, 2, 5, 6, 15] },
      { name: "그린 샐러드 & 오리엔탈 D", allergies: [5, 6, 13] },
      { name: "깍두기", allergies: [9] },
      { name: "상큼 청포도 에이드", allergies: [13] }
    ]
  },
  {
    date: "2026-10-12",
    dayName: "월요일",
    type: "중식",
    calories: "810.2 Kcal",
    menu: [
      { name: "차조밥", allergies: [] },
      { name: "소고기 미역국", allergies: [5, 6, 16] },
      { name: "매콤 돼지갈비찜", allergies: [5, 6, 10, 13] },
      { name: "해물 부추전", allergies: [1, 5, 6, 9, 17] },
      { name: "시금치 나물", allergies: [5, 6] },
      { name: "배추김치", allergies: [9] },
      { name: "요구르트", allergies: [2] }
    ]
  }
];

// 학사 일정 데이터 (NEIS Open API 실시간 동기화로 대체)
export const ACADEMIC_EVENTS: AcademicEvent[] = [];

// 자유게시판 게시글 목록 (초기 임시 데이터 제거)
export const INITIAL_POSTS: PostItem[] = [];

// 기본 블랙리스트 목록 (GitHub 로그인 시 차단 검증)
export const INITIAL_BLACKLIST: BlacklistUser[] = [
  { username: "bad_hacker_2026", email: "hacker@evil.com", reason: "커뮤니티 악성 도배 및 시스템 공격 시도" },
  { username: "troll_user_afk", email: "troll@spam.net", reason: "불법 홍보 링크 게시" }
];
