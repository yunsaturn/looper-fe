import {
  CATEGORY,
  ITEM_CONDITION,
  TRADE_TYPE,
} from '@/shared/config/categories';
import {
  APPLICATION_STATUS,
  OFFER_STATUS,
  RENTAL_STATUS,
  TRADE_STATUS,
} from '@/shared/config/status';
import type {
  SeededTradeApplication,
  TradeDetail,
  TradeListItem,
} from '@/entities/trade/types';
import type { RentalDetail, SeededRentalOffer } from '@/entities/rental/types';
import type { MyProfile, UserSummary } from '@/entities/user/types';
import type { CampusImpact, MyImpact } from '@/entities/impact/types';
import type { PickupZone } from '@/entities/trade/types';

/**
 * 시연용 시드 데이터. 전부 가상이며 실제 개인정보는 없다.
 *
 * 기획서 R2(콜드 스타트) 대응: 9개 상태를 골고루 배분해 첫 화면부터
 * 채워진 상태로 보이게 한다.
 *
 * 시연 대본상 두 계정으로 양쪽 관점을 보여줘야 하므로 고정 ID 를 쓴다.
 *   DEMO_ME       내가 로그인한 계정 (작성자 겸 신청자)
 *   DEMO_PARTNER  상대방 계정
 */

export const DEMO_ME_ID = 'user-me';
export const DEMO_PARTNER_ID = 'user-partner';
export const DEMO_CAMPUS_ID = 'campus-main';

const iso = (offsetMinutes: number) =>
  new Date(Date.now() + offsetMinutes * 60_000).toISOString();

const day = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

/* ─────────────────── 사용자 ─────────────────── */

const NICKNAMES = [
  '기숙사생',
  '컴공24',
  '경영22',
  '자연대생',
  '사범대24',
  '예술대23',
  '공대3학년',
  '교환학생',
  '복학생김',
  '신입생이',
  '생활과학부',
  '디자인23',
  '전자공학25',
  '통계학과',
  '체육교육',
  '문헌정보',
  '화학공학',
  '건축학부',
];

export const users: UserSummary[] = [
  { id: DEMO_ME_ID, nickname: '캠퍼스루퍼', trust_score: 92 },
  { id: DEMO_PARTNER_ID, nickname: '기숙사생', trust_score: 88 },
  ...NICKNAMES.map((nickname, i) => ({
    id: `user-${i + 1}`,
    nickname,
    trust_score: 70 + ((i * 7) % 30),
  })),
];

const userAt = (i: number) => users[i % users.length];

/* ─────────────────── 픽업존 ─────────────────── */

export const pickupZones: PickupZone[] = [
  { id: 'zone-1', name: '학생회관 앞' },
  { id: 'zone-2', name: '중앙도서관 입구' },
  { id: 'zone-3', name: '공학관 로비' },
  { id: 'zone-4', name: '기숙사 A동 로비' },
  { id: 'zone-5', name: '정문 게시판 앞' },
];

const zoneAt = (i: number) => pickupZones[i % pickupZones.length];

/* ─────────────────── 거래 게시물 ─────────────────── */

interface TradeSeed {
  title: string;
  category: keyof typeof CATEGORY;
  type: keyof typeof TRADE_TYPE;
  price: number;
  weight: number;
  status: keyof typeof TRADE_STATUS;
  /** 거래 예정일 오프셋(일). 양수면 미래 날짜 예약 */
  dayOffset: number;
}

