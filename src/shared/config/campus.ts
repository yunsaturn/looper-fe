/**
 * 캠퍼스 · 교내 픽업존
 *
 * 기획서의 신뢰 설계 중 하나: "교내 지정 픽업존에서만 물건을 주고받아
 * 이동 거리와 약속 장소 협의 부담을 제거한다."
 * 따라서 거래 등록 시 자유 입력이 아니라 이 목록에서 고르게 한다.
 *
 * ⚠️ 아래는 시연용 예시 데이터다. 실제로는 서버에서 캠퍼스별
 *    픽업존 목록을 내려받아 쓴다. (GET /campuses, /campuses/:id/pickup-zones)
 *    서버 연동 후에는 이 상수를 폴백으로만 남긴다.
 */

export interface PickupZone {
  code: string;
  label: string;
}

export interface Campus {
  code: string;
  /** 학교명 */
  school: string;
  /** 캠퍼스명 */
  name: string;
  /** 가입 가능한 학교 이메일 도메인 */
  emailDomain: string;
  pickupZones: PickupZone[];
}

export const CAMPUSES: Campus[] = [
  {
    code: 'DEMO_MAIN',
    school: 'XX대학교',
    name: '본교 캠퍼스',
    emailDomain: 'xx.ac.kr',
    pickupZones: [
      { code: 'STUDENT_HALL', label: '학생회관 앞' },
      { code: 'CENTRAL_LIBRARY', label: '중앙도서관 입구' },
      { code: 'ENGINEERING_LOBBY', label: '공학관 로비' },
      { code: 'DORM_A', label: '기숙사 A동 로비' },
      { code: 'MAIN_GATE', label: '정문 게시판 앞' },
    ],
  },
  {
    code: 'DEMO_SECOND',
    school: 'XX대학교',
    name: '제2캠퍼스',
    emailDomain: 'xx.ac.kr',
    pickupZones: [
      { code: 'SCIENCE_HALL', label: '자연과학관 1층' },
      { code: 'UNION_CAFE', label: '학생식당 앞' },
      { code: 'DORM_B', label: '기숙사 B동 로비' },
    ],
  },
];

const CAMPUS_BY_CODE = new Map(CAMPUSES.map((c) => [c.code, c]));

export function findCampus(code: string): Campus | undefined {
  return CAMPUS_BY_CODE.get(code);
}

export function pickupZonesOf(campusCode: string): PickupZone[] {
  return CAMPUS_BY_CODE.get(campusCode)?.pickupZones ?? [];
}

export function pickupZoneLabel(
  campusCode: string,
  zoneCode: string,
): string {
  return (
    pickupZonesOf(campusCode).find((z) => z.code === zoneCode)?.label ?? '미지정'
  );
}

/** 가입 가능한 학교 이메일 도메인인지 검사. 최종 판정은 서버가 한다. */
export function isSupportedSchoolEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return CAMPUSES.some((c) => domain === c.emailDomain);
}
