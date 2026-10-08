/**
 * 대진전자통신고등학교 NEIS Open API 연동 모듈
 * - 학교코드: 7150597 (대진전자통신고등학교)
 * - 관할교육청코드: C10 (부산광역시교육청)
 */

export const NEIS_CONFIG = {
  ATPT_OFCDC_SC_CODE: 'C10',
  SD_SCHUL_CODE: '7150597',
  SCHUL_NM: '대진전자통신고등학교',
  API_BASE: 'https://open.neis.go.kr/hub'
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

/**
 * 1. 학급 정보 API (classInfo) 조회
 */
export async function fetchNeisClasses(): Promise<NeisClassItem[]> {
  try {
    const url = `${NEIS_CONFIG.API_BASE}/classInfo?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&AY=2026&Type=json&pSize=100`;
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
 * 2. 고등학교 시간표 API (hisTimetable) 조회
 */
export async function fetchNeisTimetable(
  grade: number | string,
  classNm: number | string,
  ymd: string
): Promise<NeisPeriodItem[]> {
  try {
    const url = `${NEIS_CONFIG.API_BASE}/hisTimetable?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&GRADE=${grade}&CLRM_NM=${classNm}&ALL_TI_YMD=${ymd}&Type=json`;
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
 * 3. 급식식단정보 API (mealServiceDietInfo) 조회 및 알레르기 번호 자동 파싱
 */
export async function fetchNeisMeals(
  fromYmd: string,
  toYmd: string
): Promise<NeisMealItem[]> {
  try {
    const url = `${NEIS_CONFIG.API_BASE}/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=${NEIS_CONFIG.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${NEIS_CONFIG.SD_SCHUL_CODE}&MLSV_FROM_YMD=${fromYmd}&MLSV_TO_YMD=${toYmd}&Type=json`;
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
