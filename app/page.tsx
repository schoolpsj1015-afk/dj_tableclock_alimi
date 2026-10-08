'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  Utensils,
  MessageSquare,
  ShieldAlert,
  User,
  Moon,
  Sun,
  RotateCw,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  GraduationCap,
  School,
  FolderOpen
} from 'lucide-react';

import {
  ALLERGY_CODES,
  DEPARTMENTS,
  SCHEDULE_DATA,
  MEAL_DATA,
  ACADEMIC_EVENTS,
  UserProfile,
  PostItem,
  AuditLogItem
} from '../lib/data';
import { supabaseService } from '../lib/supabase';
import { NeisClassItem, NeisPeriodItem, NeisMealItem } from '../lib/neis';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function HomePage() {
  // 상태 관리
  const [currentTab, setCurrentTab] = useState<'main' | 'schedule' | 'academic' | 'meals' | 'board' | 'alerts' | 'profile'>('main');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // 시간표 뷰 상태
  const [scheduleView, setScheduleView] = useState<'daily' | 'weekly'>('daily');
  const [selectedClass, setSelectedClass] = useState<string>('1-4'); // NEIS 대진전통고 1-4반 기본
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-14'); // 기본 고등학교 시간표 일자

  // NEIS API 실시간 상태
  const [neisClasses, setNeisClasses] = useState<NeisClassItem[]>([]);
  const [liveTimetable, setLiveTimetable] = useState<NeisPeriodItem[]>([]);
  const [liveMeals, setLiveMeals] = useState<NeisMealItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 데이터 상태
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reportedPosts, setReportedPosts] = useState<PostItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [notesSaved, setNotesSaved] = useState<boolean>(true);

  // 모달 상태
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [writeModalOpen, setWriteModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);

  // 폼 입력 상태
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // 프로필 편집 폼
  const [profRealName, setProfRealName] = useState('');
  const [profNickname, setProfNickname] = useState('');
  const [profGrade, setProfGrade] = useState(1);
  const [profClass, setProfClass] = useState(4);
  const [profNum, setProfNum] = useState(1);
  const [profDept, setProfDept] = useState('AI소프트웨어과');
  const [profAllergies, setProfAllergies] = useState<number[]>([]);

  // 토스트 메시지
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; text: string }[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // 1. NEIS API 데이터 로딩 (학급정보, 급식, 시간표)
  const loadNeisClasses = async () => {
    try {
      const res = await fetch('/api/neis/classes');
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setNeisClasses(json.data);
      }
    } catch (e) {
      console.warn('Failed to load NEIS classes', e);
    }
  };

  const loadNeisMeals = async () => {
    try {
      const res = await fetch('/api/neis/meals');
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setLiveMeals(json.data);
      }
    } catch (e) {
      console.warn('Failed to load NEIS meals', e);
    }
  };

  const loadNeisTimetable = async (grade: number | string, classNm: number | string, dateStr: string = selectedDate) => {
    try {
      const ymd = dateStr.replace(/-/g, '');
      const res = await fetch(`/api/neis/timetable?grade=${grade}&classNm=${classNm}&ymd=${ymd}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLiveTimetable(json.data);
      }
    } catch (e) {
      console.warn('Failed to load NEIS timetable', e);
    }
  };

  // 초기 로딩
  useEffect(() => {
    const profile = supabaseService.getCurrentProfile();
    if (profile) {
      setCurrentUser(profile);
      setTheme(profile.theme_preference === 'light' ? 'light' : 'dark');
      if (profile.default_schedule) {
        setSelectedClass(`${profile.default_schedule.grade}-${profile.default_schedule.class}`);
      }
      populateProfileForm(profile);
    }

    setPosts(supabaseService.getPosts());
    setReportedPosts(supabaseService.getReportedPosts());
    setAuditLogs(supabaseService.getAuditLogs());
    setNotes(supabaseService.getNotes());

    // NEIS 라이브 데이터 불러오기
    loadNeisClasses();
    loadNeisMeals();
  }, []);

  // 선택된 학급이나 날짜가 바뀌면 NEIS 시간표 호출
  useEffect(() => {
    const parts = selectedClass.split('-');
    const g = parts[0] || '1';
    const c = parts[1] || '4';
    loadNeisTimetable(g, c, selectedDate);
  }, [selectedClass, selectedDate]);

  // 테마 동기화
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (currentUser) {
      supabaseService.updateProfile({ theme_preference: nextTheme });
    }
  };

  const populateProfileForm = (profile: UserProfile) => {
    setProfRealName(profile.real_name || '');
    setProfNickname(profile.community_nickname || '');
    setProfGrade(profile.grade || 1);
    setProfClass(profile.class_number || 4);
    setProfNum(profile.student_number || 1);
    setProfDept(profile.department || 'AI소프트웨어과');
    setProfAllergies(profile.allergy_filters || []);
  };

  // 역할 간편 전환 (데모 테스트용)
  const handleRoleChange = (role: 'student' | 'teacher' | 'guest') => {
    const updated = supabaseService.switchDemoRole(role);
    setCurrentUser(updated);
    if (updated) {
      populateProfileForm(updated);
      setSelectedClass(`${updated.default_schedule.grade}-${updated.default_schedule.class}`);
    }
    setReportedPosts(supabaseService.getReportedPosts());
    setNotes(supabaseService.getNotes());
    showToast(`${role === 'teacher' ? '👨‍🏫 교직원 모드(Google)' : role === 'student' ? '🎓 학생 모드(GitHub)' : '👤 게스트 모드'}로 전환되었습니다.`, 'info');
  };

  // GitHub 로그인 처리 (PRD v8.0: 블랙리스트 외 전면 허용)
  const handleGitHubLogin = async () => {
    try {
      const profile = await supabaseService.signInWithGitHub(githubInput);
      setCurrentUser(profile);
      populateProfileForm(profile);
      setAuthModalOpen(false);
      setGithubInput('');
      setReportedPosts(supabaseService.getReportedPosts());
      showToast(`GitHub 계정(@${profile.github_username})으로 성공적으로 로그인되었습니다!`, 'success');
    } catch (err: any) {
      showToast(err.message || '로그인 오류', 'error');
    }
  };

  // Google 로그인 처리 (PRD v8.0: 학교 공식 도메인 엄격 분리)
  const handleGoogleLogin = async () => {
    try {
      const profile = await supabaseService.signInWithGoogle(googleEmailInput);
      setCurrentUser(profile);
      populateProfileForm(profile);
      setAuthModalOpen(false);
      setGoogleEmailInput('');
      setReportedPosts(supabaseService.getReportedPosts());
      showToast(`${profile.role === 'teacher' ? '교직원' : '학생'} 공식 계정으로 인증되었습니다.`, 'success');
    } catch (err: any) {
      showToast(err.message || '인증 오류', 'error');
    }
  };

  // 메모 실시간 저장
  const handleNotesChange = (text: string) => {
    setNotes(text);
    setNotesSaved(false);
    supabaseService.saveNotes(text);
  };

  const handleManualNotesSave = () => {
    supabaseService.saveNotes(notes);
    setNotesSaved(true);
    showToast('개인 메모가 Supabase DB에 저장되었습니다.', 'success');
  };

  // 시간표 수동 동기화 (NEIS 실시간 API 강제 연동)
  const handleManualSync = async () => {
    if (currentUser?.role !== 'teacher') {
      showToast('시간표 수동 동기화는 교직원(teacher) 전용 권한입니다.', 'error');
      return;
    }
    try {
      setIsSyncing(true);
      showToast('NEIS(부산광역시교육청 C10 대진전자통신고 7150597) 실시간 동기화 중...', 'info');
      const parts = selectedClass.split('-');
      await Promise.all([
        loadNeisClasses(),
        loadNeisMeals(),
        loadNeisTimetable(parts[0], parts[1]),
        supabaseService.manualSyncSchedule()
      ]);
      showToast('NEIS 공식 Open API(시간표·급식·학급) 최신 데이터가 성공적으로 갱신되었습니다!', 'success');
    } catch (err: any) {
      showToast(err.message || '동기화 실패', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 게시글 작성
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await supabaseService.createPost(newTitle, newContent);
      setPosts(supabaseService.getPosts());
      setNewTitle('');
      setNewContent('');
      setWriteModalOpen(false);
      showToast('게시글이 성공적으로 등록되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 게시글 수정 모달 열기 (30분 검증)
  const openEditModal = (post: PostItem) => {
    const createdTime = new Date(post.createdAt).getTime();
    const diffMin = (Date.now() - createdTime) / (1000 * 60);
    if (diffMin > 30) {
      showToast(`작성 후 30분이 경과하여 수정할 수 없습니다. (${Math.floor(diffMin)}분 경과)`, 'error');
      return;
    }
    setEditingPostId(post.id);
    setEditingContent(post.content);
    setEditModalOpen(true);
  };

  // 게시글 수정 완료 (10초 쿨타임 DB 트리거 시뮬레이션)
  const handleSaveEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostId) return;
    try {
      await supabaseService.updatePost(editingPostId, editingContent);
      setPosts(supabaseService.getPosts());
      setReportedPosts(supabaseService.getReportedPosts());
      setEditModalOpen(false);
      showToast('게시물이 수정되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
    try {
      const res = await supabaseService.deletePost(postId);
      setPosts(supabaseService.getPosts());
      setReportedPosts(supabaseService.getReportedPosts());
      showToast(res?.message || '삭제되었습니다.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 게시글 신고
  const handleReportPost = async (postId: string) => {
    const reason = prompt('신고 사유를 입력해 주십시오 (욕설/비방/불법광고 등):');
    if (!reason) return;
    try {
      await supabaseService.reportPost(postId, reason);
      setPosts(supabaseService.getPosts());
      setReportedPosts(supabaseService.getReportedPosts());
      showToast('신고가 접수되었습니다. 교직원 검토함으로 이관됩니다.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 프로필 저장
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await supabaseService.updateProfile({
        real_name: profRealName,
        community_nickname: profNickname,
        grade: Number(profGrade),
        class_number: Number(profClass),
        student_number: Number(profNum),
        department: profDept,
        default_schedule: { grade: Number(profGrade), class: Number(profClass) },
        allergy_filters: profAllergies
      });
      setCurrentUser(updated);
      setSelectedClass(`${profGrade}-${profClass}`);
      showToast('프로필 및 학적/알레르기 설정이 성공적으로 저장되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 회원 탈퇴
  const handleDeleteAccount = async () => {
    if (!confirm('정말로 회원 탈퇴하시겠습니까? 등록된 학적 및 개인정보가 즉시 영구 파기됩니다.')) return;
    try {
      await supabaseService.deleteAccount();
      const guest = supabaseService.getCurrentProfile();
      setCurrentUser(guest);
      setPosts(supabaseService.getPosts());
      showToast('회원 탈퇴 및 개인정보 파기가 완료되었습니다.', 'info');
      setCurrentTab('main');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 알레르기 토글
  const toggleAllergy = (id: number) => {
    if (profAllergies.includes(id)) {
      setProfAllergies(profAllergies.filter(a => a !== id));
    } else {
      setProfAllergies([...profAllergies, id]);
    }
  };

  // 현재 표시할 시간표 데이터 매핑 (NEIS 실시간 데이터가 있으면 최우선 적용, 없으면 Fallback 데이터)
  const currentFallback = SCHEDULE_DATA[selectedClass] || SCHEDULE_DATA['1-1'];
  const displayDepartment = neisClasses.find(c => `${c.grade}-${c.classNm}` === selectedClass)?.department || currentFallback.dept;

  // NEIS 급식 또는 Fallback 급식
  const displayMeals = liveMeals.length > 0 ? liveMeals : MEAL_DATA;
  const todayMeal = displayMeals[0];

  return (
    <div className="app-container">
      {/* 🌟 헤더 */}
      <header className="app-header">
        <button className="brand-section" onClick={() => setCurrentTab('main')}>
          <div className="brand-logo-badge">
            <Sparkles size={24} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">대진 스마트 알리미</span>
            <span className="brand-sub">대진전자통신고등학교 NEIS Open API v8.0</span>
          </div>
        </button>

        {/* 데스크톱 네비게이션 */}
        <nav className="desktop-nav">
          <button className={`nav-item ${currentTab === 'main' ? 'active' : ''}`} onClick={() => setCurrentTab('main')}>
            <School size={16} /> 메인
          </button>
          <button className={`nav-item ${currentTab === 'schedule' ? 'active' : ''}`} onClick={() => setCurrentTab('schedule')}>
            <Clock size={16} /> 시간표
          </button>
          <button className={`nav-item ${currentTab === 'academic' ? 'active' : ''}`} onClick={() => setCurrentTab('academic')}>
            <Calendar size={16} /> 학사일정
          </button>
          <button className={`nav-item ${currentTab === 'meals' ? 'active' : ''}`} onClick={() => setCurrentTab('meals')}>
            <Utensils size={16} /> 급식표
          </button>
          <button className={`nav-item ${currentTab === 'board' ? 'active' : ''}`} onClick={() => setCurrentTab('board')}>
            <MessageSquare size={16} /> 자유게시판
          </button>

          {/* 교직원 전용 알림 탭 (PRD Section 4-②) */}
          {currentUser?.role === 'teacher' && (
            <button className={`nav-item ${currentTab === 'alerts' ? 'active' : ''}`} onClick={() => setCurrentTab('alerts')}>
              <ShieldAlert size={16} /> 교직원 알림
              {reportedPosts.length > 0 && <span className="badge-count">{reportedPosts.length}</span>}
            </button>
          )}

          <button className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setCurrentTab('profile')}>
            <User size={16} /> 내 정보
          </button>
        </nav>

        {/* 상단 우측 액션 */}
        <div className="header-actions">
          {/* 테마 토글 */}
          <button className="btn-icon" onClick={toggleTheme} title="다크/화이트 모드 토글">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* 데모 역할 셀렉터 */}
          <div className="select-group">
            <select
              className="custom-select"
              value={currentUser?.role === 'teacher' ? 'teacher' : currentUser?.role === 'guest' ? 'guest' : 'student'}
              onChange={(e) => handleRoleChange(e.target.value as any)}
              title="빠른 역할 전환"
            >
              <option value="student">🎓 학생 모드 (GitHub)</option>
              <option value="teacher">👨‍🏫 교직원 모드 (Google)</option>
              <option value="guest">👤 게스트 모드</option>
            </select>
          </div>

          {/* 프로필 캡슐 */}
          <div className="user-capsule" onClick={() => setAuthModalOpen(true)}>
            <img
              src={currentUser?.github_avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=guest'}
              alt="아바타"
              className="capsule-avatar"
            />
            <div className="capsule-info">
              <span className="capsule-name">{currentUser?.community_nickname || '로그인'}</span>
              <span className="capsule-role">
                {currentUser?.role === 'teacher' ? '교직원' : currentUser?.role === 'student' ? '재학생' : '게스트'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 모바일 하단 네비게이션 */}
      <nav className="bottom-nav">
        <button className={`bottom-nav-item ${currentTab === 'main' ? 'active' : ''}`} onClick={() => setCurrentTab('main')}>
          <School size={20} />
          <span>메인</span>
        </button>
        <button className={`bottom-nav-item ${currentTab === 'schedule' ? 'active' : ''}`} onClick={() => setCurrentTab('schedule')}>
          <Clock size={20} />
          <span>시간표</span>
        </button>
        <button className={`bottom-nav-item ${currentTab === 'meals' ? 'active' : ''}`} onClick={() => setCurrentTab('meals')}>
          <Utensils size={20} />
          <span>급식</span>
        </button>
        <button className={`bottom-nav-item ${currentTab === 'board' ? 'active' : ''}`} onClick={() => setCurrentTab('board')}>
          <MessageSquare size={20} />
          <span>게시판</span>
        </button>
        {currentUser?.role === 'teacher' && (
          <button className={`bottom-nav-item ${currentTab === 'alerts' ? 'active' : ''}`} onClick={() => setCurrentTab('alerts')}>
            <ShieldAlert size={20} />
            <span>알림</span>
          </button>
        )}
        <button className={`bottom-nav-item ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setCurrentTab('profile')}>
          <User size={20} />
          <span>내정보</span>
        </button>
      </nav>

      {/* 🌟 메인 컨텐츠 */}
      <main className="main-content">
        {/* ========================================================
             TAB 1: 메인 대시보드 (PRD Section 7 반응형 동적 배치)
             💻 Wide View: 좌측(시간표) / 우측 상단(메모장) / 우측 하단(급식표)
             📱 Portrait View: 상단(시간표) / 하단 좌측(메모장) / 하단 우측(급식표)
             ======================================================== */}
        {currentTab === 'main' && (
          <section>
            <div className="sub-tabs-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>대진 스마트 대시보드</h1>
                <span className={`role-badge ${currentUser?.role === 'teacher' ? 'teacher' : 'student'}`}>
                  {currentUser?.role === 'teacher' ? '교직원 모드' : '학생 모드'}
                </span>
                <span className="role-badge github" style={{ fontSize: '0.72rem' }}>
                  NEIS API 실시간 연동
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>2026. 10. 08 (목)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="select-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>학급:</label>
                  <select
                    className="custom-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    {neisClasses.length > 0 ? (
                      neisClasses.map(c => (
                        <option key={`${c.grade}-${c.classNm}`} value={`${c.grade}-${c.classNm}`}>
                          {c.grade}학년 {c.classNm}반 ({c.department})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1-4">1학년 4반 (AI소프트웨어과)</option>
                        <option value="1-1">1학년 1반 (AI소프트웨어과)</option>
                        <option value="2-1">2학년 1반 (소프트웨어과)</option>
                        <option value="3-1">3학년 1반 (전자통신과)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="select-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>날짜:</label>
                  <input
                    type="date"
                    className="custom-select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    title="NEIS 시간표 조회 일자 선택"
                  />
                </div>

                <button
                  className="btn-pill"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  title="NEIS & Supabase 시간표 강제 수동 동기화 (C10 7150597)"
                >
                  <RotateCw size={14} className={isSyncing ? 'spin-icon' : ''} />
                  {isSyncing ? '동기화 중...' : '시간표 수동 동기화'}
                </button>
              </div>
            </div>

            {/* 📐 동적 반응형 대시보드 그리드 */}
            <div className="dynamic-dashboard-grid">
              {/* 좌측/상단: 시간표 */}
              <div className="grid-col-left">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title-group">
                      <div className="card-icon"><GraduationCap size={20} /></div>
                      <div>
                        <h2 className="card-title">오늘의 일일 시간표</h2>
                        <span className="card-subtitle">{selectedClass} ({displayDepartment})</span>
                      </div>
                    </div>
                    <button className="btn-pill" onClick={() => setCurrentTab('schedule')}>
                      전체 주간보기
                    </button>
                  </div>

                  <div className="schedule-container">
                    {liveTimetable.length > 0 ? (
                      liveTimetable.map((p, idx) => (
                        <div key={idx} className={`period-card ${p.period === 4 ? 'current-period' : ''}`}>
                          <span className="period-num">{p.period}교시</span>
                          <div className="period-main">
                            <div className="subject-name">
                              {p.subject}
                              <span className="subject-badge">{p.department || displayDepartment}</span>
                            </div>
                            <div className="period-sub">
                              <span>NEIS 실시간 수업 정보</span>
                            </div>
                          </div>
                          {p.period === 4 && <span className="role-badge student">현재 교시</span>}
                        </div>
                      ))
                    ) : (
                      currentFallback.weekly.thu.map((p, idx) => (
                        <div key={idx} className={`period-card ${p.period === 4 ? 'current-period' : ''}`}>
                          <span className="period-num">{p.period}교시</span>
                          <div className="period-main">
                            <div className="subject-name">
                              {p.subject}
                              <span className="subject-badge">{p.room}</span>
                            </div>
                            <div className="period-sub">담당: {p.teacher}</div>
                          </div>
                          {p.period === 4 && <span className="role-badge student">현재 수업</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* D-Day 배너 */}
                <div className="card" style={{ background: 'var(--bg-tertiary)', padding: '1.15rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎯</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>2학기 1차 지필평가 (중간고사)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2026. 10. 15 ~ 10. 19 전 학년 실시</div>
                      </div>
                    </div>
                    <span className="role-badge student" style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>D-7</span>
                  </div>
                </div>
              </div>

              {/* 우측 상단: 개인 메모장 (Supabase 개인 공간) */}
              <div className="grid-col-right-top">
                <div className="card notes-card">
                  <div className="card-header">
                    <div className="card-title-group">
                      <div className="card-icon"><FileText size={20} /></div>
                      <div>
                        <h2 className="card-title">내 개인 메모장</h2>
                        <span className="card-subtitle">Supabase 개인 DB 자동 동기화</span>
                      </div>
                    </div>
                    <span className="role-badge github">{notesSaved ? '저장됨' : '입력 중...'}</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="시간표 메모, 과제 체크리스트, 공부 계획을 적어보세요..."
                  />
                  <div className="notes-status-row">
                    <span>{notes.length}자 작성됨</span>
                    <button className="btn-pill" onClick={handleManualNotesSave}>
                      <Save size={14} /> 즉시 저장
                    </button>
                  </div>
                </div>
              </div>

              {/* 우측 하단: 안심 급식표 & 알레르기 하이라이트 (NEIS API 실시간 연동) */}
              <div className="grid-col-right-bottom">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title-group">
                      <div className="card-icon"><Utensils size={20} /></div>
                      <div>
                        <h2 className="card-title">오늘의 안심 급식표</h2>
                        <span className="card-subtitle">
                          {todayMeal?.type || '중식'} {todayMeal?.calories ? `(${todayMeal.calories})` : ''}
                        </span>
                      </div>
                    </div>
                    <button className="btn-pill" onClick={() => setCurrentTab('meals')}>
                      주간보기
                    </button>
                  </div>

                  {currentUser?.allergy_filters && currentUser.allergy_filters.length > 0 && (
                    <div style={{ marginBottom: '0.85rem', fontSize: '0.78rem', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={14} />
                      <span>회원님의 알레르기 유발 식품 필터가 적용 중입니다.</span>
                    </div>
                  )}

                  <div className="meal-list">
                    {todayMeal?.menu && todayMeal.menu.map((m, idx) => {
                      const hasAllergy = m.allergies.some(a => currentUser?.allergy_filters?.includes(a));
                      return (
                        <div key={idx} className={`meal-item ${hasAllergy ? 'allergy-alert' : ''}`}>
                          <div className="meal-name-group">
                            <span>{m.name}</span>
                            {hasAllergy && (
                              <span className="allergy-warning-badge">
                                <AlertTriangle size={12} /> 주의
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.allergies.length > 0 ? `(${m.allergies.join('.')})` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
             TAB 2: 시간표 상세 (일일 / 주간 전체 매트릭스)
             ======================================================== */}
        {currentTab === 'schedule' && (
          <section>
            <div className="sub-tabs-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="pill-group">
                  <button
                    className={`pill-btn ${scheduleView === 'daily' ? 'active' : ''}`}
                    onClick={() => setScheduleView('daily')}
                  >
                    일일 시간표
                  </button>
                  <button
                    className={`pill-btn ${scheduleView === 'weekly' ? 'active' : ''}`}
                    onClick={() => setScheduleView('weekly')}
                  >
                    전체 주간 시간표
                  </button>
                </div>

                <select
                  className="custom-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {neisClasses.length > 0 ? (
                    neisClasses.map(c => (
                      <option key={`${c.grade}-${c.classNm}`} value={`${c.grade}-${c.classNm}`}>
                        {c.grade}학년 {c.classNm}반 ({c.department})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1-4">1학년 4반 (AI소프트웨어과)</option>
                      <option value="1-1">1학년 1반 (AI소프트웨어과)</option>
                      <option value="2-1">2학년 1반 (소프트웨어과)</option>
                      <option value="3-1">3학년 1반 (전자통신과)</option>
                    </>
                  )}
                </select>

                <div className="select-group">
                  <input
                    type="date"
                    className="custom-select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    title="시간표 조회 일자"
                  />
                </div>
              </div>

              <button className="btn-pill" onClick={handleManualSync} disabled={isSyncing}>
                <RotateCw size={14} className={isSyncing ? 'spin-icon' : ''} />
                {isSyncing ? '동기화 중...' : '시간표 강제 갱신'}
              </button>
            </div>

            {scheduleView === 'daily' ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{selectedClass} 일일 정규 시간표</h2>
                    <span className="card-subtitle">{displayDepartment} (NEIS Open API 공식 시간표)</span>
                  </div>
                </div>
                <div className="schedule-container">
                  {liveTimetable.length > 0 ? (
                    liveTimetable.map((p, idx) => (
                      <div key={idx} className="period-card">
                        <span className="period-num">{p.period}교시</span>
                        <div className="period-main">
                          <div className="subject-name">
                            {p.subject}
                            <span className="subject-badge">{p.department || displayDepartment}</span>
                          </div>
                          <div className="period-sub">NEIS 부산광역시교육청 공식 시간표</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    currentFallback.weekly.thu.map((p, idx) => (
                      <div key={idx} className="period-card">
                        <span className="period-num">{p.period}교시</span>
                        <div className="period-main">
                          <div className="subject-name">
                            {p.subject}
                            <span className="subject-badge">{p.room}</span>
                          </div>
                          <div className="period-sub">담당: {p.teacher}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{selectedClass} 전체 주간 시간표 매트릭스</h2>
                    <span className="card-subtitle">월요일 ~ 금요일 전체 교시 배정 현황</span>
                  </div>
                </div>
                <div className="weekly-table-wrap">
                  <table className="weekly-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>교시</th>
                        <th>월 (Mon)</th>
                        <th>화 (Tue)</th>
                        <th>수 (Wed)</th>
                        <th>목 (Thu)</th>
                        <th>금 (Fri)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7].map(period => (
                        <tr key={period}>
                          <td style={{ fontWeight: 800 }}>{period}교시</td>
                          {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => {
                            const p = currentFallback.weekly[day]?.find(x => x.period === period);
                            return (
                              <td key={day}>
                                {p ? (
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{p.subject}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.teacher} ({p.room})</div>
                                  </div>
                                ) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
             TAB 3: 학사일정
             ======================================================== */}
        {currentTab === 'academic' && (
          <section>
            <div className="sub-tabs-bar">
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>2026학년도 대진 학사일정 & D-Day</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>NEIS 학사정보 공식 연동</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {ACADEMIC_EVENTS.map(ev => (
                <div key={ev.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="role-badge student">{ev.dDayText}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.date}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ev.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ev.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
             TAB 4: 급식표 상세 (NEIS Open API 실시간 식단표)
             ======================================================== */}
        {currentTab === 'meals' && (
          <section>
            <div className="sub-tabs-bar">
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>대진전자통신고 안심 급식 식단표 (NEIS API)</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  부산광역시교육청 NEIS 급식식단정보 • 19대 식품 알레르기 유발물질 자동 감지
                </span>
              </div>
              <button className="btn-pill" onClick={() => setCurrentTab('profile')}>
                내 알레르기 필터 설정
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {displayMeals.map((meal, idx) => (
                <div key={idx} className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{meal.dayName}</h3>
                      <span className="card-subtitle">{meal.type} {meal.calories ? `• ${meal.calories}` : ''}</span>
                    </div>
                  </div>
                  <div className="meal-list">
                    {meal.menu.map((item, mIdx) => {
                      const hasAlert = item.allergies.some(a => currentUser?.allergy_filters?.includes(a));
                      return (
                        <div key={mIdx} className={`meal-item ${hasAlert ? 'allergy-alert' : ''}`}>
                          <div className="meal-name-group">
                            <span>{item.name}</span>
                            {hasAlert && (
                              <span className="allergy-warning-badge">
                                <AlertTriangle size={12} /> 주의
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.allergies.length > 0 ? `(${item.allergies.join('.')})` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
             TAB 5: 자유게시판 (PRD Section 4: 닉네임, 30분 수정 제한, 신고)
             ======================================================== */}
        {currentTab === 'board' && (
          <section>
            <div className="board-header-bar">
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>대진 자유게시판</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  커뮤니티 닉네임 사용 • 30분 이내 수정 제한 • 건전한 학교 소통 공간
                </span>
              </div>
              <button className="btn-primary" onClick={() => setWriteModalOpen(true)}>
                <Edit3 size={16} /> 글쓰기
              </button>
            </div>

            <div>
              {posts.map(post => {
                const isMyPost = post.authorId === currentUser?.id;
                const isTeacher = currentUser?.role === 'teacher';
                const createdTime = new Date(post.createdAt).getTime();
                const diffMin = (Date.now() - createdTime) / (1000 * 60);
                const canEdit = isMyPost && diffMin <= 30;

                return (
                  <article key={post.id} className="post-card">
                    <div className="post-meta-row">
                      <div className="post-author">
                        <img src={post.authorAvatar} alt="작성자 아바타" className="author-avatar" />
                        <div className="author-info">
                          <span className="author-nick">
                            {post.authorNickname}
                            {post.authorRole === 'teacher' ? (
                              <span className="role-badge teacher">교직원</span>
                            ) : (
                              <span className="role-badge student">학생</span>
                            )}
                          </span>
                          <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {post.isReported && (
                        <span className="role-badge teacher" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={12} /> 신고 접수됨
                        </span>
                      )}
                    </div>

                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-body">{post.content}</p>

                    <div className="post-actions-row">
                      <div className="post-btn-group">
                        {canEdit && (
                          <button className="btn-pill" onClick={() => openEditModal(post)}>
                            <Edit3 size={14} /> 수정 (30분 이내)
                          </button>
                        )}
                        {(isMyPost || isTeacher) && (
                          <button className="btn-pill danger" onClick={() => handleDeletePost(post.id)}>
                            <Trash2 size={14} /> 삭제
                          </button>
                        )}
                        <button className="btn-pill" onClick={() => handleReportPost(post.id)}>
                          <AlertTriangle size={14} /> 신고
                        </button>
                      </div>

                      {post.githubUsername && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <GithubIcon size={14} /> @{post.githubUsername}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================
             TAB 6: [교직원 전용] 신고 게시물 관리 및 수정본 계층 캐비닛 뷰 (PRD Section 4-②)
             ======================================================== */}
        {currentTab === 'alerts' && currentUser?.role === 'teacher' && (
          <section>
            <div className="sub-tabs-bar">
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={22} /> 교직원 전용: 신고 게시물 및 수정 이력 파일 캐비닛
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  계층 구조: [1. 작성자] | [2. 최초 원본] | [3. 하위 수정 이력 폴더 (스냅샷)] | 10초 쿨타임 무결성 보장
                </span>
              </div>
              <button className="btn-pill" onClick={() => setAuditModalOpen(true)}>
                <FileText size={14} /> etc 승인 감사 로그
              </button>
            </div>

            <div className="file-cabinet-wrap">
              {reportedPosts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--accent-emerald)', margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 600 }}>현재 미처리된 신고 게시물이 없습니다.</p>
                </div>
              ) : (
                reportedPosts.map(post => (
                  <div key={post.id} className="cabinet-item">
                    <div className="cabinet-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FolderOpen size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontWeight: 700 }}>작성자: {post.authorNickname} (ID: {post.authorId})</span>
                        <span className="role-badge teacher">사유: {post.reportReason || '신고 접수'}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        신고일시: {post.reportedAt ? new Date(post.reportedAt).toLocaleString() : '-'}
                      </span>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                        게시물 제목: {post.title}
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <strong>[최초 본문 내용]:</strong> {post.content}
                      </div>

                      {/* 하위 수정본 스냅샷 폴더 */}
                      <div className="cabinet-snapshot-tree">
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>
                          📁 하위 수정본 이력 스냅샷 폴더 (10초 쿨타임 강제 무결성 보존)
                        </div>
                        {post.snapshots && post.snapshots.length > 0 ? (
                          post.snapshots.map((snap, sIdx) => (
                            <div key={sIdx} className="snapshot-card">
                              <div className="snapshot-meta">
                                <span>버전 v{sIdx + 1} ({snap.label || '수정본'})</span>
                                <span>{new Date(snap.modifiedAt).toLocaleTimeString()}</span>
                              </div>
                              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{snap.content}</p>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            신고 이후 수정된 이력이 아직 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ========================================================
             TAB 7: 내 정보 (마이페이지 - Section 4 & 7)
             ======================================================== */}
        {currentTab === 'profile' && (
          <section>
            <div className="profile-grid">
              {/* 좌측: 프로필 카드 */}
              <div className="card profile-card-left">
                <img
                  src={currentUser?.github_avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=guest'}
                  alt="프로필 이미지"
                  className="profile-large-avatar"
                />
                <h2 className="profile-name">{currentUser?.community_nickname || '게스트'}</h2>
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <span className={`role-badge ${currentUser?.role === 'teacher' ? 'teacher' : 'student'}`}>
                    {currentUser?.role === 'teacher' ? '교직원' : currentUser?.role === 'student' ? '재학생' : '게스트'}
                  </span>
                  <span className="role-badge github">
                    {currentUser?.auth_provider === 'github' ? 'GitHub 인증' : currentUser?.auth_provider === 'google' ? 'Google 인증' : '게스트'}
                  </span>
                </div>
                <p className="profile-bio">{currentUser?.bio || '대진전자통신고 알리미 서비스 이용자입니다.'}</p>

                {currentUser?.github_username && (
                  <a
                    href={`https://github.com/${currentUser.github_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="github-link-btn"
                  >
                    <GithubIcon size={16} /> GitHub 프로필 방문
                  </a>
                )}

                <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                  <button className="btn-pill danger" style={{ width: '100%', justifyContent: 'center' }} onClick={handleDeleteAccount}>
                    <Trash2 size={14} /> 회원 탈퇴 및 개인정보 파기
                  </button>
                </div>
              </div>

              {/* 우측: 학적 정보 및 알레르기 설정 */}
              <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} /> 학적 정보 및 맞춤 개인화 설정 (Supabase DB)
                </h2>

                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">실명 (이름)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profRealName}
                        onChange={(e) => setProfRealName(e.target.value)}
                        placeholder="홍길동"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">자유게시판 활동 닉네임</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profNickname}
                        onChange={(e) => setProfNickname(e.target.value)}
                        placeholder="커뮤니티 닉네임"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">학년</label>
                      <select
                        className="custom-select"
                        style={{ width: '100%' }}
                        value={profGrade}
                        onChange={(e) => setProfGrade(Number(e.target.value))}
                      >
                        <option value={1}>1학년</option>
                        <option value={2}>2학년</option>
                        <option value={3}>3학년</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">반</label>
                      <select
                        className="custom-select"
                        style={{ width: '100%' }}
                        value={profClass}
                        onChange={(e) => setProfClass(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => (
                          <option key={c} value={c}>{c}반</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">번호</label>
                      <input
                        type="number"
                        className="form-input"
                        value={profNum}
                        onChange={(e) => setProfNum(Number(e.target.value))}
                        min={1}
                        max={40}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">전공 학과</label>
                    <select
                      className="custom-select"
                      style={{ width: '100%' }}
                      value={profDept}
                      onChange={(e) => setProfDept(e.target.value)}
                    >
                      <option value="AI소프트웨어과">AI소프트웨어과</option>
                      <option value="스마트전자과">스마트전자과</option>
                      <option value="전자통신과">전자통신과</option>
                      <option value="전자과">전자과</option>
                    </select>
                  </div>

                  {/* 19대 식품 알레르기 선택기 */}
                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>식약처 19대 급식 알레르기 유발물질 필터</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)' }}>선택 시 급식표에 경고 표시</span>
                    </label>
                    <div className="allergy-selector-grid">
                      {ALLERGY_CODES.map(item => {
                        const checked = profAllergies.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`allergy-checkbox-label ${checked ? 'checked' : ''}`}
                            onClick={() => toggleAllergy(item.id)}
                          >
                            <span>{item.icon}</span>
                            <span>{item.id}. {item.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn-primary">
                      <Save size={16} /> 설정 및 학적 정보 저장
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================
           MODALS
           ======================================================== */}

      {/* 1. 인증 모달 (GitHub & Google) */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">로그인 및 계정 인증</h2>
              <button className="modal-close-btn" onClick={() => setAuthModalOpen(false)}>&times;</button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              대진전자통신고 알리미 서비스는 Supabase 멀티 OAuth를 지원합니다.
            </p>

            {/* GitHub OAuth (PRD v8.0 전면 허용 정책) */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GithubIcon size={18} /> GitHub 소셜 로그인
                </span>
                <span className="role-badge github">임시 전면 개방</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                블랙리스트에 등재되지 않은 계정이라면 학교 도메인 여부와 무관하게 즉시 가입/이용 가능합니다.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="GitHub 아이디 (예: daejin-dev)"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                />
                <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={handleGitHubLogin}>
                  연동 로그인
                </button>
              </div>
            </div>

            {/* Google OAuth (학교 공식 도메인) */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Google 학교 계정 로그인</span>
                <span className="role-badge student">도메인 권한 분리</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                학생(@pdj.hs.kr), 교직원(@pdj.ht.kr / @korea.kr) 도메인만 자동 부여됩니다.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="학교 이메일 입력"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                />
                <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={handleGoogleLogin}>
                  Google 로그인
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button className="btn-pill" onClick={() => setAuthModalOpen(false)}>
                게스트로 계속 둘러보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 글쓰기 모달 */}
      {writeModalOpen && (
        <div className="modal-overlay" onClick={() => setWriteModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">새 게시물 작성</h2>
              <button className="modal-close-btn" onClick={() => setWriteModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitPost}>
              <div className="form-group">
                <label className="form-label">제목</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="제목을 입력하세요"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">내용</label>
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="자유롭게 이야기를 나누어 보세요..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn-pill" onClick={() => setWriteModalOpen(false)}>취소</button>
                <button type="submit" className="btn-primary">등록하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. 글수정 모달 (30분 이내 / 10초 쿨타임 무결성) */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">게시물 수정</h2>
              <button className="modal-close-btn" onClick={() => setEditModalOpen(false)}>&times;</button>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} />
              <span>작성 후 30분 이내에만 수정 가능합니다. (신고 게시물은 10초 쿨타임 강제)</span>
            </div>
            <form onSubmit={handleSaveEditPost}>
              <div className="form-group">
                <label className="form-label">수정 내용</label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn-pill" onClick={() => setEditModalOpen(false)}>취소</button>
                <button type="submit" className="btn-primary">수정 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 감사 로그 모달 (교직원 전용) */}
      {auditModalOpen && (
        <div className="modal-overlay" onClick={() => setAuditModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">교직원 etc 계정 승인 감사 로그</h2>
              <button className="modal-close-btn" onClick={() => setAuditModalOpen(false)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              외부 계정 승인 시 승인 교사 및 일시가 DB 감사 로그에 영구 보존됩니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong>승인 교사: {log.actorName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div>대상 이메일: <code>{log.targetEmail}</code></div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>사유: {log.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🍞 토스트 알림 컨테이너 */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />}
            {t.type === 'error' && <XCircle size={16} style={{ color: 'var(--accent-pink)' }} />}
            {t.type === 'info' && <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
