import { NextRequest, NextResponse } from 'next/server';
import { fetchNeisSchoolSchedule } from '@/lib/neis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fromYmd = searchParams.get('fromYmd') || undefined;
    const toYmd = searchParams.get('toYmd') || undefined;
    const ay = searchParams.get('ay') || undefined;
    const baseDate = searchParams.get('baseDate') || undefined;

    const schedule = await fetchNeisSchoolSchedule(fromYmd, toYmd, ay, baseDate);
    return NextResponse.json({
      success: true,
      data: schedule
    });
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_PRERENDER_INTERRUPTED')) {
      throw error;
    }
    console.error('SchoolSchedule API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
