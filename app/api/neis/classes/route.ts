import { NextResponse } from 'next/server';
import { fetchNeisClasses } from '@/lib/neis';

export async function GET() {
  try {
    const classes = await fetchNeisClasses();
    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
