import { NextRequest, NextResponse } from 'next/server';
import { fetchNeisTimetable } from '@/lib/neis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade') || '1';
    const classNm = searchParams.get('classNm') || '1';
    
    // 기본 날짜: 오늘 또는 요청된 ymd (YYYYMMDD)
    const today = new Date();
    const defaultYmd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const ymd = searchParams.get('ymd') || defaultYmd;

    const timetable = await fetchNeisTimetable(grade, classNm, ymd);
    return NextResponse.json({
      success: true,
      grade,
      classNm,
      ymd,
      data: timetable
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
