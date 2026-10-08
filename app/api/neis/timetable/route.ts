import { NextRequest, NextResponse } from 'next/server';
import { fetchNeisTimetable, fetchNeisWeeklyTimetable } from '@/lib/neis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const grade = searchParams.get('grade') || '1';
    const classNm = searchParams.get('classNm') || '4';
    
    // 기본 날짜: 오늘 또는 요청된 ymd (YYYYMMDD 또는 YYYY-MM-DD)
    const today = new Date();
    const defaultYmd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rawYmd = searchParams.get('ymd') || defaultYmd;
    const ymd = rawYmd.replace(/-/g, '');

    // 일일 시간표와 주간 전체 매트릭스를 병렬로 동시 조회하여 완전 동기화 보장
    const [dailyData, weeklySchedule] = await Promise.all([
      fetchNeisTimetable(grade, classNm, ymd),
      fetchNeisWeeklyTimetable(grade, classNm, ymd)
    ]);

    return NextResponse.json({
      success: true,
      grade,
      classNm,
      ymd,
      data: dailyData,
      weekly: weeklySchedule.days,
      dates: weeklySchedule.dates
    });
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_PRERENDER_INTERRUPTED')) {
      throw error;
    }
    console.error('Timetable API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
