/**
 * 대진전자통신고등학교 NEIS Open API 연동 모듈
 * - 학교코드: 7150597 (대진전자통신고등학교)
 * - 관할교육청코드: C10 (부산광역시교육청)
 */

export const NEIS_CONFIG = {
  ATPT_OFCDC_SC_CODE: 'C10',
  SD_SCHUL_CODE: '7150597',
  SCHUL_NM: '대진전자통신고등학교',
  API_BASE: 'https://open.neis.go.kr/hub',
  KEY: process.env.NEIS_API_KEY || 'f76c6373802d472c992bcf6baa914441'
};

export interface NeisClassItem {
  grade: number;
  classNm: string;
  department: string;
}

export interface NeisPeriodItem {
  period: number;
  subject: string;
  department: string;
  date: string;
}

export interface NeisMenuItem {
  name: string;
  allergies: number[];
}

export interface NeisMealItem {
  date: string;
  dayName: string;
  type: string;
  calories: string;
  menu: NeisMenuItem[];
  originInfo?: string;
}

export interface NeisWeeklySchedule {
  dates: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
  };
  days: {
    mon: NeisPeriodItem[];
    tue: NeisPeriodItem[];
    wed: NeisPeriodItem[];
    thu: NeisPeriodItem[];
    fri: NeisPeriodItem[];
  };
}

/**
 * 기준 날짜로부터 해당 주의 월~금 날짜 계산 유틸
 */
export function getWeekDates(baseDateStr: string = '2026-10-14') {
  let y = 2026, m = 10, d = 14;
  const clean = (baseDateStr || '2026-10-14').replace(/-/g, '');
  if (clean.length === 8) {
    y = parseInt(clean.substring(0, 4), 10);
    m = parseInt(clean.substring(4, 6), 10) - 1;
    d = parseInt(clean.substring(6, 8), 10);
  }
  const dateObj = new Date(y, m, d);
  const dayOfWeek = dateObj.getDay(); // 0(일) ~ 6(토)
  
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() + diffToMonday);

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
  const result: Record<typeof dayKeys[number], { ymd: string; formatted: string }> = {
    mon: { ymd: '', formatted: '' },
    tue: { ymd: '', formatted: '' },
    wed: { ymd: '', formatted: '' },
    thu: { ymd: '', formatted: '' },
    fri: { ymd: '', formatted: '' }
  };

  dayKeys.forEach((key, index) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + index);
    const yr = cur.getFullYear();
    const mo = String(cur.getMonth() + 1).padStart(2, '0');
    const da = String(cur.getDate()).padStart(2, '0');
    result[key] = {
      ymd: `${yr}${mo}${da}`,
      formatted: `${yr}-${mo}-${da}`
    };
  });

  return result;
}

/**
 * 1. 학급 정보 API (classInfo) 조회
 */
export async function fetchNeisClasses(): Promise<NeisClassItem[]> {
  try {
    const keyParam = NEIS_CONFIG.KEY ? `&KEY=${NEIS_CONFIG.KEY}` : '';
    const url = `${NEIS_CONFIG.API_BASE}/classInfo?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&AY=2026&Type=json&pSize=100${keyParam}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`NEIS classInfo HTTP Error: ${res.status}`);

    const data = await res.json();
    const rows = data?.classInfo?.[1]?.row || [];

    const classes: NeisClassItem[] = rows.map((r: any) => ({
      grade: parseInt(r.GRADE, 10),
      classNm: r.CLASS_NM,
      department: r.DDDEP_NM || '전공학과'
    }));

    // 학년, 반 순 정렬
    return classes.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return parseInt(a.classNm, 10) - parseInt(b.classNm, 10);
    });
  } catch (err) {
    console.warn('[NEIS] classInfo fetch failed, using fallback:', err);
    return [
      { grade: 1, classNm: '4', department: 'AI소프트웨어과' },
      { grade: 1, classNm: '5', department: 'AI소프트웨어과' },
      { grade: 1, classNm: '6', department: '스마트전자과' },
      { grade: 1, classNm: '9', department: '전자통신과' },
      { grade: 1, classNm: '10', department: '전자통신과' }
    ];
  }
}

/**
 * 2. 고등학교 시간표 API (hisTimetable) 단일 일자 조회 (1~7교시)
 */
export async function fetchNeisTimetable(
  grade: number | string,
  classNm: number | string,
  ymd: string
): Promise<NeisPeriodItem[]> {
  try {
    const keyParam = NEIS_CONFIG.KEY ? `&KEY=${NEIS_CONFIG.KEY}` : '';
    const url = `${NEIS_CONFIG.API_BASE}/hisTimetable?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&GRADE=${grade}&CLRM_NM=${classNm}&ALL_TI_YMD=${ymd}&Type=json&pSize=20${keyParam}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`NEIS hisTimetable HTTP Error: ${res.status}`);

    const data = await res.json();
    const rows = data?.hisTimetable?.[1]?.row || [];

    return rows.map((r: any) => ({
      period: parseInt(r.PERIO, 10),
      subject: (r.ITRT_CNTNT || '자율수업').replace(/^\*\s*/, '').trim(),
      department: r.DDDEP_NM || '',
      date: r.ALL_TI_YMD
    })).sort((a: any, b: any) => a.period - b.period);
  } catch (err) {
    console.warn('[NEIS] hisTimetable fetch failed:', err);
    return [];
  }
}

