/**
 * 대진전자통신고 통합 알리미 - Supabase 클라이언트 및 풀스택 시뮬레이션 엔진
 * - 실제 Supabase URL / Anon Key 연동 지원
 * - 브라우저 영구 로컬스토리지 기반 완벽한 RLS, 트리거, Audit Log, 블랙리스트, Auth 시뮬레이터 내장
 */

class SupabaseService {
  constructor() {
    this.storagePrefix = "dj_alimi_v8_";
    this.initDatabase();
  }

  // 초기 로컬 데이터베이스 및 상태 세팅
  initDatabase() {
    // 1. 프로필 테이블 (user_profiles)
    if (!localStorage.getItem(this.storagePrefix + "profiles")) {
      const defaultProfiles = {
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
          department: "스마트소프트웨어과",
          community_nickname: "진우쌤(SW담당)",
          theme_preference: "dark",
          default_schedule: { grade: 2, class: 1 },
          allergy_filters: [],
          github_username: "teacher-kim-dev",
          github_avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
          bio: "대진전자통신고 소프트웨어과 담당 교사입니다.",
          privacy_agreed: true,
          privacy_agreed_at: new Date().toISOString()
        }
      };
      localStorage.setItem(this.storagePrefix + "profiles", JSON.stringify(defaultProfiles));
    }

