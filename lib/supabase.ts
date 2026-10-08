/**
 * 대진전자통신고 통합 알리미 - Supabase 클라이언트 및 비즈니스 로직 시뮬레이션 엔진 (TypeScript)
 */

import {
  UserProfile,
  PostItem,
  AuditLogItem,
  BlacklistUser,
  INITIAL_POSTS,
  INITIAL_BLACKLIST
} from './data';

const STORAGE_PREFIX = "dj_alimi_v8_";

export class SupabaseService {
  private isClient = typeof window !== 'undefined';

  constructor() {
    if (this.isClient) {
      this.initDatabase();
    }
  }

  private initDatabase() {
    if (!localStorage.getItem(STORAGE_PREFIX + "profiles")) {
      const defaultProfiles: Record<string, UserProfile> = {
        "user-guest": {
          id: "user-guest",
          email: "guest@daejin.local",
          auth_provider: "guest",
          role: "guest",
          real_name: "게스트 사용자",
          grade: 1,
          class_number: 1,
          student_number: 1,
          department: "스마트소프트웨어과",
          community_nickname: "대진새싹",
          theme_preference: "dark",
          default_schedule: { grade: 1, class: 1 },
          allergy_filters: [1, 2], // 기본 난류, 우유
          github_username: null,
          github_avatar_url: null,
          bio: "대진전자통신고 알리미를 둘러보는 중입니다.",
          privacy_agreed: true,
          privacy_agreed_at: new Date().toISOString()
        },
        "user-teacher-kim": {
          id: "user-teacher-kim",
          email: "kim_teacher@pdj.ht.kr",
          auth_provider: "google",
          role: "teacher",
          real_name: "김진우",
          grade: 2,
          class_number: 1,
          student_number: 0,
          department: "스마트소프트웨어과",
          community_nickname: "진우쌤(SW전공)",
          theme_preference: "dark",
          default_schedule: { grade: 2, class: 1 },
          allergy_filters: [],
          github_username: "teacher-kim-dev",
          github_avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
          bio: "대진전자통신고 소프트웨어과 교사입니다. 성실한 코딩을 응원합니다.",
          privacy_agreed: true,
          privacy_agreed_at: new Date().toISOString()
        },
        "user-student-demo": {
          id: "user-student-demo",
          email: "student_2026@pdj.hs.kr",
          auth_provider: "github",
          role: "student",
          real_name: "박대진",
          grade: 1,
          class_number: 1,
          student_number: 15,
          department: "스마트소프트웨어과",
          community_nickname: "코드마스터_2026",
          theme_preference: "dark",
          default_schedule: { grade: 1, class: 1 },
          allergy_filters: [1, 2, 6], // 난류, 우유, 밀
          github_username: "psj-coder",
          github_avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
          github_profile_url: "https://github.com/psj-coder",
          bio: "전자통신과 SW 풀스택 개발자를 꿈꾸는 학생입니다.",
          privacy_agreed: true,
          privacy_agreed_at: new Date().toISOString()
        }
      };
      localStorage.setItem(STORAGE_PREFIX + "profiles", JSON.stringify(defaultProfiles));
    }

    // 초기 임시 mock 게시물 정리 (사용자가 새로 작성하는 글만 유지)
    const storedPosts = localStorage.getItem(STORAGE_PREFIX + "posts");
    if (!storedPosts) {
      localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify([]));
    } else {
      try {
        const parsed = JSON.parse(storedPosts);
        const filtered = parsed.filter((p: any) => !['post-101', 'post-102', 'post-103'].includes(p.id));
        localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(filtered));
      } catch {
        localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify([]));
      }
    }

    if (!localStorage.getItem(STORAGE_PREFIX + "audit_logs")) {
      const initialLogs: AuditLogItem[] = [
        {
          id: "audit-1",
          actorId: "user-teacher-kim",
          actorName: "김진우 교사",
          targetEmail: "external_partner@company.com",
          action: "approve_etc_account",
          reason: "산학협력 멘토링 특강 산학겸임강사 계정 승인",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ];
      localStorage.setItem(STORAGE_PREFIX + "audit_logs", JSON.stringify(initialLogs));
    }

    if (!localStorage.getItem(STORAGE_PREFIX + "blacklists")) {
      localStorage.setItem(STORAGE_PREFIX + "blacklists", JSON.stringify(INITIAL_BLACKLIST));
    }

    if (!localStorage.getItem(STORAGE_PREFIX + "notes")) {
      const defaultNotes: Record<string, string> = {
        "user-student-demo": "📝 [메모장]\n- 10월 15일 2학기 중간고사 대비\n- 깃허브 Next.js 프로젝트 README.md 업데이트\n- 오늘 급식 돈까스 대기시간 체크",
        "user-teacher-kim": "📌 [교직원 메모]\n- 2학기 캡스톤 페스티벌 심사 기준표 점검\n- 신고 게시물 모니터링 및 지도 상담",
        "user-guest": "📝 [게스트 메모]\n- 대진전자통신고 스마트 알리미 자유 둘러보기"
      };
      localStorage.setItem(STORAGE_PREFIX + "notes", JSON.stringify(defaultNotes));
    }

    // 기본 로그인 상태: 학생 데모로 시작 (체험 편의)
    if (!localStorage.getItem(STORAGE_PREFIX + "current_user")) {
      const defaultUser = {
        id: "user-student-demo",
        email: "student_2026@pdj.hs.kr",
        provider: "github",
        role: "student"
      };
      localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(defaultUser));
    }
  }

  getCurrentUser() {
    if (!this.isClient) return null;
    const saved = localStorage.getItem(STORAGE_PREFIX + "current_user");
    return saved ? JSON.parse(saved) : null;
  }

  getCurrentProfile(): UserProfile | null {
    if (!this.isClient) return null;
    const user = this.getCurrentUser();
    if (!user) return null;
    const profiles = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "profiles") || "{}");
    return profiles[user.id] || null;
  }

  // GitHub 실제 계정 연동 (현실의 존재하는 모든 GitHub 계정 연동, 가짜 무조건 생성 제거)
  async signInWithGitHub(customUsername: string): Promise<UserProfile> {
    const rawUsername = customUsername.trim();
    if (!rawUsername) {
      throw new Error("실제 연동할 본인의 GitHub 사용자명(Username)을 입력해 주십시오.");
    }

    // 1. 실제 현실에 존재하는 GitHub 계정인지 GitHub 공식 API로 검증
    let ghData: any = null;
    try {
      const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(rawUsername)}`);
      if (ghRes.status === 404) {
        throw new Error(`존재하지 않는 GitHub 계정(@${rawUsername})입니다. 실제 존재하는 본인의 GitHub 아이디를 입력해 주십시오.`);
      }
      if (ghRes.ok) {
        ghData = await ghRes.json();
      }
    } catch (err: any) {
      if (err.message && err.message.includes('존재하지 않는')) {
        throw err;
      }
      console.warn('GitHub API rate limit or network issue, using basic identity', err);
    }

    const verifiedLogin = ghData?.login || rawUsername;
    const email = ghData?.email || `${verifiedLogin}@users.noreply.github.com`;

    // 2. 블랙리스트 검증 (Supabase PL/pgSQL 트리거 시뮬레이션)
    const blacklists: BlacklistUser[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "blacklists") || "[]");
    const isBanned = blacklists.some(b => 
      b.username.toLowerCase() === verifiedLogin.toLowerCase() || 
      b.email.toLowerCase() === email.toLowerCase()
    );

    if (isBanned) {
      throw new Error("운영 정책 위반 등으로 인해 이용이 제한된 계정입니다. 관리자(교직원)에게 문의해 주십시오.");
    }

    // 3. 실제 GitHub 프로필 정보로 Supabase UserProfile 매핑
    const userId = "user-github-" + verifiedLogin;
    const profiles: Record<string, UserProfile> = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "profiles") || "{}");

    const realName = ghData?.name || verifiedLogin;
    const avatarUrl = ghData?.avatar_url || `https://github.com/${verifiedLogin}.png`;
    const profileUrl = ghData?.html_url || `https://github.com/${verifiedLogin}`;
    const bioText = ghData?.bio || `대진전통고 실시간 GitHub 연동 사용자 @${verifiedLogin} 입니다.`;

    if (!profiles[userId]) {
      profiles[userId] = {
        id: userId,
        email: email,
        auth_provider: "github",
        role: "student", // 현실의 모든 GitHub 계정에 정식 학생 권한 부여
        real_name: realName,
        grade: 1,
        class_number: 4,
        student_number: Math.floor(Math.random() * 25 + 1),
        department: "AI소프트웨어과",
        community_nickname: verifiedLogin,
        theme_preference: "dark",
        default_schedule: { grade: 1, class: 4 },
        allergy_filters: [],
        github_username: verifiedLogin,
        github_avatar_url: avatarUrl,
        github_profile_url: profileUrl,
        bio: bioText,
        privacy_agreed: true,
        privacy_agreed_at: new Date().toISOString()
      };
    } else {
      // 이미 프로필이 있다면 최신 GitHub 정보 갱신
      profiles[userId].github_username = verifiedLogin;
      profiles[userId].github_avatar_url = avatarUrl;
      profiles[userId].github_profile_url = profileUrl;
      if (ghData?.bio) profiles[userId].bio = bioText;
      if (ghData?.name) profiles[userId].real_name = ghData.name;
    }
    localStorage.setItem(STORAGE_PREFIX + "profiles", JSON.stringify(profiles));

    const sessionUser = {
      id: userId,
      email: email,
      provider: "github",
      role: profiles[userId].role
    };
    localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(sessionUser));
    return profiles[userId];
  }

  // Google OAuth 로그인 시뮬레이션 (PRD v8.0: 학교 공식 도메인 기반 엄격한 권한 분리)
  async signInWithGoogle(email: string): Promise<UserProfile> {
    if (!email || !email.includes("@")) {
      throw new Error("유효한 이메일 주소를 입력해 주십시오.");
    }

    let role: 'student' | 'teacher' | 'etc' = 'etc';
    if (email.endsWith("@pdj.hs.kr")) {
      role = "student";
    } else if (email.endsWith("@pdj.ht.kr") || email.endsWith("@korea.kr")) {
      role = "teacher";
    } else {
      // 일반 외부 구글 계정 차단 문구 (PRD Section 3-①)
      throw new Error("죄송합니다. 학교 공식 이메일(@pdj.hs.kr / @pdj.ht.kr)로 로그인하시거나, 교직원 승인을 받은 계정으로 진행해 주십시오.");
    }

    const userId = "user-google-" + email.replace(/[@.]/g, "-");
    const profiles: Record<string, UserProfile> = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "profiles") || "{}");

    if (!profiles[userId]) {
      const username = email.split("@")[0];
      profiles[userId] = {
        id: userId,
        email: email,
        auth_provider: "google",
        role: role,
        real_name: role === "teacher" ? "대진 교직원" : "대진 재학생",
        grade: role === "teacher" ? 2 : 1,
        class_number: 1,
        student_number: 1,
        department: "스마트소프트웨어과",
        community_nickname: username,
        theme_preference: "dark",
        default_schedule: { grade: 1, class: 1 },
        allergy_filters: [],
        github_username: null,
        github_avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        bio: role === "teacher" ? "대진전자통신고 공식 교직원 계정" : "대진전자통신고 학생",
        privacy_agreed: true,
        privacy_agreed_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_PREFIX + "profiles", JSON.stringify(profiles));
    }

    const sessionUser = {
      id: userId,
      email: email,
      provider: "google",
      role: role
    };
    localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(sessionUser));
    return profiles[userId];
  }

  // 데모 역할 간편 스위칭
  switchDemoRole(roleType: 'student' | 'teacher' | 'guest'): UserProfile | null {
    if (!this.isClient) return null;
    if (roleType === 'teacher') {
      const user = { id: "user-teacher-kim", email: "kim_teacher@pdj.ht.kr", provider: "google", role: "teacher" };
      localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(user));
    } else if (roleType === 'student') {
      const user = { id: "user-student-demo", email: "student_2026@pdj.hs.kr", provider: "github", role: "student" };
      localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(user));
    } else {
      const user = { id: "user-guest", email: "guest@daejin.local", provider: "guest", role: "guest" };
      localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(user));
    }
    return this.getCurrentProfile();
  }

  signOut() {
    if (!this.isClient) return;
    const guestUser = { id: "user-guest", email: "guest@daejin.local", provider: "guest", role: "guest" };
    localStorage.setItem(STORAGE_PREFIX + "current_user", JSON.stringify(guestUser));
  }

  // 프로필 업데이트 (RLS: auth.uid() = id)
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.isClient) throw new Error("브라우저 환경이 아닙니다.");
    const user = this.getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const profiles: Record<string, UserProfile> = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "profiles") || "{}");
    const current = profiles[user.id];
    if (!current) throw new Error("프로필을 찾을 수 없습니다.");

    // 보안 필드 변조 방지 (role, id, auth_provider는 임의 변조 불가)
    const safeUpdates = { ...updates };
    delete safeUpdates.role;
    delete safeUpdates.id;
    delete safeUpdates.auth_provider;

    profiles[user.id] = {
      ...current,
      ...safeUpdates,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_PREFIX + "profiles", JSON.stringify(profiles));
    return profiles[user.id];
  }

  // 회원 탈퇴 및 개인정보 영구 파기 (CASCADE)
  async deleteAccount() {
    if (!this.isClient) return;
    const user = this.getCurrentUser();
    if (!user || user.id === "user-guest") throw new Error("탈퇴할 수 있는 계정이 아닙니다.");

    const uid = user.id;
    const profiles = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "profiles") || "{}");
    delete profiles[uid];
    localStorage.setItem(STORAGE_PREFIX + "profiles", JSON.stringify(profiles));

    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    posts.forEach(p => {
      if (p.authorId === uid) {
        p.authorNickname = "(탈퇴한 사용자)";
        p.githubUsername = null;
        p.authorAvatar = "https://api.dicebear.com/7.x/identicon/svg?seed=deleted";
      }
    });
    localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(posts));

    const notes = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "notes") || "{}");
    delete notes[uid];
    localStorage.setItem(STORAGE_PREFIX + "notes", JSON.stringify(notes));

    this.signOut();
  }

  // 자유게시판: 글 조회 (공개 뷰)
  getPosts(): PostItem[] {
    if (!this.isClient) return [];
    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    return posts.filter(p => !p.isDeleted).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 자유게시판: 새 글 작성
  async createPost(title: string, content: string): Promise<PostItem> {
    if (!this.isClient) throw new Error("클라이언트가 아닙니다.");
    const user = this.getCurrentUser();
    if (!user) throw new Error("글을 작성하려면 로그인이 필요합니다.");
    const profile = this.getCurrentProfile();

    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    const newPost: PostItem = {
      id: "post-" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      authorId: user.id,
      authorNickname: profile ? profile.community_nickname : "익명",
      authorRole: profile ? profile.role : "student",
      authorAvatar: profile?.github_avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`,
      githubUsername: profile?.github_username || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      isReported: false,
      isDeleted: false,
      snapshots: []
    };

    posts.unshift(newPost);
    localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(posts));
    return newPost;
  }

  // 자유게시판: 30분 이내 수정 및 10초 쿨타임 무결성 검증 (PL/pgSQL Trigger 대응)
  async updatePost(postId: string, newContent: string): Promise<PostItem> {
    if (!this.isClient) throw new Error("클라이언트가 아닙니다.");
    const user = this.getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("게시물을 찾을 수 없습니다.");

    if (post.authorId !== user.id) {
      throw new Error("본인이 작성한 게시물만 수정할 수 있습니다.");
    }

    const createdTime = new Date(post.createdAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - createdTime) / (1000 * 60);

    // 30분 수정 제한 정책
    if (diffMinutes > 30) {
      throw new Error(`작성 후 30분이 초과된 게시물은 수정할 수 없습니다. (경과 시간: ${Math.floor(diffMinutes)}분)`);
    }

    // 신고된 게시물일 때: 10초 쿨타임 DB 트리거 시뮬레이션
    if (post.isReported) {
      if (post.snapshots && post.snapshots.length > 0) {
        const lastSnap = post.snapshots[post.snapshots.length - 1];
        const lastTime = new Date(lastSnap.modifiedAt).getTime();
        const secDiff = (now - lastTime) / 1000;

        if (secDiff < 10) {
          throw new Error(`[DB Trigger 에러]: 신고 게시물 데이터 무결성을 위해 10초 쿨타임이 강제됩니다. (${(10 - secDiff).toFixed(1)}초 후 다시 시도하십시오)`);
        }
      }

      if (!post.snapshots) post.snapshots = [];
      post.snapshots.push({
        snapshotId: "snap-" + Date.now(),
        modifiedAt: new Date().toISOString(),
        content: newContent,
        authorNickname: post.authorNickname
      });
    }

    post.content = newContent;
    post.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(posts));
    return post;
  }

  // 자유게시판: 조건부 삭제 정책 (미신고: 완전 삭제 / 신고누적: 피드 숨김 및 백업 보존)
  async deletePost(postId: string) {
    if (!this.isClient) return;
    const user = this.getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error("게시물을 찾을 수 없습니다.");

    const post = posts[index];
    const isTeacher = user.role === "teacher";

    if (post.authorId !== user.id && !isTeacher) {
      throw new Error("삭제 권한이 없습니다.");
    }

    if (post.isReported) {
      post.isDeleted = true;
      post.deletedReason = "신고 누적으로 인한 보존 삭제 처리";
      localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(posts));
      return { status: "hidden", message: "신고 접수된 게시물은 이력 관리를 위해 피드에서 숨김 처리되고 교직원 백업 보관함에 보존됩니다." };
    } else {
      posts.splice(index, 1);
      localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(posts));
      return { status: "deleted", message: "게시물이 완전히 삭제되었습니다." };
    }
  }

  // 게시글 신고
  async reportPost(postId: string, reason = "부적절한 내용 또는 욕설/비방") {
    if (!this.isClient) return;
    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("게시물을 찾을 수 없습니다.");

    post.isReported = true;
    post.reportReason = reason;
    post.reportedAt = new Date().toISOString();

    if (!post.snapshots || post.snapshots.length === 0) {
      post.snapshots = [
        {
          snapshotId: "snap-init-" + Date.now(),
          modifiedAt: post.createdAt,
          content: post.content,
          authorNickname: post.authorNickname,
          label: "최초 신고 시점 원본 내용"
        }
      ];
    }

    localStorage.setItem(STORAGE_PREFIX + "posts", JSON.stringify(posts));
    return post;
  }

  // 교직원 전용: 신고된 게시물 및 하위 수정본 파일 캐비닛 뷰
  getReportedPosts(): PostItem[] {
    if (!this.isClient) return [];
    const user = this.getCurrentUser();
    if (!user || user.role !== "teacher") return [];

    const posts: PostItem[] = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "posts") || "[]");
    return posts.filter(p => p.isReported).sort((a, b) => new Date(b.reportedAt || b.createdAt).getTime() - new Date(a.reportedAt || a.createdAt).getTime());
  }

  // 교직원 전용: 감사 로그
  getAuditLogs(): AuditLogItem[] {
    if (!this.isClient) return [];
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + "audit_logs") || "[]");
  }

  // 개인 메모장
  getNotes(): string {
    if (!this.isClient) return "";
    const user = this.getCurrentUser();
    if (!user) return "";
    const notes = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "notes") || "{}");
    return notes[user.id] || "";
  }

  saveNotes(text: string) {
    if (!this.isClient) return;
    const user = this.getCurrentUser();
    if (!user) return;
    const notes = JSON.parse(localStorage.getItem(STORAGE_PREFIX + "notes") || "{}");
    notes[user.id] = text;
    localStorage.setItem(STORAGE_PREFIX + "notes", JSON.stringify(notes));
  }

  // 교직원 전용: 시간표 수동 강제 동기화 (Manual Sync)
  async manualSyncSchedule() {
    const user = this.getCurrentUser();
    if (!user || user.role !== "teacher") {
      throw new Error("시간표 강제 동기화 권한은 교직원(teacher) 전용입니다.");
    }
    await new Promise(r => setTimeout(r, 1000));
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      message: "NEIS 및 외부 시간표 소스와 Supabase 캐시 DB가 실시간으로 성공적으로 동기화되었습니다."
    };
  }
}

export const supabaseService = new SupabaseService();