/**
 * 2-1. 고등학교 주간 전체 시간표 매트릭스 조회 (월~금 1~7교시 전체 동기화)
 */
export async function fetchNeisWeeklyTimetable(
  grade: number | string,
  classNm: number | string,
  baseDateStr: string = '2026-10-14'
): Promise<NeisWeeklySchedule> {
  const weekDates = getWeekDates(baseDateStr);
  const monYmd = weekDates.mon.ymd;
  const friYmd = weekDates.fri.ymd;

  const datesFormatted = {
    mon: weekDates.mon.formatted,
    tue: weekDates.tue.formatted,
    wed: weekDates.wed.formatted,
    thu: weekDates.thu.formatted,
    fri: weekDates.fri.formatted
  };

  const daysResult: {
    mon: NeisPeriodItem[];
    tue: NeisPeriodItem[];
    wed: NeisPeriodItem[];
    thu: NeisPeriodItem[];
    fri: NeisPeriodItem[];
  } = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: []
  };

  try {
    const keyParam = NEIS_CONFIG.KEY ? `&KEY=${NEIS_CONFIG.KEY}` : '';
    // 주간 일괄 범위 조회
    const bulkUrl = `${NEIS_CONFIG.API_BASE}/hisTimetable?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&GRADE=${grade}&CLRM_NM=${classNm}&TI_FROM_YMD=${monYmd}&TI_TO_YMD=${friYmd}&Type=json&pSize=100${keyParam}`;
    const bulkRes = await fetch(bulkUrl, { next: { revalidate: 300 } });
    
    let rows: any[] = [];
    if (bulkRes.ok) {
      const data = await bulkRes.json();
      rows = data?.hisTimetable?.[1]?.row || [];
    }

    // 일자별 수집 확인 및 부족한 경우 병렬 개별 호출로 완벽 보완
    const foundDates = new Set(rows.map(r => r.ALL_TI_YMD));
    const targetYmds = [weekDates.mon.ymd, weekDates.tue.ymd, weekDates.wed.ymd, weekDates.thu.ymd, weekDates.fri.ymd];
    const missingYmds = targetYmds.filter(ymd => !foundDates.has(ymd));
    
    if (missingYmds.length > 0) {
      const perDayResults = await Promise.all(
        missingYmds.map(async (ymd) => {
          try {
            const dayUrl = `${NEIS_CONFIG.API_BASE}/hisTimetable?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&GRADE=${grade}&CLRM_NM=${classNm}&ALL_TI_YMD=${ymd}&Type=json&pSize=20${keyParam}`;
            const res = await fetch(dayUrl, { next: { revalidate: 300 } });
            if (!res.ok) return [];
            const d = await res.json();
            return d?.hisTimetable?.[1]?.row || [];
          } catch {
            return [];
          }
        })
      );
      rows = rows.concat(perDayResults.flat());
    }

    // 수집된 rows를 요일별로 분류
    rows.forEach((r: any) => {
      const ymd = r.ALL_TI_YMD;
      let dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | null = null;
      if (ymd === weekDates.mon.ymd) dayKey = 'mon';
      else if (ymd === weekDates.tue.ymd) dayKey = 'tue';
      else if (ymd === weekDates.wed.ymd) dayKey = 'wed';
      else if (ymd === weekDates.thu.ymd) dayKey = 'thu';
      else if (ymd === weekDates.fri.ymd) dayKey = 'fri';

      if (dayKey) {
        daysResult[dayKey].push({
          period: parseInt(r.PERIO, 10),
          subject: (r.ITRT_CNTNT || '자율수업').replace(/^\*\s*/, '').trim(),
          department: r.DDDEP_NM || '',
          date: r.ALL_TI_YMD
        });
      }
    });

    // 각 요일별로 교시(period) 오름차순 정렬 및 중복 제거
    (['mon', 'tue', 'wed', 'thu', 'fri'] as const).forEach(day => {
      const map = new Map<number, NeisPeriodItem>();
      daysResult[day].forEach(item => {
        if (!map.has(item.period)) {
          map.set(item.period, item);
        }
      });
      daysResult[day] = Array.from(map.values()).sort((a, b) => a.period - b.period);
    });

    return {
      dates: datesFormatted,
      days: daysResult
    };
  } catch (err) {
    console.warn('[NEIS] fetchNeisWeeklyTimetable failed:', err);
    return {
      dates: datesFormatted,
      days: daysResult
    };
  }
}