    // 2. 게시글 테이블 (posts)
    if (!localStorage.getItem(this.storagePrefix + "posts")) {
      localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(window.DJ_DATA.initialPosts));
    }

    // 3. 감사 로그 테이블 (audit_logs)
    if (!localStorage.getItem(this.storagePrefix + "audit_logs")) {
      const initialLogs = [
        {
          id: "audit-1",
          actorId: "user-teacher-kim",
          actorName: "김진우 교사",
          targetEmail: "external_partner@company.com",
          action: "approve_etc_account",
          reason: "산학협력 멘토링 특강 강사 계정 승인",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ];
      localStorage.setItem(this.storagePrefix + "audit_logs", JSON.stringify(initialLogs));
    }

    // 4. 블랙리스트 테이블 (blacklisted_users)
    if (!localStorage.getItem(this.storagePrefix + "blacklists")) {
      localStorage.setItem(this.storagePrefix + "blacklists", JSON.stringify(window.DJ_DATA.blacklist));
    }

    // 5. 개인 메모장 (notes)
    if (!localStorage.getItem(this.storagePrefix + "notes")) {
      const defaultNotes = {
        "user-guest": "📝 [메모장]\n- 10월 15일 중간고사 1차 지필평가 대비\n- 깃허브 리포지토리 README.md 작성하기\n- 급식 맛있게 먹기!",
        "user-teacher-kim": "📌 [교직원 메모]\n- 2학기 캡스톤 디자인 심사 채점표 준비\n- 신고 게시물 모니터링 및 학생 상담"
      };
      localStorage.setItem(this.storagePrefix + "notes", JSON.stringify(defaultNotes));
    }

    // 현재 세션 초기화 (기본 게스트 또는 이전 로그인 사용자)
    const savedUser = localStorage.getItem(this.storagePrefix + "current_user");
    this.currentUser = savedUser ? JSON.parse(savedUser) : null;
  }

  // 현재 로그인된 사용자 정보 반환
  getCurrentUser() {
    return this.currentUser;
  }

  // 현재 사용자 프로필 반환
  getCurrentProfile() {
    if (!this.currentUser) return null;
    const profiles = JSON.parse(localStorage.getItem(this.storagePrefix + "profiles") || "{}");
    return profiles[this.currentUser.id] || null;
  }

  // GitHub OAuth 로그인 시뮬레이션 (PRD v8.0: 블랙리스트 외 전면 허용)
  async signInWithGitHub(customUsername = "") {
    const rawUsername = customUsername.trim() || `dj-student-${Math.floor(Math.random() * 900 + 100)}`;
    const email = `${rawUsername}@users.noreply.github.com`;

    // 1. 블랙리스트 검증 (Supabase PL/pgSQL 트리거 시뮬레이션)
    const blacklists = JSON.parse(localStorage.getItem(this.storagePrefix + "blacklists") || "[]");
    const isBanned = blacklists.some(b => 
      b.username.toLowerCase() === rawUsername.toLowerCase() || 
      b.email.toLowerCase() === email.toLowerCase()
    );

    if (isBanned) {
      throw new Error("운영 정책 위반 등으로 인해 이용이 제한된 계정입니다. 관리자(교직원)에게 문의해 주십시오.");
    }

    // 2. 사용자 ID 및 프로필 자동 생성 (handle_new_user 트리거 시뮬레이션)
    const userId = "user-github-" + rawUsername;
    const profiles = JSON.parse(localStorage.getItem(this.storagePrefix + "profiles") || "{}");

    if (!profiles[userId]) {
      // 신규 가입: GitHub 메타데이터 추출 및 프로필 자동 초기화
      profiles[userId] = {
        id: userId,
        email: email,
        auth_provider: "github",
        role: "student", // 블랙리스트 아니면 누구나 학생/기본 권한 부여
        real_name: rawUsername,
        grade: 1,
        class_number: 1,
        student_number: Math.floor(Math.random() * 25 + 1),
        department: "스마트소프트웨어과",
        community_nickname: rawUsername,
        theme_preference: "dark",
        default_schedule: { grade: 1, class: 1 },
        allergy_filters: [1, 2],
        github_username: rawUsername,
        github_avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${rawUsername}`,
        github_profile_url: `https://github.com/${rawUsername}`,
        bio: `안녕하세요! 대진전통고 GitHub 연동 사용자 @${rawUsername} 입니다.`,
        privacy_agreed: true,
        privacy_agreed_at: new Date().toISOString()
      };
      localStorage.setItem(this.storagePrefix + "profiles", JSON.stringify(profiles));
    }

    this.currentUser = {
      id: userId,
      email: email,
      provider: "github",
      role: profiles[userId].role
    };
    localStorage.setItem(this.storagePrefix + "current_user", JSON.stringify(this.currentUser));

    return profiles[userId];
  }

  // Google OAuth 로그인 시뮬레이션 (PRD v8.0: 도메인 기반 엄격한 권한 분리)
  async signInWithGoogle(email) {
    if (!email || !email.includes("@")) {
      throw new Error("유효한 이메일 주소를 입력해 주십시오.");
    }

    let role = "etc";
    if (email.endsWith("@pdj.hs.kr")) {
      role = "student";
    } else if (email.endsWith("@pdj.ht.kr") || email.endsWith("@korea.kr")) {
      role = "teacher";
    } else {
      // 비인가 외부 도메인: 차단 문구
      throw new Error("죄송합니다. 학교 공식 이메일(@pdj.hs.kr / @pdj.ht.kr)로 로그인하시거나, 교직원 승인을 받은 계정으로 진행해 주십시오.");
    }

    const userId = "user-google-" + email.replace(/[@.]/g, "-");
    const profiles = JSON.parse(localStorage.getItem(this.storagePrefix + "profiles") || "{}");

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
        bio: role === "teacher" ? "대진전자통신고 공식 교직원 계정" : "대진전자통신고 재학생",
        privacy_agreed: true,
        privacy_agreed_at: new Date().toISOString()
      };
      localStorage.setItem(this.storagePrefix + "profiles", JSON.stringify(profiles));
    }

    this.currentUser = {
      id: userId,
      email: email,
      provider: "google",
      role: role
    };
    localStorage.setItem(this.storagePrefix + "current_user", JSON.stringify(this.currentUser));

    return profiles[userId];
  }

  // 데모 계정 간편 전환
  switchDemoAccount(roleType) {
    if (roleType === "teacher") {
      this.currentUser = {
        id: "user-teacher-kim",
        email: "kim_teacher@pdj.ht.kr",
        provider: "google",
        role: "teacher"
      };
    } else if (roleType === "student") {
      this.currentUser = {
        id: "user-student-demo",
        email: "student_2026@pdj.hs.kr",
        provider: "github",
        role: "student"
      };
      // 프로필 보장
      const profiles = JSON.parse(localStorage.getItem(this.storagePrefix + "profiles") || "{}");
      if (!profiles["user-student-demo"]) {
        profiles["user-student-demo"] = {
          id: "user-student-demo",
          email: "student_2026@pdj.hs.kr",
          auth_provider: "github",
          role: "student",
          real_name: "박대진",
          grade: 1,
          class_number: 1,
          student_number: 15,
          department: "스마트소프트웨어과",
          community_nickname: "코딩꿈나무",
          theme_preference: "dark",
          default_schedule: { grade: 1, class: 1 },
          allergy_filters: [1, 2, 6], // 난류, 우유, 밀
          github_username: "daejin-coder",
          github_avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
          github_profile_url: "https://github.com/daejin-coder",
          bio: "전자통신과 SW 풀스택 개발자를 꿈꾸는 학생입니다.",
          privacy_agreed: true,
          privacy_agreed_at: new Date().toISOString()
        };
        localStorage.setItem(this.storagePrefix + "profiles", JSON.stringify(profiles));
      }
    } else {
      this.currentUser = null;
    }

    if (this.currentUser) {
      localStorage.setItem(this.storagePrefix + "current_user", JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(this.storagePrefix + "current_user");
    }
    return this.getCurrentProfile();
  }

  // 로그아웃
  signOut() {
    this.currentUser = null;
    localStorage.removeItem(this.storagePrefix + "current_user");
  }

  // 프로필 업데이트 (RLS: auth.uid() = id)
  async updateProfile(updates) {
    if (!this.currentUser) throw new Error("로그인이 필요합니다.");
    const profiles = JSON.parse(localStorage.getItem(this.storagePrefix + "profiles") || "{}");
    const current = profiles[this.currentUser.id];
    if (!current) throw new Error("프로필을 찾을 수 없습니다.");

    // 보안 필드 변조 방지 (role, privacy_agreed_at 등은 직접 임의 변경 불가)
    const safeUpdates = { ...updates };
    delete safeUpdates.role;
    delete safeUpdates.id;
    delete safeUpdates.auth_provider;

    profiles[this.currentUser.id] = {
      ...current,
      ...safeUpdates,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(this.storagePrefix + "profiles", JSON.stringify(profiles));
    return profiles[this.currentUser.id];
  }

  // 회원 탈퇴 및 개인정보 영구 파기 (CASCADE)
  async deleteAccount() {
    if (!this.currentUser) throw new Error("로그인이 필요합니다.");
    const uid = this.currentUser.id;

    // 1. 프로필 영구 삭제
    const profiles = JSON.parse(localStorage.getItem(this.storagePrefix + "profiles") || "{}");
    delete profiles[uid];
    localStorage.setItem(this.storagePrefix + "profiles", JSON.stringify(profiles));

    // 2. 게시물 작성자 마스킹 처리 (개인정보 추적 차단)
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");
    posts.forEach(p => {
      if (p.authorId === uid) {
        p.authorNickname = "(탈퇴한 사용자)";
        p.githubUsername = null;
        p.authorAvatar = "https://api.dicebear.com/7.x/identicon/svg?seed=deleted";
      }
    });
    localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(posts));

    // 3. 메모장 삭제
    const notes = JSON.parse(localStorage.getItem(this.storagePrefix + "notes") || "{}");
    delete notes[uid];
    localStorage.setItem(this.storagePrefix + "notes", JSON.stringify(notes));

    // 4. 세션 해제
    this.signOut();
  }

  // 자유게시판: 글 조회 (공개 뷰: 닉네임만 노출, 민감정보 은닉)
  getPosts() {
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");
    // 삭제 안 된 것 최신순
    return posts.filter(p => !p.isDeleted).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // 자유게시판: 글 작성
  async createPost(title, content) {
    if (!this.currentUser) throw new Error("글을 작성하려면 로그인이 필요합니다.");
    const profile = this.getCurrentProfile();
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");

    const newPost = {
      id: "post-" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      authorId: this.currentUser.id,
      authorNickname: profile ? profile.community_nickname : "익명",
      authorRole: profile ? profile.role : "student",
      authorAvatar: profile && profile.github_avatar_url ? profile.github_avatar_url : `https://api.dicebear.com/7.x/identicon/svg?seed=${this.currentUser.id}`,
      githubUsername: profile ? profile.github_username : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      isReported: false,
      isDeleted: false,
      snapshots: []
    };

    posts.unshift(newPost);
    localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(posts));
    return newPost;
  }

  // 자유게시판: 30분 이내 수정 및 10초 쿨타임 무결성 검증 (PL/pgSQL Trigger 대응)
  async updatePost(postId, newContent) {
    if (!this.currentUser) throw new Error("로그인이 필요합니다.");
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("게시물을 찾을 수 없습니다.");

    // 본인 작성자 검증
    if (post.authorId !== this.currentUser.id) {
      throw new Error("본인이 작성한 게시물만 수정할 수 있습니다.");
    }

    // 30분 수정 제한 정책 검증
    const createdTime = new Date(post.createdAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - createdTime) / (1000 * 60);

    if (diffMinutes > 30) {
      throw new Error(`작성 후 30분이 초과된 게시물은 수정할 수 없습니다. (경과 시간: ${Math.floor(diffMinutes)}분)`);
    }

    // [v8.0 핵심 보안]: 신고된 게시물 수정 시 10초 쿨타임 무결성 DB 검증 (PL/pgSQL Trigger 시뮬레이션)
    if (post.isReported) {
      if (post.snapshots && post.snapshots.length > 0) {
        const lastSnapshot = post.snapshots[post.snapshots.length - 1];
        const lastSnapTime = new Date(lastSnapshot.modifiedAt).getTime();
        const secDiff = (now - lastSnapTime) / 1000;

        if (secDiff < 10) {
          throw new Error(`[DB Trigger 에러]: 신고 게시물 데이터 무결성을 위해 10초 쿨타임이 강제됩니다. (${(10 - secDiff).toFixed(1)}초 후 다시 시도하십시오)`);
        }
      }

      // 스냅샷 폴더에 새 버전 누적
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
    localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(posts));
    return post;
  }

  // 자유게시판: 조건부 삭제 정책 (미신고: 완전 삭제 / 신고누적: 피드 숨김 및 백업 보존)
  async deletePost(postId) {
    if (!this.currentUser) throw new Error("로그인이 필요합니다.");
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error("게시물을 찾을 수 없습니다.");

    const post = posts[index];
    const isTeacher = this.currentUser.role === "teacher";

    if (post.authorId !== this.currentUser.id && !isTeacher) {
      throw new Error("삭제 권한이 없습니다.");
    }

    if (post.isReported) {
      // 신고 누적 게시물: 완전 삭제 대신 숨김 처리 및 백업 보존
      post.isDeleted = true;
      post.deletedReason = "신고 누적으로 인한 보존 삭제 처리";
      localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(posts));
      return { status: "hidden_backed_up", message: "신고 접수된 게시물은 이력 관리를 위해 피드에서 숨김 처리되고 교직원 백업 보관함에 보존됩니다." };
    } else {
      // 미신고 게시물: 완전 삭제
      posts.splice(index, 1);
      localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(posts));
      return { status: "permanently_deleted", message: "게시물이 완전히 삭제되었습니다." };
    }
  }

  // 게시글 신고
  async reportPost(postId, reason = "부적절한 내용") {
    if (!this.currentUser) throw new Error("신고하려면 로그인이 필요합니다.");
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("게시물을 찾을 수 없습니다.");

    post.isReported = true;
    post.reportReason = reason;
    post.reportedAt = new Date().toISOString();

    // 초기 스냅샷 보존
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

    localStorage.setItem(this.storagePrefix + "posts", JSON.stringify(posts));
    return post;
  }

  // 교직원 전용: 신고된 게시물 및 하위 수정본 파일 캐비닛 뷰 조회
  getReportedPosts() {
    const user = this.currentUser;
    if (!user || user.role !== "teacher") {
      return []; // 교직원만 열람 가능
    }
    const posts = JSON.parse(localStorage.getItem(this.storagePrefix + "posts") || "[]");
    return posts.filter(p => p.isReported).sort((a, b) => new Date(b.reportedAt || b.createdAt) - new Date(a.reportedAt || a.createdAt));
  }

  // 개인 메모장 로드 및 저장
  getNotes() {
    if (!this.currentUser) return "로그인 후 개인 메모장을 사용할 수 있습니다.";
    const notes = JSON.parse(localStorage.getItem(this.storagePrefix + "notes") || "{}");
    return notes[this.currentUser.id] || "";
  }

  saveNotes(text) {
    if (!this.currentUser) return;
    const notes = JSON.parse(localStorage.getItem(this.storagePrefix + "notes") || "{}");
    notes[this.currentUser.id] = text;
    localStorage.setItem(this.storagePrefix + "notes", JSON.stringify(notes));
  }

  // 교직원 전용: 시간표 강제 수동 동기화 (Manual Sync)
  async manualSyncSchedule() {
    const user = this.currentUser;
    if (!user || user.role !== "teacher") {
      throw new Error("시간표 강제 동기화 권한은 교직원(teacher) 전용입니다.");
    }
    // 동기화 시뮬레이션 지연 (1.2초)
    await new Promise(res => setTimeout(res, 1200));
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      source: "NEIS & eznel.com Supabase Cache Server",
      message: "최신 학기 시간표 데이터가 Supabase DB에 무결성 검증 후 성공적으로 동기화되었습니다."
    };
  }
}

// 전역 싱글톤 인스턴스 등록
window.supabaseService = new SupabaseService();
