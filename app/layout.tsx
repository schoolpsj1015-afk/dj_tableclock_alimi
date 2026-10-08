import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '대진전자통신고등학교 통합 스마트 알리미 v8.0',
  description: '대진전자통신고등학교 학생 및 교직원을 위한 통합 학사, 실시간 시간표, 안심 급식 알레르기 필터링, Supabase GitHub 멀티 OAuth 기반 스마트 알리미 웹 서비스',
  keywords: ['대진전자통신고', '대진전통고', '시간표', '급식표', '학사일정', 'Supabase', 'GitHub OAuth', '스마트 알리미'],
  authors: [{ name: '대진전자통신고등학교' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body data-theme="dark" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
