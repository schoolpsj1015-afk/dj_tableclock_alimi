import { NextRequest, NextResponse } from 'next/server';
import { fetchNeisMeals } from '@/lib/neis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date();
    
    // 이번 주 월요일 ~ 금요일 범위 계산
    const currentDay = today.getDay(); // 0(일) ~ 6(토)
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const formatDate = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    const fromYmd = searchParams.get('fromYmd') || formatDate(monday);
    const toYmd = searchParams.get('toYmd') || formatDate(friday);

    const meals = await fetchNeisMeals(fromYmd, toYmd);
    return NextResponse.json({
      success: true,
      fromYmd,
      toYmd,
      data: meals
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