const TRADE_SEEDS: TradeSeed[] = [
  // 거래 가능
  {
    title: '1인용 미니 밥솥',
    category: 'HOME_LIVING',
    type: 'SALE',
    price: 12000,
    weight: 2.4,
    status: 'AVAILABLE',
    dayOffset: 4,
  },
  {
    title: '맥북 프로 충전기 65W',
    category: 'ELECTRONICS',
    type: 'SALE',
    price: 8000,
    weight: 0.3,
    status: 'AVAILABLE',
    dayOffset: 2,
  },
  {
    title: 'IKEA 수납 박스 3개',
    category: 'HOME_LIVING',
    type: 'SHARE',
    price: 0,
    weight: 1.8,
    status: 'AVAILABLE',
    dayOffset: 1,
  },
  {
    title: '컴퓨터구조 교재 2024',
    category: 'BOOKS_PAPER',
    type: 'WANTED',
    price: 8000,
    weight: 1.2,
    status: 'AVAILABLE',
    dayOffset: 6,
  },
  {
    title: '자전거 헬멧 (S사이즈)',
    category: 'HOME_LIVING',
    type: 'SALE',
    price: 15000,
    weight: 0.4,
    status: 'AVAILABLE',
    dayOffset: 3,
  },
  {
    title: '접이식 드라이기',
    category: 'ELECTRONICS',
    type: 'SHARE',
    price: 0,
    weight: 0.6,
    status: 'AVAILABLE',
    dayOffset: 5,
  },
  {
    title: '전공 원서 (운영체제)',
    category: 'BOOKS_PAPER',
    type: 'SALE',
    price: 20000,
    weight: 1.5,
    status: 'AVAILABLE',
    dayOffset: 8,
  },
  {
    title: '책상 정리대',
    category: 'HOME_LIVING',
    type: 'SHARE',
    price: 0,
    weight: 1.1,
    status: 'AVAILABLE',
    dayOffset: 2,
  },
  {
    title: '무선 마우스',
    category: 'ELECTRONICS',
    type: 'SALE',
    price: 9000,
    weight: 0.1,
    status: 'AVAILABLE',
    dayOffset: 1,
  },
  {
    title: '토익 문제집 세트',
    category: 'BOOKS_PAPER',
    type: 'SHARE',
    price: 0,
    weight: 2.2,
    status: 'AVAILABLE',
    dayOffset: 7,
  },

  // 예약 중 — 미래 날짜 (라벨이 '미래 날짜 예약 중' 으로 바뀐다)
  {
    title: '미니 냉장고 (퇴실 정리)',
    category: 'HOME_LIVING',
    type: 'SALE',
    price: 45000,
    weight: 18,
    status: 'RESERVED',
    dayOffset: 14,
  },
  {
    title: '행거 + 옷걸이 20개',
    category: 'HOME_LIVING',
    type: 'SHARE',
    price: 0,
    weight: 3.5,
    status: 'RESERVED',
    dayOffset: 10,
  },
  {
    title: '모니터 받침대',
    category: 'HOME_LIVING',
    type: 'SALE',
    price: 7000,
    weight: 1.4,
    status: 'RESERVED',
    dayOffset: 21,
  },

  // 예약 중 — 오늘
  {
    title: '전기포트 1L',
    category: 'ELECTRONICS',
    type: 'SALE',
    price: 11000,
    weight: 0.9,
    status: 'RESERVED',
    dayOffset: 0,
  },
  {
    title: '스탠드 조명',
    category: 'HOME_LIVING',
    type: 'SALE',
    price: 13000,
    weight: 1.2,
    status: 'RESERVED',
    dayOffset: 0,
  },

  // 완료 확인 대기
  {
    title: '캐논 DSLR EOS 850D',
    category: 'ELECTRONICS',
    type: 'SALE',
    price: 35000,
    weight: 0.8,
    status: 'COMPLETION_PENDING',
    dayOffset: 0,
  },
  {
    title: '자료구조 교재',
    category: 'BOOKS_PAPER',
    type: 'SALE',
    price: 14000,
    weight: 1.3,
    status: 'COMPLETION_PENDING',
    dayOffset: -1,
  },

  // 거래 완료
  {
    title: '에코백 나눔해요',
    category: 'HOME_LIVING',
    type: 'SHARE',
    price: 0,
    weight: 0.2,
    status: 'COMPLETED',
    dayOffset: -3,
  },
  {
    title: '블루투스 키보드',
    category: 'ELECTRONICS',
    type: 'SALE',
    price: 18000,
    weight: 0.5,
    status: 'COMPLETED',
    dayOffset: -5,
  },
  {
    title: '선형대수학 교재',
    category: 'BOOKS_PAPER',
    type: 'SALE',
    price: 12000,
    weight: 1.4,
    status: 'COMPLETED',
    dayOffset: -7,
  },
  {
    title: '접이식 우산',
    category: 'HOME_LIVING',
    type: 'SHARE',
    price: 0,
    weight: 0.3,
    status: 'COMPLETED',
    dayOffset: -2,
  },
  {
    title: '탁상용 선풍기',
    category: 'ELECTRONICS',
    type: 'SALE',
    price: 9000,
    weight: 0.7,
    status: 'COMPLETED',
    dayOffset: -9,
  },
];

