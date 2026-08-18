import type { StatusMeta } from '@/shared/config/status';
import {
  AI_CONDITION_STATUS,
  REPORT_TYPE,
  type AiConditionStatus,
  type ReportType,
} from '@/entities/rental/safety/types';

/** AI 결과 UI 라벨 — "손상 확정" 표현 금지 */
export const AI_CONDITION_META: Record<AiConditionStatus, StatusMeta> = {
  [AI_CONDITION_STATUS.NORMAL]: {
    label: '정상',
    tone: 'done',
    description: '대여 전후 상태가 비슷해 보여요.',
  },
  [AI_CONDITION_STATUS.CHECK]: {
    label: '확인 필요',
    tone: 'warning',
    description: '차이가 있어요. 직접 확인해 주세요.',
  },
  [AI_CONDITION_STATUS.DAMAGE_SUSPECTED]: {
    label: '손상 의심',
    tone: 'danger',
    description: '눈에 띄는 변화가 감지됐어요. 꼼꼼히 확인해 주세요.',
  },
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  [REPORT_TYPE.APPEARANCE_DAMAGE]: '외관 손상',
  [REPORT_TYPE.FUNCTIONAL_DEFECT]: '작동하지 않음',
  [REPORT_TYPE.MISSING_COMPONENT]: '구성품 누락',
  [REPORT_TYPE.UNRETURNED]: '미반납',
  [REPORT_TYPE.OTHER]: '기타',
};

/** 제공자 반납 확인 화면에서 선택 가능한 신고 유형 */
export const RETURN_REPORT_TYPES: ReportType[] = [
  REPORT_TYPE.APPEARANCE_DAMAGE,
  REPORT_TYPE.FUNCTIONAL_DEFECT,
  REPORT_TYPE.MISSING_COMPONENT,
  REPORT_TYPE.OTHER,
];
