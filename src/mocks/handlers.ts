import { http, HttpResponse, delay } from 'msw';

import { CATEGORY } from '@/shared/config/categories';
import {
  APPLICATION_STATUS,
  OFFER_STATUS,
  RENTAL_STATUS,
  TRADE_STATUS,
} from '@/shared/config/status';
import {
  applications,
  campusImpact,
  DEMO_CAMPUS_ID,
  DEMO_ME_ID,
  myImpact,
  offers,
  pickupZones,
  rentals,
  toTradeListItem,
  trades,
  users,
} from './seed';

/**
 * MSW 핸들러.
 *
 * 상태 전이는 서버가 단일 출처라는 원칙(R5)을 목업에서도 지킨다.
 * 화면은 mutation 후 invalidateQueries 로 다시 조회하고, 여기서 바뀐
 * 상태를 그대로 받는다. 그래야 실제 BE 로 갈아끼웠을 때 동작이 같다.
 */

const BASE = '*/api/v1';

/** 목업 지연 — 로딩 상태와 스켈레톤을 실제로 확인할 수 있게 한다 */
const LATENCY_MS = 180;

function page<T>(items: T[], url: URL) {
  const pageNum = Number(url.searchParams.get('page') ?? 0);
  const size = Number(url.searchParams.get('size') ?? 20);
  const start = pageNum * size;
  const slice = items.slice(start, start + size);

  return {
    content: slice,
    page: pageNum,
    size,
    total_elements: items.length,
    has_next: start + size < items.length,
  };
}

function notFound() {
  return HttpResponse.json(
    {
      code: 'RESOURCE_NOT_FOUND',
      message: '대상을 찾을 수 없습니다.',
      field_errors: [],
      current_status: null,
      allowed_statuses: null,
      requested_action: null,
    },
    { status: 404 },
  );
}

function invalidState(
  currentStatus: string,
  allowed: string[],
  action: string,
) {
  return HttpResponse.json(
    {
      code: 'INVALID_STATE',
      message: '현재 상태에서는 요청한 작업을 수행할 수 없습니다.',
      field_errors: [],
      current_status: currentStatus,
      allowed_statuses: allowed,
      requested_action: action,
    },
    { status: 409 },
  );
}