export const trades: TradeDetail[] = TRADE_SEEDS.map((seed, i) => {
  // 앞쪽 몇 건은 내 게시물로 둬서 '신청자 목록' 화면을 시연할 수 있게 한다.
  const author = i % 5 === 0 ? users[0] : userAt(i + 1);

  return {
    id: `trade-${i + 1}`,
    trade_type: TRADE_TYPE[seed.type],
    title: seed.title,
    description: `${seed.title} 입니다. 캠퍼스 픽업존에서 직접 전달드려요. 상태는 사진으로 확인해주세요.`,
    category: CATEGORY[seed.category],
    condition:
      i % 4 === 0
        ? ITEM_CONDITION.LIKE_NEW
        : i % 4 === 1
          ? ITEM_CONDITION.GOOD
          : i % 4 === 2
            ? ITEM_CONDITION.NEW
            : ITEM_CONDITION.FAIR,
    price: seed.price,
    weight_kg: seed.weight,
    available_date: day(seed.dayOffset),
    pickup_zone: zoneAt(i),
    image_urls: [],
    status: TRADE_STATUS[seed.status],
    author,
    my_application_status: null,
    can_apply:
      TRADE_STATUS[seed.status] === TRADE_STATUS.AVAILABLE &&
      author.id !== DEMO_ME_ID,
    created_at: iso(-(i + 1) * 37),
  };
});

/** 신청 대기 상태를 만들기 위한 신청 건들 */
export const applications: SeededTradeApplication[] = [
  // 내 게시물(trade-1)에 들어온 신청 3건 — 신청자 목록·수락 시연용
  {
    id: 'app-1',
    trade_id: 'trade-1',
    applicant: users[1],
    message: '8월 21일 오후에 픽업 가능합니다.',
    status: APPLICATION_STATUS.PENDING,
    created_at: iso(-120),
  },
  {
    id: 'app-2',
    trade_id: 'trade-1',
    applicant: users[3],
    message: '기숙사 A동 살아서 바로 갈 수 있어요!',
    status: APPLICATION_STATUS.PENDING,
    created_at: iso(-90),
  },
  {
    id: 'app-3',
    trade_id: 'trade-1',
    applicant: users[4],
    message: '오늘 저녁도 괜찮습니다.',
    status: APPLICATION_STATUS.PENDING,
    created_at: iso(-45),
  },
  // 예약 중 게시물의 수락된 신청
  {
    id: 'app-4',
    trade_id: 'trade-11',
    applicant: users[0],
    message: '퇴실일에 맞춰 가져갈게요.',
    status: APPLICATION_STATUS.ACCEPTED,
    created_at: iso(-3000),
  },
  {
    id: 'app-5',
    trade_id: 'trade-11',
    applicant: users[5],
    message: '저도 필요해요',
    status: APPLICATION_STATUS.CLOSED,
    created_at: iso(-2900),
  },
];

/* ─────────────────── 대여 요청 ─────────────────── */

interface RentalSeed {
  name: string;
  category: keyof typeof CATEGORY;
  price: number;
  status: keyof typeof RENTAL_STATUS;
  /** 시작 시각 오프셋(분) */
  startOffset: number;
  durationMinutes: number;
  overdue?: boolean;
}