/**
 * 3. 급식식단정보 API (mealServiceDietInfo) 조회 및 알레르기 번호 자동 파싱
 */
export async function fetchNeisMeals(
  fromYmd: string,
  toYmd: string
): Promise<NeisMealItem[]> {
  try {
    const keyParam = NEIS_CONFIG.KEY ? `&KEY=${NEIS_CONFIG.KEY}` : '';
    const url = `${NEIS_CONFIG.API_BASE}/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&MLSV_FROM_YMD=${fromYmd}&MLSV_TO_YMD=${toYmd}&Type=json&pSize=50${keyParam}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`NEIS mealServiceDietInfo HTTP Error: ${res.status}`);

    const data = await res.json();
    const rows = data?.mealServiceDietInfo?.[1]?.row || [];

    return rows.map((r: any) => {
      const rawDish = r.DDISH_NM || '';
      // <br/> 기준으로 메뉴 라인 분리
      const lines = rawDish.split(/<br\s*\/?>/i);

      const parsedMenu: NeisMenuItem[] = lines
        .map((line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // 알레르기 번호 추출 (메뉴 뒤에 붙은 "1.5.6.9.10.18." 또는 "(1.2.5)" 형태)
          const matchAllergies = trimmed.match(/(\d+(?:\.\d+)*)\.?$/);
          let allergies: number[] = [];
          let cleanName = trimmed;

          if (matchAllergies) {
            const numStr = matchAllergies[1];
            allergies = numStr.split('.').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
            cleanName = trimmed.replace(matchAllergies[0], '').trim();
          }

          // 괄호 등의 부가정보 정리
          cleanName = cleanName.replace(/\(\d+[\.\d+]*\)/g, '').trim();

          return {
            name: cleanName,
            allergies
          };
        })
        .filter((item: any): item is NeisMenuItem => item !== null && item.name.length > 0);

      const ymdStr = r.MLSV_YMD || '';
      const year = ymdStr.substring(0, 4);
      const month = ymdStr.substring(4, 6);
      const day = ymdStr.substring(6, 8);
      const dateObj = new Date(`${year}-${month}-${day}`);
      const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayName = `${month}.${day} (${days[dateObj.getDay()] || ''})`;

      return {
        date: `${year}-${month}-${day}`,
        dayName,
        type: r.MMEAL_SC_NM || '중식',
        calories: r.CAL_INFO || '',
        menu: parsedMenu,
        originInfo: r.ORPLC_INFO || ''
      };
    });
  } catch (err) {
    console.warn('[NEIS] mealServiceDietInfo fetch failed:', err);
    return [];
  }
}
