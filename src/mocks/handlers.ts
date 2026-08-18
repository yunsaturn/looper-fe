import { http, HttpResponse, delay } from 'msw';

import type { UpdateProfileRequest } from '@/entities/user/types';
import type {
  AcceptApplicationRequest,
  UpdateTradeRequest,
} from '@/entities/trade/types';
import type { UpdateRentalRequest } from '@/entities/rental/types';

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
  myProfile,
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

/** 검증 실패 — 서버는 field 를 camelCase 로 준다 (Spring BindingResult) */
function validationError(fieldErrors: { field: string; message: string }[]) {
  return HttpResponse.json(
    {
      code: 'INVALID_REQUEST',
      message: '잘못된 요청입니다.',
      field_errors: fieldErrors,
      current_status: null,
      allowed_statuses: null,
      requested_action: null,
    },
    { status: 400 },
  );
}

/** 권한 없음 — 작성자·요청자가 아닌 사람이 수정·삭제를 시도한 경우 */
function forbidden() {
  return HttpResponse.json(
    {
      code: 'FORBIDDEN',
      message: '요청을 수행할 권한이 없습니다.',
      field_errors: [],
      current_status: null,
      allowed_statuses: null,
      requested_action: null,
    },
    { status: 403 },
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

  // 토큰 갱신 — 실서버는 Refresh Token 을 회전시킨다
  http.post(`${BASE}/auth/token/refresh`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      access_token_expires_in: 3600,
    });
  }),

  // 비밀번호 재설정 — 가입과 같은 인증번호 흐름을 쓴다
  http.post(`${BASE}/auth/password/reset-code`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(
      {
        verification_id: 'mock-reset-verification',
        expires_in_seconds: 300,
        message: '인증번호를 발송했습니다. (목업: 000000)',
      },
      { status: 202 },
    );
  }),

  http.post(`${BASE}/auth/password/reset`, async () => {
    await delay(LATENCY_MS);
    return new HttpResponse(null, { status: 204 });
  }),

  // 로그아웃 — 멱등이라 어떤 토큰이 와도 204 다
  http.post(`${BASE}/auth/logout`, async () => {
    await delay(LATENCY_MS);
    return new HttpResponse(null, { status: 204 });
  }),

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

  /* 회원가입 3단계 — 목업에서는 인증번호 000000 으로 통과시킨다 */

  http.post(`${BASE}/auth/email-verifications`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      verification_id: 'mock-verification-id',
      expires_in_seconds: 300,
      message: '인증번호를 발송했습니다. (목업: 000000)',
    });
  }),

  http.post(`${BASE}/auth/email-verifications/confirm`, async ({ request }) => {
    await delay(LATENCY_MS);
    const { code } = (await request.json()) as { code: string };
    if (code !== '000000') {
      return HttpResponse.json(
        {
          code: 'INVALID_VERIFICATION_CODE',
          message: '인증번호가 올바르지 않습니다. (목업: 000000)',
          field_errors: [],
          current_status: null,
          allowed_statuses: null,
          requested_action: null,
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      verification_token: 'mock-verification-token',
      verified: true,
      expires_in_seconds: 900,
    });
  }),

  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as { nickname: string };
    return HttpResponse.json(
      {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        access_token_expires_in: 3600,
        user: {
          id: DEMO_ME_ID,
          nickname: body.nickname,
          campus_id: DEMO_CAMPUS_ID,
          trust_score: 80,
        },
      },
      { status: 201 },
    );
  }),

  // 서버가 학교·캠퍼스를 중첩 객체로 준다. 평평한 필드가 아니다.
  http.get(`${BASE}/users/me`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(myProfile);
  }),

  http.patch(`${BASE}/users/me`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as Partial<UpdateProfileRequest>;
    // 보낸 필드만 반영한다 (PATCH 의미론)
    if (body.nickname !== undefined) myProfile.nickname = body.nickname;
    if (body.department !== undefined) myProfile.department = body.department;
    if (body.main_building !== undefined) {
      myProfile.main_building = body.main_building;
    }
    if (body.bio !== undefined) myProfile.bio = body.bio;
    if (body.profile_image_url !== undefined) {
      myProfile.profile_image_url = body.profile_image_url || null;
    }
    if (body.student_year !== undefined) {
      myProfile.student_year = body.student_year;
    }
    return HttpResponse.json({
      id: myProfile.id,
      nickname: myProfile.nickname,
      department: myProfile.department,
      main_building: myProfile.main_building,
      profile_image_url: myProfile.profile_image_url,
      bio: myProfile.bio,
      student_year: myProfile.student_year,
      updated_at: new Date().toISOString(),
    });
  }),

  // 회원 탈퇴 — 비밀번호 재확인 + 'DELETE' 문구
  http.delete(`${BASE}/users/me`, async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as {
      password?: string;
      confirmation?: string;
    };
    if (body.confirmation !== 'DELETE') {
      return validationError([
        { field: 'confirmation', message: 'DELETE 를 정확히 입력해주세요.' },
      ]);
    }
    if (!body.password) {
      return validationError([
        { field: 'password', message: '비밀번호를 입력해주세요.' },
      ]);
    }
    return HttpResponse.json({
      user_id: DEMO_ME_ID,
      withdrawn: true,
      withdrawn_at: new Date().toISOString(),
    });
  }),

  // 내 거래·대여 통합 활동
  http.get(`${BASE}/users/me/activities`, async ({ request }) => {
    await delay(LATENCY_MS);
    const url = new URL(request.url);
    const resourceType = url.searchParams.get('resource_type') ?? 'ALL';
    const role = url.searchParams.get('role') ?? 'ALL';

    const tradeItems = trades
      .filter((t) => t.author.id === DEMO_ME_ID)
      .map((t) => ({
        id: t.id,
        resource_type: 'TRADE',
        activity_type: t.trade_type,
        title: t.title,
        thumbnail_url: t.image_urls[0],
        role: 'OWNER',
        status: t.status,
        overdue: false,
        created_at: t.created_at,
      }));

    const appliedItems = applications
      .filter((a) => a.applicant.id === DEMO_ME_ID)
      .flatMap((a) => {
        const trade = trades.find((t) => t.id === a.trade_id);
        return trade
          ? [
              {
                id: trade.id,
                resource_type: 'TRADE',
                activity_type: trade.trade_type,
                title: trade.title,
                thumbnail_url: trade.image_urls[0],
                role: 'APPLICANT',
                status: trade.status,
                counterparty: trade.author,
                overdue: false,
                created_at: a.created_at,
              },
            ]
          : [];
      });

    const rentalItems = rentals
      .filter((r) => r.requester.id === DEMO_ME_ID)
      .map((r) => ({
        id: r.id,
        resource_type: 'RENTAL',
        activity_type: 'RENTAL',
        title: r.item_name,
        role: 'REQUESTER',
        status: r.status,
        due_at: r.due_at,
        overdue: r.is_overdue,
        created_at: r.start_at,
      }));

    let content = [...tradeItems, ...appliedItems, ...rentalItems];
    if (resourceType !== 'ALL') {
      content = content.filter((i) => i.resource_type === resourceType);
    }
    if (role !== 'ALL') content = content.filter((i) => i.role === role);
    content.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return HttpResponse.json({
      content,
      page: 0,
      size: content.length,
      total_elements: content.length,
      has_next: false,
    });
  }),

  // 공개 프로필에는 이메일·학과가 없다 (기획서 R6)
  http.get(`${BASE}/users/:userId`, async ({ params }) => {
    await delay(LATENCY_MS);
    const user = users.find((u) => u.id === params.userId);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'RESOURCE_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.',
          field_errors: [],
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      id: user.id,
      nickname: user.nickname,
      school_name: myProfile.school.name,
      campus_name: myProfile.campus.name,
      department: '기계공학과',
      student_year: 2,
      profile_image_url: null,
      bio: '기숙사 살아서 픽업존 이동이 빨라요. 소형 가전 위주로 거래합니다.',
      email_verified: true,
      joined_at: myProfile.joined_at,
      trust_score: user.trust_score,
      trade_completed_count: 12,
      sharing_completed_count: 3,
      rental_completed_count: 7,
      last_completed_at: myProfile.last_completed_at,
    });
  }),

  /* ─────────────────── 메타 ─────────────────── */

  http.get(`${BASE}/campuses/:campusId/pickup-zones`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ pickup_zones: pickupZones });
  }),

  http.get(`${BASE}/meta/schools`, async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      schools: [
        {
          id: 'school-1',
          name: 'XX대학교',
          email_domain: 'xx.ac.kr',
          email_domains: ['xx.ac.kr'],
          email_verification_enabled: true,
          campuses: [
            {
              id: DEMO_CAMPUS_ID,
              name: '본교 캠퍼스',
              region_name: '서울특별시',
              address: null,
            },
            {
              id: 'campus-2',
              name: '제2캠퍼스',
              region_name: '경기도',
              address: null,
            },
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

    // 약속·상대방·임팩트는 예약/완료 이후에만 채워진다
    const accepted = applications.find(
      (a) =>
        a.trade_id === trade.id && a.status === APPLICATION_STATUS.ACCEPTED,
    );
    const reserved =
      trade.status === TRADE_STATUS.RESERVED ||
      trade.status === TRADE_STATUS.COMPLETION_PENDING ||
      trade.status === TRADE_STATUS.COMPLETED;

    return HttpResponse.json({
      ...trade,
      ...(reserved &&
        accepted && {
          counterparty: accepted.applicant,
          meeting: {
            meeting_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
            pickup_zone: trade.pickup_zone,
            message: '학생회관 정문에서 만나요.',
          },
          reserved_at: new Date(Date.now() - 86_400_000).toISOString(),
        }),
      ...(trade.status === TRADE_STATUS.COMPLETED && {
        completed_at: new Date(Date.now() - 3_600_000).toISOString(),
        impact: {
          saved_amount: trade.price,
          waste_reduced_kg: trade.weight_kg ?? 0,
          estimated_carbon_saved_kg_co2e:
            Math.round((trade.weight_kg ?? 0) * 1.93 * 100) / 100,
          completed_at: new Date(Date.now() - 3_600_000).toISOString(),
        },
      }),
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

    if (!body.weight_kg || Number(body.weight_kg) <= 0) {
      return validationError([
        { field: 'weightKg', message: '0보다 큰 무게를 입력해주세요.' },
      ]);
    }

    const created = {
      ...trades[0],
      id: `trade-${trades.length + 1}`,
      ...body,
      // 나눔은 서버가 가격을 0 으로 고정한다
      price: body.trade_type === 'SHARE' ? 0 : (body.price as number),
      pickup_zone: zone,
      status: TRADE_STATUS.AVAILABLE,
      author: users[0],
      my_application_status: null,
      can_apply: false,
      created_at: new Date().toISOString(),
    } as (typeof trades)[number];

    trades.unshift(created);
    return HttpResponse.json(
      {
        id: created.id,
        trade_type: created.trade_type,
        title: created.title,
        description: created.description,
        category: created.category,
        carbon_sector: created.category,
        condition: created.condition,
        price: created.price,
        weight_kg: created.weight_kg,
        available_date: created.available_date,
        pickup_zone: created.pickup_zone,
        status: created.status,
        created_at: created.created_at,
      },
      { status: 201 },
    );
  }),

  http.post(
    `${BASE}/trades/:tradeId/applications`,
    async ({ params, request }) => {
      await delay(LATENCY_MS);
      const trade = trades.find((t) => t.id === params.tradeId);
      if (!trade) return notFound();

      if (trade.status !== TRADE_STATUS.AVAILABLE) {
        return invalidState(
          trade.status,
          [TRADE_STATUS.AVAILABLE],
          'APPLY_TRADE',
        );
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
    },
  ),

  http.get(`${BASE}/trades/:tradeId/applications`, async ({ params }) => {
    await delay(LATENCY_MS);
    return HttpResponse.json({
      applications: applications.filter((a) => a.trade_id === params.tradeId),
    });
  }),

  http.post(
    `${BASE}/trades/:tradeId/applications/:applicationId/cancel`,
    async ({ params, request }) => {
      await delay(LATENCY_MS);
      await request.json(); // BE의 필수 @RequestBody 계약을 목업에서도 강제한다
      const trade = trades.find((t) => t.id === params.tradeId);
      const application = applications.find(
        (a) => a.id === params.applicationId && a.trade_id === params.tradeId,
      );
      if (!trade || !application) return notFound();

      if (application.status !== APPLICATION_STATUS.PENDING) {
        return invalidState(
          application.status,
          [APPLICATION_STATUS.PENDING],
          'CANCEL_APPLICATION',
        );
      }

      application.status = APPLICATION_STATUS.CANCELLED;
      return HttpResponse.json({
        application_id: application.id,
        trade_id: trade.id,
        status: application.status,
        cancelled_by: 'TRADE_APPLICANT',
        cancelled_at: new Date().toISOString(),
      });
    },
  ),

  http.post(
    `${BASE}/trades/:tradeId/applications/:applicationId/accept`,
    async ({ params, request }) => {
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

      // 수락은 거래 약속 확정과 한 번에 일어난다. 서버가 본문을 필수로 받는다
      const body = (await request.json()) as AcceptApplicationRequest;
      if (!body?.meeting_at || !body?.pickup_zone_id) {
        return validationError([
          { field: 'meetingAt', message: '거래 시각을 선택해주세요.' },
        ]);
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
      const zone =
        pickupZones.find((z) => z.id === body.pickup_zone_id) ?? pickupZones[0];
      return HttpResponse.json({
        trade_id: trade.id,
        status: trade.status,
        reserved_at: new Date().toISOString(),
        meeting: {
          meeting_at: body.meeting_at,
          pickup_zone: zone,
          message: body.message ?? null,
        },
      });
    },
  ),

  /*
   * 게시물 삭제.
   * BE 에는 아직 이 엔드포인트가 없다. 목업은 요청한 규격대로 구현해 둬
   * 화면을 미리 검증하고, 서버가 붙으면 그대로 동작하게 한다.
   */
  http.delete(`${BASE}/trades/:tradeId`, async ({ params }) => {
    await delay(LATENCY_MS);
    const index = trades.findIndex((t) => t.id === params.tradeId);
    if (index < 0) return notFound();

    const trade = trades[index];
    if (trade.author.id !== DEMO_ME_ID) return forbidden();
    if (trade.status !== TRADE_STATUS.AVAILABLE) {
      return invalidState(
        trade.status,
        [TRADE_STATUS.AVAILABLE],
        'DELETE_TRADE',
      );
    }

    trades.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 거래 수정 — AVAILABLE 에서만, 보낸 필드만 반영
  http.patch(`${BASE}/trades/:tradeId`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const trade = trades.find((t) => t.id === params.tradeId);
    if (!trade) return notFound();

    if (trade.status !== TRADE_STATUS.AVAILABLE) {
      return invalidState(
        trade.status,
        [TRADE_STATUS.AVAILABLE],
        'UPDATE_TRADE',
      );
    }

    const body = (await request.json()) as UpdateTradeRequest;
    if (body.title !== undefined) trade.title = body.title;
    if (body.description !== undefined) trade.description = body.description;
    if (body.price !== undefined) trade.price = body.price;
    if (body.available_date !== undefined) {
      trade.available_date = body.available_date;
    }
    if (body.pickup_zone_id !== undefined) {
      const zone = pickupZones.find((z) => z.id === body.pickup_zone_id);
      if (!zone) return notFound();
      trade.pickup_zone = zone;
    }

    return HttpResponse.json({
      id: trade.id,
      title: trade.title,
      price: trade.price,
      available_date: trade.available_date,
      status: trade.status,
      updated_at: new Date().toISOString(),
    });
  }),

  http.post(
    `${BASE}/trades/:tradeId/reservation/cancel`,
    async ({ params, request }) => {
      await delay(LATENCY_MS);
      await request.json(); // 선택 사유와 별개로 JSON 본문은 필수다
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
    },
  ),

  http.post(
    `${BASE}/trades/:tradeId/completion/request`,
    async ({ params }) => {
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
    },
  ),

  http.post(
    `${BASE}/trades/:tradeId/completion/confirm`,
    async ({ params }) => {
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
        (
          myImpact.estimated_carbon_saved_kg_co2e +
          (trade.weight_kg ?? 1) * 1.93
        ).toFixed(1),
      );

      return HttpResponse.json({ status: trade.status });
    },
  ),

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

    // 선택된 지원자·남은 시간은 서버가 응답 시점에 계산한다
    const selected = offers.find(
      (o) => o.rental_id === rental.id && o.status === OFFER_STATUS.SELECTED,
    );
    const remainingMs = new Date(rental.due_at).getTime() - Date.now();
    const inProgress =
      rental.status === RENTAL_STATUS.CONFIRMED ||
      rental.status === RENTAL_STATUS.IN_USE;

    return HttpResponse.json({
      ...rental,
      offer_count: offers.filter(
        (o) => o.rental_id === rental.id && o.status === OFFER_STATUS.PENDING,
      ).length,
      ...(selected && {
        selected_offerer: { ...selected.offerer, rental_completed_count: 5 },
      }),
      ...(inProgress && {
        remaining_minutes: Math.max(0, Math.round(remainingMs / 60_000)),
      }),
      ...(rental.status === RENTAL_STATUS.COMPLETED && {
        completed_at: rental.due_at,
        return_message: '정상 반납했습니다.',
        impact: {
          saved_amount: 0,
          waste_reduced_kg: 0.2,
          estimated_carbon_saved_kg_co2e: 3.59,
          completed_at: rental.due_at,
        },
      }),
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

    if (!body.weight_kg || Number(body.weight_kg) <= 0) {
      return validationError([
        { field: 'weightKg', message: '0보다 큰 무게를 입력해주세요.' },
      ]);
    }

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
      offer_count: 0,
      my_offer_status: null,
      can_offer: false,
    } as (typeof rentals)[number];

    rentals.unshift(created);
    return HttpResponse.json(
      {
        id: created.id,
        item_name: created.item_name,
        category: created.category,
        description: created.description,
        pickup_zone: created.pickup_zone,
        start_at: created.start_at,
        duration_minutes: body.duration_minutes as number,
        due_at: created.due_at,
        offered_price: created.offered_price,
        status: created.status,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
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
      offers: offers.filter((o) => o.rental_id === params.rentalId),
    });
  }),

  http.post(
    `${BASE}/rentals/:rentalId/offers/:offerId/cancel`,
    async ({ params, request }) => {
      await delay(LATENCY_MS);
      await request.json();
      const rental = rentals.find((r) => r.id === params.rentalId);
      const offer = offers.find(
        (o) => o.id === params.offerId && o.rental_id === params.rentalId,
      );
      if (!rental || !offer) return notFound();

      if (offer.status !== OFFER_STATUS.PENDING) {
        return invalidState(
          offer.status,
          [OFFER_STATUS.PENDING],
          'CANCEL_OFFER',
        );
      }

      offer.status = OFFER_STATUS.CANCELLED;
      return HttpResponse.json({
        offer_id: offer.id,
        rental_id: rental.id,
        status: offer.status,
        cancelled_by: 'RENTAL_OFFERER',
        cancelled_at: new Date().toISOString(),
      });
    },
  ),

  // 대여 요청 삭제 — 거래와 같은 이유로 목업이 먼저 있다
  http.delete(`${BASE}/rentals/:rentalId`, async ({ params }) => {
    await delay(LATENCY_MS);
    const index = rentals.findIndex((r) => r.id === params.rentalId);
    if (index < 0) return notFound();

    const rental = rentals[index];
    if (rental.requester.id !== DEMO_ME_ID) return forbidden();
    if (rental.status !== RENTAL_STATUS.RECRUITING) {
      return invalidState(
        rental.status,
        [RENTAL_STATUS.RECRUITING],
        'DELETE_RENTAL',
      );
    }

    rentals.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 대여 수정 — RECRUITING 에서만. 시간이 바뀌면 반납 예정 시각을 다시 계산한다
  http.patch(`${BASE}/rentals/:rentalId`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    if (rental.status !== RENTAL_STATUS.RECRUITING) {
      return invalidState(
        rental.status,
        [RENTAL_STATUS.RECRUITING],
        'UPDATE_RENTAL',
      );
    }

    const body = (await request.json()) as UpdateRentalRequest;
    if (body.description !== undefined) rental.description = body.description;
    if (body.offered_price !== undefined) {
      rental.offered_price = body.offered_price;
    }

    // start_at 이나 duration 이 오면 due_at 을 서버가 다시 계산한다
    const previousMinutes = Math.round(
      (new Date(rental.due_at).getTime() -
        new Date(rental.start_at).getTime()) /
        60_000,
    );
    const minutes = body.duration_minutes ?? previousMinutes;
    if (body.start_at !== undefined) rental.start_at = body.start_at;
    rental.due_at = new Date(
      new Date(rental.start_at).getTime() + minutes * 60_000,
    ).toISOString();

    return HttpResponse.json({
      id: rental.id,
      start_at: rental.start_at,
      duration_minutes: minutes,
      due_at: rental.due_at,
      offered_price: rental.offered_price,
      status: rental.status,
      updated_at: new Date().toISOString(),
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
            o.id === params.offerId
              ? OFFER_STATUS.SELECTED
              : OFFER_STATUS.CLOSED;
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

  http.post(
    `${BASE}/rentals/:rentalId/return/request`,
    async ({ params, request }) => {
      await delay(LATENCY_MS);
      const body = (await request.json()) as { message?: string };
      const rental = rentals.find((r) => r.id === params.rentalId);
      if (!rental) return notFound();

      if (rental.status !== RENTAL_STATUS.IN_USE) {
        return invalidState(
          rental.status,
          [RENTAL_STATUS.IN_USE],
          'REQUEST_RETURN',
        );
      }

      rental.status = RENTAL_STATUS.RETURN_PENDING;
      rental.return_message = body.message;
      return HttpResponse.json({ status: rental.status });
    },
  ),

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

  http.post(`${BASE}/rentals/:rentalId/cancel`, async ({ params, request }) => {
    await delay(LATENCY_MS);
    await request.json();
    const rental = rentals.find((r) => r.id === params.rentalId);
    if (!rental) return notFound();

    if (
      rental.status !== RENTAL_STATUS.RECRUITING &&
      rental.status !== RENTAL_STATUS.CONFIRMED
    ) {
      return invalidState(
        rental.status,
        [RENTAL_STATUS.RECRUITING, RENTAL_STATUS.CONFIRMED],
        'CANCEL_RENTAL',
      );
    }

    rental.status = RENTAL_STATUS.CANCELLED;
    offers
      .filter((o) => o.rental_id === rental.id)
      .forEach((o) => {
        if (
          o.status === OFFER_STATUS.PENDING ||
          o.status === OFFER_STATUS.SELECTED
        ) {
          o.status = OFFER_STATUS.CANCELLED;
        }
      });
    return HttpResponse.json({
      rental_id: rental.id,
      status: rental.status,
      cancelled_at: new Date().toISOString(),
    });
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
          {
            item_name: '알 수 없는 물품',
            category: CATEGORY.HOME_LIVING,
            confidence: 0.31,
          },
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
        {
          item_name: 'C타입 충전기',
          category: CATEGORY.ELECTRONICS,
          confidence: 0.92,
        },
        {
          item_name: 'USB-C 어댑터',
          category: CATEGORY.ELECTRONICS,
          confidence: 0.74,
        },
        {
          item_name: '멀티 케이블',
          category: CATEGORY.ELECTRONICS,
          confidence: 0.51,
        },
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
        {
          sector: 'HOME_LIVING',
          avoidance_factor_kg_co2e_per_kg: 1.93,
          production_stage_ratio: 0.687,
          sample_count: 312,
        },
        {
          sector: 'ELECTRONICS',
          avoidance_factor_kg_co2e_per_kg: 17.94,
          production_stage_ratio: 0.607,
          sample_count: 274,
        },
        {
          sector: 'BOOKS_PAPER',
          avoidance_factor_kg_co2e_per_kg: 0.5,
          production_stage_ratio: 0.946,
          sample_count: 88,
        },
      ],
      sources: [
        {
          name: 'The Carbon Catalogue',
          published_year: 2022,
          product_count: 866,
        },
        {
          name: 'WRAP reuse displacement research',
          published_year: 2025,
          reported_substitution_rate: 0.646,
        },
      ],
      reference_date: '2026-08-11',
      notice: '모든 탄소 수치는 실측값이 아닌 예상 절감량입니다.',
    });
  }),
];