const RENTAL_SEEDS: RentalSeed[] = [
  // 모집 중 — 시작 임박순으로 보이도록 오프셋을 흩어둔다
  {
    name: 'C타입 충전기',
    category: 'ELECTRONICS',
    price: 0,
    status: 'RECRUITING',
    startOffset: 60,
    durationMinutes: 60,
  },
  {
    name: '공학용 계산기',
    category: 'ELECTRONICS',
    price: 1000,
    status: 'RECRUITING',
    startOffset: 180,
    durationMinutes: 120,
  },
  {
    name: '우산',
    category: 'HOME_LIVING',
    price: 0,
    status: 'RECRUITING',
    startOffset: 240,
    durationMinutes: 180,
  },
  {
    name: '돗자리 (2인용)',
    category: 'HOME_LIVING',
    price: 500,
    status: 'RECRUITING',
    startOffset: 1440,
    durationMinutes: 300,
  },
  {
    name: '빔프로젝터 (FHD)',
    category: 'ELECTRONICS',
    price: 3000,
    status: 'RECRUITING',
    startOffset: 2880,
    durationMinutes: 240,
  },
  {
    name: 'DSLR 카메라 렌즈 50mm',
    category: 'ELECTRONICS',
    price: 2000,
    status: 'RECRUITING',
    startOffset: 4320,
    durationMinutes: 480,
  },
  {
    name: '캠핑 텐트 (3~4인용)',
    category: 'HOME_LIVING',
    price: 5000,
    status: 'RECRUITING',
    startOffset: 5760,
    durationMinutes: 1440,
  },
  {
    name: '전공 원서 (하루만)',
    category: 'BOOKS_PAPER',
    price: 0,
    status: 'RECRUITING',
    startOffset: 720,
    durationMinutes: 600,
  },

  // 대여 확정
  {
    name: '노트북 거치대',
    category: 'ELECTRONICS',
    price: 1000,
    status: 'CONFIRMED',
    startOffset: 120,
    durationMinutes: 180,
  },
  {
    name: '여행용 캐리어',
    category: 'HOME_LIVING',
    price: 4000,
    status: 'CONFIRMED',
    startOffset: 1800,
    durationMinutes: 2880,
  },
  {
    name: '삼각대',
    category: 'ELECTRONICS',
    price: 1500,
    status: 'CONFIRMED',
    startOffset: 300,
    durationMinutes: 120,
  },

  // 대여 중
  {
    name: '보조배터리 20000mAh',
    category: 'ELECTRONICS',
    price: 0,
    status: 'IN_USE',
    startOffset: -60,
    durationMinutes: 240,
  },
  {
    name: '스터디룸 화이트보드 마커',
    category: 'HOME_LIVING',
    price: 0,
    status: 'IN_USE',
    startOffset: -30,
    durationMinutes: 180,
  },

  // 반납 지연 (status 는 IN_USE 인데 is_overdue = true)
  {
    name: '공학용 계산기 (시험용)',
    category: 'ELECTRONICS',
    price: 1000,
    status: 'IN_USE',
    startOffset: -300,
    durationMinutes: 120,
    overdue: true,
  },
  {
    name: '실험복',
    category: 'HOME_LIVING',
    price: 0,
    status: 'IN_USE',
    startOffset: -600,
    durationMinutes: 240,
    overdue: true,
  },

  // 반납 확인 대기
  {
    name: '멀티탭 3구',
    category: 'ELECTRONICS',
    price: 0,
    status: 'RETURN_PENDING',
    startOffset: -240,
    durationMinutes: 180,
  },

  // 반납 완료
  {
    name: '접이식 의자',
    category: 'HOME_LIVING',
    price: 1000,
    status: 'COMPLETED',
    startOffset: -2880,
    durationMinutes: 300,
  },
  {
    name: '헤드셋',
    category: 'ELECTRONICS',
    price: 2000,
    status: 'COMPLETED',
    startOffset: -4320,
    durationMinutes: 180,
  },
  {
    name: '스캐너',
    category: 'ELECTRONICS',
    price: 1000,
    status: 'COMPLETED',
    startOffset: -5760,
    durationMinutes: 120,
  },
  {
    name: '전자사전',
    category: 'BOOKS_PAPER',
    price: 500,
    status: 'COMPLETED',
    startOffset: -7200,
    durationMinutes: 240,
  },

  // 취소
  {
    name: '보드게임 세트',
    category: 'HOME_LIVING',
    price: 0,
    status: 'CANCELLED',
    startOffset: -1440,
    durationMinutes: 300,
  },
];

export const rentals: RentalDetail[] = RENTAL_SEEDS.map((seed, i) => {
  const requester = i % 6 === 0 ? users[0] : userAt(i + 2);
  const dueAt = iso(seed.startOffset + seed.durationMinutes);

  return {
    id: `rental-${i + 1}`,
    item_name: seed.name,
    category: CATEGORY[seed.category],
    description: `${seed.name} 잠깐만 빌릴 수 있을까요? 사용 후 바로 반납하겠습니다.`,
    pickup_zone: zoneAt(i + 1),
    start_at: iso(seed.startOffset),
    due_at: dueAt,
    offered_price: seed.price,
    status: RENTAL_STATUS[seed.status],
    is_overdue: Boolean(seed.overdue),
    overdue_at: seed.overdue ? dueAt : null,
    requester,
    my_offer_status: null,
    can_offer:
      RENTAL_STATUS[seed.status] === RENTAL_STATUS.RECRUITING &&
      requester.id !== DEMO_ME_ID,
  };
});