export const handlers = [
  /* ─────────────────── 인증 ─────────────────── */

  http.post(`${BASE}/auth/login`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      access_token_expires_in: 3600,
      user: {
        id: DEMO_ME_ID,
        nickname: users[0].nickname,
        campus_id: DEMO_CAMPUS_ID,
        trust_score: users[0].trust_score,
      },
    });
  }),

  http.get(`${BASE}/users/me`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      id: DEMO_ME_ID,
      nickname: users[0].nickname,
      email: 'demo@xx.ac.kr',
      school_id: 'school-1',
      school_name: 'XX대학교',
      campus_id: DEMO_CAMPUS_ID,
      campus_name: '본교 캠퍼스',
      department: '컴퓨터공학과',
      main_building: '공학관',
      trust_score: users[0].trust_score,
    });
  }),

  /* ─────────────────── 메타 ─────────────────── */

  http.get(`${BASE}/campuses/:campusId/pickup-zones`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ content: pickupZones });
  }),

  http.get(`${BASE}/meta/schools`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      content: [
        {
          id: 'school-1',
          name: 'XX대학교',
          email_domain: 'xx.ac.kr',
          campuses: [
            { id: DEMO_CAMPUS_ID, name: '본교 캠퍼스' },
            { id: 'campus-2', name: '제2캠퍼스' },
          ],
        },
      ],
    });
  }),

  /* ─────────────────── 거래 ─────────────────── */

  http.get(`${BASE}/trades`, async ({ request }) => {
    await delay(LATENCY_MS);
    const url = new URL(request.url);

    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const tradeType = url.searchParams.get('trade_type');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    const filtered = trades
      .filter((t) => !tradeType || t.trade_type === tradeType)
      .filter((t) => !category || t.category === category)
      .filter((t) => !status || t.status === status)
      .filter(
        (t) =>
          !keyword ||
          t.title.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword),
      )
      .map(toTradeListItem);

    return HttpResponse.json(page(filtered, url));
  }),

  http.get(`${BASE}/trades/:tradeId`, async ({ params }) => {
    await delay(LATENCY_MS);
    const trade = trades.find((t) => t.id === params.tradeId);
    if (!trade) return notFound();

    const mine = applications.find(
      (a) =>
        a.trade_id === trade.id &&
        a.applicant.id === DEMO_ME_ID &&
        a.status !== APPLICATION_STATUS.CANCELLED,
    );

    return HttpResponse.json({
      ...trade,
      my_application_status: mine?.status ?? null,
      can_apply:
        trade.status === TRADE_STATUS.AVAILABLE &&
        trade.author.id !== DEMO_ME_ID &&
        !mine,
    });
  }),

  http.post(`${BASE}/trades`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as Record<string, unknown>;
    const zone =
      pickupZones.find((z) => z.id === body.pickup_zone_id) ?? pickupZones[0];

    const created = {
      ...trades[0],
      id: `trade-${trades.length + 1}`,
      ...body,
      // 나눔은 서버가 가격을 0 으로 고정한다
      price: body.trade_type === 'SHARE' ? 0 : (body.price as number),
      pickup_zone: zone,
      carbon_sector: body.category,
      status: TRADE_STATUS.AVAILABLE,
      author: users[0],
      my_application_status: null,
      can_apply: false,
      created_at: new Date().toISOString(),
    } as (typeof trades)[number];

    trades.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post(`${BASE}/trades/:tradeId/applications`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const trade = trades.find((t) => t.id === params.tradeId);
    if (!trade) return notFound();

    if (trade.status !== TRADE_STATUS.AVAILABLE) {
      return invalidState(trade.status, [TRADE_STATUS.AVAILABLE], 'APPLY_TRADE');
    }

    const { message } = (await request.json()) as { message: string };
    const application = {
      id: `app-${applications.length + 1}`,
      trade_id: trade.id,
      applicant: users[0],
      message,
      status: APPLICATION_STATUS.PENDING,
      created_at: new Date().toISOString(),
    };
    applications.push(application);

    return HttpResponse.json(application, { status: 201 });
  }),

  http.get(`${BASE}/trades/:tradeId/applications`, async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      content: applications.filter((a) => a.trade_id === params.tradeId),
    });
  }),

  http.post(
    `${BASE}/trades/:tradeId/applications/:applicationId/accept`,
    async ({ params }) => {
      await delay(LATENCY_MS);
      const trade = trades.find((t) => t.id === params.tradeId);
      if (!trade) return notFound();

      if (trade.status !== TRADE_STATUS.AVAILABLE) {
        return invalidState(
          trade.status,
          [TRADE_STATUS.AVAILABLE],
          'ACCEPT_APPLICATION',
        );
      }

      // 한 건만 수락하고 나머지는 자동 마감 — 서버가 강제하는 규칙
      applications
        .filter((a) => a.trade_id === trade.id)
        .forEach((a) => {
          a.status =
            a.id === params.applicationId
              ? APPLICATION_STATUS.ACCEPTED
              : APPLICATION_STATUS.CLOSED;
        });

      trade.status = TRADE_STATUS.RESERVED;
      return HttpResponse.json({ status: trade.status });
    },
  ),

  http.post(`${BASE}/trades/:tradeId/reservation/cancel`, async ({ params }) => {
    await delay(LATENCY_MS);
    const trade = trades.find((t) => t.id === params.tradeId);
    if (!trade) return notFound();

    if (trade.status !== TRADE_STATUS.RESERVED) {
      return invalidState(
        trade.status,
        [TRADE_STATUS.RESERVED],
        'CANCEL_RESERVATION',
      );
    }

    // 예약이 취소되면 게시물은 다시 거래 가능으로 돌아간다
    trade.status = TRADE_STATUS.AVAILABLE;
    applications
      .filter((a) => a.trade_id === trade.id)
      .forEach((a) => {
        a.status = APPLICATION_STATUS.CANCELLED;
      });

    return HttpResponse.json({ status: trade.status });
  }),

  http.post(`${BASE}/trades/:tradeId/completion/request`, async ({ params }) => {
    await delay(LATENCY_MS);
    const trade = trades.find((t) => t.id === params.tradeId);
    if (!trade) return notFound();

    if (trade.status !== TRADE_STATUS.RESERVED) {
      return invalidState(
        trade.status,
        [TRADE_STATUS.RESERVED],
        'REQUEST_COMPLETION',
      );
    }

    trade.status = TRADE_STATUS.COMPLETION_PENDING;
    return HttpResponse.json({ status: trade.status });
  }),

  http.post(`${BASE}/trades/:tradeId/completion/confirm`, async ({ params }) => {
    await delay(LATENCY_MS);
    const trade = trades.find((t) => t.id === params.tradeId);
    if (!trade) return notFound();

    if (trade.status !== TRADE_STATUS.COMPLETION_PENDING) {
      return invalidState(
        trade.status,
        [TRADE_STATUS.COMPLETION_PENDING],
        'CONFIRM_COMPLETION',
      );
    }

    // 양측 확인이 끝나야 완료. 완료 시점에 절감량이 1회만 반영된다.
    trade.status = TRADE_STATUS.COMPLETED;
    myImpact.trade_completed_count += 1;
    myImpact.estimated_carbon_saved_kg_co2e = Number(
      (myImpact.estimated_carbon_saved_kg_co2e + (trade.weight_kg ?? 1) * 1.93).toFixed(1),
    );

    return HttpResponse.json({ status: trade.status });
  }),

  /* ─────────────────── 대여 ─────────────────── */

  http.get(`${BASE}/rentals`, async ({ request }) => {
    await delay(LATENCY_MS);
    const url = new URL(request.url);

    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    const filtered = rentals
      .filter((r) => !category || r.category === category)
      .filter((r) => !status || r.status === status)
      .filter((r) => !keyword || r.item_name.toLowerCase().includes(keyword))
      // 기본 정렬은 시작 시간 오름차순 — 임박한 요청을 먼저 보여준다
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .map((r) => ({
        id: r.id,
        item_name: r.item_name,
        category: r.category,
        start_at: r.start_at,
        due_at: r.due_at,
        pickup_zone_name: r.pickup_zone.name,
        offered_price: r.offered_price,
        status: r.status,
        is_overdue: r.is_overdue,
        requester: r.requester,
        offer_count: offers.filter((o) => o.rental_id === r.id).length,
      }));

    return HttpResponse.json(page(filtered, url));
  }),

  http.get(`${BASE}/rentals/:rentalId`, async ({ params }) => {
    await delay(LATENCY_MS);
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    const mine = offers.find(
      (o) =>
        o.rental_id === rental.id &&
        o.offerer.id === DEMO_ME_ID &&
        o.status !== OFFER_STATUS.CANCELLED,
    );

    return HttpResponse.json({
      ...rental,
      my_offer_status: mine?.status ?? null,
      can_offer:
        rental.status === RENTAL_STATUS.RECRUITING &&
        rental.requester.id !== DEMO_ME_ID &&
        !mine,
    });
  }),

  http.post(`${BASE}/rentals`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as Record<string, unknown>;
    const zone =
      pickupZones.find((z) => z.id === body.pickup_zone_id) ?? pickupZones[0];

    const startAt = body.start_at as string;
    // 반납 예정 시간은 서버가 시작 시간 + 사용 시간으로 자동 계산한다
    const dueAt = new Date(
      new Date(startAt).getTime() + (body.duration_minutes as number) * 60_000,
    ).toISOString();

    const created = {
      id: `rental-${rentals.length + 1}`,
      item_name: body.item_name as string,
      category: body.category,
      description: body.description as string,
      pickup_zone: zone,
      start_at: startAt,
      due_at: dueAt,
      offered_price: (body.offered_price as number) ?? 0,
      status: RENTAL_STATUS.RECRUITING,
      is_overdue: false,
      overdue_at: null,
      requester: users[0],
      my_offer_status: null,
      can_offer: false,
    } as (typeof rentals)[number];

    rentals.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post(`${BASE}/rentals/:rentalId/offers`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    if (rental.status !== RENTAL_STATUS.RECRUITING) {
      return invalidState(
        rental.status,
        [RENTAL_STATUS.RECRUITING],
        'CREATE_OFFER',
      );
    }

    const { message } = (await request.json()) as { message: string };
    const offer = {
      id: `offer-${offers.length + 1}`,
      rental_id: rental.id,
      offerer: users[0],
      message,
      status: OFFER_STATUS.PENDING,
      created_at: new Date().toISOString(),
    };
    offers.push(offer);

    return HttpResponse.json(offer, { status: 201 });
  }),

  http.get(`${BASE}/rentals/:rentalId/offers`, async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      content: offers.filter((o) => o.rental_id === params.rentalId),
    });
  }),

  http.post(
    `${BASE}/rentals/:rentalId/offers/:offerId/select`,
    async ({ params }) => {
      await delay(LATENCY_MS);
      const rental = rentals.find((r) => r.id === params.rentalId);
      if (!rental) return notFound();

      if (rental.status !== RENTAL_STATUS.RECRUITING) {
        return invalidState(
          rental.status,
          [RENTAL_STATUS.RECRUITING],
          'SELECT_OFFER',
        );
      }

      offers
        .filter((o) => o.rental_id === rental.id)
        .forEach((o) => {
          o.status =
            o.id === params.offerId ? OFFER_STATUS.SELECTED : OFFER_STATUS.CLOSED;
        });

      rental.status = RENTAL_STATUS.CONFIRMED;
      return HttpResponse.json({ status: rental.status });
    },
  ),

  http.post(`${BASE}/rentals/:rentalId/pickup/confirm`, async ({ params }) => {
    await delay(LATENCY_MS);
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    if (rental.status !== RENTAL_STATUS.CONFIRMED) {
      return invalidState(
        rental.status,
        [RENTAL_STATUS.CONFIRMED],
        'CONFIRM_PICKUP',
      );
    }

    rental.status = RENTAL_STATUS.IN_USE;
    return HttpResponse.json({ status: rental.status });
  }),

  http.post(`${BASE}/rentals/:rentalId/return/request`, async ({ params }) => {
    await delay(LATENCY_MS);
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    if (rental.status !== RENTAL_STATUS.IN_USE) {
      return invalidState(rental.status, [RENTAL_STATUS.IN_USE], 'REQUEST_RETURN');
    }

    rental.status = RENTAL_STATUS.RETURN_PENDING;
    return HttpResponse.json({ status: rental.status });
  }),

  http.post(`${BASE}/rentals/:rentalId/return/confirm`, async ({ params }) => {
    await delay(LATENCY_MS);
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    if (rental.status !== RENTAL_STATUS.RETURN_PENDING) {
      return invalidState(
        rental.status,
        [RENTAL_STATUS.RETURN_PENDING],
        'CONFIRM_RETURN',
      );
    }

    rental.status = RENTAL_STATUS.COMPLETED;
    rental.is_overdue = false;
    myImpact.rental_completed_count += 1;

    return HttpResponse.json({ status: rental.status });
  }),

  /* ─────────────────── AI 등록 보조 ─────────────────── */

  /**
   * 이미지 기반 상품 추천.
   *
   * 실제 서버와 마찬가지로 **실패해도 200** 을 준다. 화면이 ai_status 와
   * fallback_required 로 분기하는지 확인할 수 있도록, 파일 이름에
   * 'fail' 이 들어가면 장애 폴백, 'low' 가 들어가면 저신뢰 응답을 준다.
   * (시연 중 폴백 화면을 보여줘야 할 때 쓸 수 있다)
   */
  http.post(`${BASE}/ai/listing-assist`, async ({ request }) => {
    const form = await request.formData();
    const image = form.get('image');
    const fileName = image instanceof File ? image.name.toLowerCase() : '';

    // 모델 추론 + LLM 호출을 흉내내 로딩 상태가 실제로 보이게 한다
    await delay(1400);

    if (fileName.includes('fail')) {
      return HttpResponse.json({
        analysis_id: null,
        ai_status: 'UNAVAILABLE',
        candidates: [],
        image_tags: [],
        description_draft: null,
        carbon_sector: null,
        fallback_required: true,
        message: 'AI 분석을 사용할 수 없어 직접 입력이 필요합니다.',
      });
    }

    if (fileName.includes('low')) {
      return HttpResponse.json({
        analysis_id: null,
        ai_status: 'LOW_CONFIDENCE',
        candidates: [
          { item_name: '알 수 없는 물품', category: CATEGORY.HOME_LIVING, confidence: 0.31 },
        ],
        image_tags: ['object'],
        description_draft: null,
        carbon_sector: null,
        fallback_required: true,
        message: '사진이 흐릿해 추천 정확도가 낮아요. 직접 확인해주세요.',
      });
    }

    return HttpResponse.json({
      analysis_id: 'analysis-mock-1',
      ai_status: 'SUCCESS',
      candidates: [
        { item_name: 'C타입 충전기', category: CATEGORY.ELECTRONICS, confidence: 0.92 },
        { item_name: 'USB-C 어댑터', category: CATEGORY.ELECTRONICS, confidence: 0.74 },
        { item_name: '멀티 케이블', category: CATEGORY.ELECTRONICS, confidence: 0.51 },
      ],
      image_tags: ['charger', 'cable', 'electronics'],
      description_draft:
        '사용감이 있는 C타입 충전기입니다. 정상 작동하며, 상세 상태와 호환 기기는 직접 확인해주세요.',
      carbon_sector: CATEGORY.ELECTRONICS,
      fallback_required: false,
      message: null,
    });
  }),

  /* ─────────────────── 이미지 업로드 ─────────────────── */

  http.post(`${BASE}/images/presigned-uploads`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(
      {
        object_key: 'mock/object-key',
        // 목업에서는 실제 스토리지가 없으므로 아래 PUT 핸들러가 받아준다
        upload_url: 'https://mock-storage.local/upload',
        public_url: 'https://mock-storage.local/mock-image.jpg',
        expires_in_seconds: 900,
        required_headers: { 'Content-Type': 'image/jpeg' },
      },
      { status: 201 },
    );
  }),

  http.put('https://mock-storage.local/upload', async () => {
    await delay(LATENCY_MS);
    return new HttpResponse(null, { status: 200 });
  }),

  /* ─────────────────── 임팩트 ─────────────────── */

  http.get(`${BASE}/impact/me`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(myImpact);
  }),

  http.get(`${BASE}/impact/campuses/:campusId`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(campusImpact);
  }),

  http.get(`${BASE}/carbon/references`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      formula: 'weight_kg × avoidance_factor_kg_co2e_per_kg',
      substitution_rate: 0.65,
      sectors: [
        { sector: 'HOME_LIVING', avoidance_factor_kg_co2e_per_kg: 1.93, production_stage_ratio: 0.687, sample_count: 312 },
        { sector: 'ELECTRONICS', avoidance_factor_kg_co2e_per_kg: 17.94, production_stage_ratio: 0.607, sample_count: 274 },
        { sector: 'BOOKS_PAPER', avoidance_factor_kg_co2e_per_kg: 0.5, production_stage_ratio: 0.946, sample_count: 88 },
      ],
      sources: [
        { name: 'The Carbon Catalogue', published_year: 2022, product_count: 866 },
        { name: 'WRAP reuse displacement research', published_year: 2025, substitution_rate: 0.646 },
      ],
      reference_date: '2026-08-11',
      notice: '모든 탄소 수치는 실측값이 아닌 예상 절감량입니다.',
    });
  }),
];
