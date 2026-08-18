import {
  AI_CONDITION_STATUS,
  type AiCompareResult,
  type SafetyInfo,
} from '@/entities/rental/safety/types';

const iso = () => new Date().toISOString();

const PLACEHOLDER_BEFORE =
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80';
const PLACEHOLDER_AFTER =
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80&sat=-30';

function emptySafety(): SafetyInfo {
  return {
    before: null,
    after: null,
    ai_result: null,
    reports: [],
    condition_accepted: false,
    return_approved: false,
  };
}

/** MSW 전용 — 대여별 안전 절차 상태 */
export const safetyStore = new Map<string, SafetyInfo>();

/** 시연용 초기 데이터 */
export function initSafetyStore() {
  safetyStore.clear();

  // rental-13 (IN_USE, 요청자 시연) — 기준 사진 등록·수령 확인 완료
  safetyStore.set('rental-13', {
    before: {
      image_urls: [PLACEHOLDER_BEFORE],
      description: '본체·케이블 포함, 외관 양호',
      registered_at: iso(),
    },
    after: null,
    ai_result: null,
    reports: [],
    condition_accepted: true,
    return_approved: false,
  });

  // rental-16 (RETURN_PENDING) — 반납 확인 시연
  safetyStore.set('rental-16', {
    before: {
      image_urls: [PLACEHOLDER_BEFORE],
      registered_at: iso(),
    },
    after: {
      image_urls: [PLACEHOLDER_AFTER],
      registered_at: iso(),
    },
    ai_result: {
      status: AI_CONDITION_STATUS.CHECK,
      damage_suspicion_score: 0.42,
      needs_retake: false,
      message: '케이블 주변에 미세한 차이가 보여요. 직접 확인해 주세요.',
    },
    reports: [],
    condition_accepted: true,
    return_approved: false,
  });
}

export function getSafety(rentalId: string): SafetyInfo {
  return safetyStore.get(rentalId) ?? emptySafety();
}

export function setSafety(rentalId: string, info: SafetyInfo) {
  safetyStore.set(rentalId, info);
}

/** 반납 사진 URL 개수·설명으로 간단히 AI 결과를 시뮬레이션한다 */
export function mockAiCompare(
  imageUrls: string[],
  description?: string,
): AiCompareResult {
  if (imageUrls.length === 0) {
    return {
      status: AI_CONDITION_STATUS.CHECK,
      damage_suspicion_score: 0.5,
      needs_retake: true,
      message: '사진을 다시 촬영해 주세요.',
    };
  }

  const hint = (description ?? '').toLowerCase();
  if (hint.includes('damage') || hint.includes('손상')) {
    return {
      status: AI_CONDITION_STATUS.DAMAGE_SUSPECTED,
      damage_suspicion_score: 0.78,
      needs_retake: false,
      message: '눈에 띄는 변화가 감지됐어요. 꼼꼼히 확인해 주세요.',
    };
  }

  if (hint.includes('retake') || hint.includes('재촬영')) {
    return {
      status: AI_CONDITION_STATUS.CHECK,
      damage_suspicion_score: 0.35,
      needs_retake: true,
      message: '구도가 맞지 않아요. 기준 사진과 비슷하게 다시 촬영해 주세요.',
    };
  }

  return {
    status: AI_CONDITION_STATUS.NORMAL,
    damage_suspicion_score: 0.12,
    needs_retake: false,
    message: '대여 전후 상태가 비슷해 보여요.',
  };
}

// 앱 기동 시 시드
initSafetyStore();