export const offers: SeededRentalOffer[] = [
  // 내 요청(rental-1)에 들어온 지원 3건 — 지원자 선택 시연용
  {
    id: 'offer-1',
    rental_id: 'rental-1',
    offerer: users[2],
    message: '지금 중앙도서관에 있어서 바로 드릴 수 있어요.',
    status: OFFER_STATUS.PENDING,
    created_at: iso(-25),
  },
  {
    id: 'offer-2',
    rental_id: 'rental-1',
    offerer: users[6],
    message: '30분 뒤에 가능합니다!',
    status: OFFER_STATUS.PENDING,
    created_at: iso(-15),
  },
  {
    id: 'offer-3',
    rental_id: 'rental-1',
    offerer: users[8],
    message: 'C타입 여분 있습니다.',
    status: OFFER_STATUS.PENDING,
    created_at: iso(-5),
  },
  // 확정된 대여의 선택된 지원
  {
    id: 'offer-4',
    rental_id: 'rental-9',
    offerer: users[1],
    message: '제가 빌려드릴게요.',
    status: OFFER_STATUS.SELECTED,
    created_at: iso(-200),
  },
  {
    id: 'offer-5',
    rental_id: 'rental-9',
    offerer: users[7],
    message: '저도 가능해요',
    status: OFFER_STATUS.CLOSED,
    created_at: iso(-190),
  },
];

/* ─────────────────── 내 프로필 ─────────────────── */

/** PATCH 목업이 이 객체를 직접 고쳐서 수정이 화면에 반영되게 한다 */
export const myProfile: MyProfile = {
  id: DEMO_ME_ID,
  email: 'demo@xx.ac.kr',
  nickname: '캠퍼스루퍼',
  school: { id: 'school-1', name: 'XX대학교' },
  campus: { id: DEMO_CAMPUS_ID, name: '본교 캠퍼스' },
  department: '컴퓨터공학과',
  main_building: '공학관',
  trust_score: 92,
  trade_completed_count: 12,
  rental_completed_count: 7,
};

/* ─────────────────── 임팩트 ─────────────────── */

export const DISCLAIMER = '탄소 수치는 대체율 0.65를 가정한 예상 절감량입니다.';

export const myImpact: MyImpact = {
  saved_amount: 47000,
  waste_reduced_kg: 8.3,
  estimated_carbon_saved_kg_co2e: 42.6,
  trade_completed_count: 12,
  sharing_count: 4,
  rental_completed_count: 7,
  monthly_trend: [
    { month: '2026-06', estimated_carbon_saved_kg_co2e: 6.1 },
    { month: '2026-07', estimated_carbon_saved_kg_co2e: 12.4 },
    { month: '2026-08', estimated_carbon_saved_kg_co2e: 24.1 },
  ],
  disclaimer: DISCLAIMER,
};

export const campusImpact: CampusImpact = {
  campus: { id: DEMO_CAMPUS_ID, name: 'XX대학교 본교 캠퍼스' },
  estimated_carbon_saved_kg_co2e: 2480,
  participant_count: 428,
  completed_activity_count: 680,
  category_breakdown: [
    { category: CATEGORY.HOME_LIVING, ratio: 0.52 },
    { category: CATEGORY.ELECTRONICS, ratio: 0.31 },
    { category: CATEGORY.BOOKS_PAPER, ratio: 0.17 },
  ],
  campus_rank: 1,
  disclaimer: DISCLAIMER,
};

/** 목록 응답용 요약 변환 */
export function toTradeListItem(t: TradeDetail): TradeListItem {
  return {
    id: t.id,
    trade_type: t.trade_type,
    title: t.title,
    thumbnail_url: null,
    category: t.category,
    price: t.price,
    available_date: t.available_date,
    pickup_zone_name: t.pickup_zone.name,
    status: t.status,
    author: t.author,
    created_at: t.created_at,
  };
}
