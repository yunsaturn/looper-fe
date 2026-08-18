import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { rentalSafetyApi } from '@/entities/rental/safety/api';
import type { AiCompareResult } from '@/entities/rental/safety/types';
import { storageApi } from '@/entities/storage/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { ApiError } from '@/shared/api/errors';
import { buildPath, ROUTES } from '@/shared/config/navigation';
import { RENTAL_STATUS } from '@/shared/config/status';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Field';
import { ConfirmDialog } from '@/shared/ui/Sheet';
import { Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';

import { AiResultBadge, PhotoGallery } from './AiResultBadge';
import { OverlayPhotoCapture } from './OverlayPhotoCapture';
import { PhotoUploadField } from './PhotoUploadField';
import { ReportTypeSheet } from './ReportTypeSheet';

interface Props {
  rentalId: string;
  rentalStatus: string;
  isRequester: boolean;
  isSelectedOfferer: boolean;
}

/**
 * 대여 안전 절차 — 기준 사진 등록 → 수령 확인 → 반납 촬영 → 제공자 확인.
 * RentalDetailPage 에서 역할·상태에 맞는 단계만 노출한다.
 */
export function RentalSafetyFlow({
  rentalId,
  rentalStatus,
  isRequester,
  isSelectedOfferer,
}: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [beforeDescription, setBeforeDescription] = useState('');
  const [returnFile, setReturnFile] = useState<File | null>(null);
  const [returnDescription, setReturnDescription] = useState('');
  const [afterResult, setAfterResult] = useState<AiCompareResult | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const safety = useQuery({
    queryKey: queryKeys.rentals.safety(rentalId),
    queryFn: () => rentalSafetyApi.get(rentalId),
    enabled: Boolean(rentalId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rentals.all });
    queryClient.invalidateQueries({
      queryKey: queryKeys.rentals.safety(rentalId),
    });
  };

  const onError = (error: unknown) => {
    const apiError = error instanceof ApiError ? error : null;
    toast.show(apiError?.message ?? '요청을 처리하지 못했어요.', 'error');
  };

  const registerBefore = useMutation({
    mutationFn: async () => {
      const imageUrls = await Promise.all(
        beforeFiles.map((file) => storageApi.upload(file)),
      );
      return rentalSafetyApi.registerBefore(rentalId, {
        image_urls: imageUrls,
        description: beforeDescription.trim() || undefined,
      });
    },
    onSuccess: () => {
      setBeforeFiles([]);
      setBeforeDescription('');
      invalidate();
      toast.show('기준 사진을 등록했어요.', 'success');
    },
    onError,
  });

  const acceptCondition = useMutation({
    mutationFn: () => rentalSafetyApi.acceptCondition(rentalId),
    onSuccess: () => {
      invalidate();
      toast.show('상태를 확인했어요. 대여가 시작됐어요.', 'success');
    },
    onError,
  });

  const registerAfter = useMutation({
    mutationFn: async () => {
      if (!returnFile) throw new Error('반납 사진이 필요해요.');
      const imageUrl = await storageApi.upload(returnFile);
      return rentalSafetyApi.registerAfter(rentalId, {
        image_urls: [imageUrl],
        description: returnDescription.trim() || undefined,
      });
    },
    onSuccess: (result) => {
      setAfterResult(result);
      if (result.needs_retake) {
        setReturnFile(null);
        toast.show('다시 촬영해 주세요.', 'error');
        return;
      }
      invalidate();
      toast.show('반납 사진을 등록했어요. 제공자 확인을 기다려 주세요.', 'success');
    },
    onError,
  });

  const approveReturn = useMutation({
    mutationFn: () => rentalSafetyApi.approveReturn(rentalId),
    onSuccess: () => {
      setApproveOpen(false);
      invalidate();
      navigate(buildPath(ROUTES.RENTAL_COMPLETE, { rentalId }));
    },
    onError: (error) => {
      setApproveOpen(false);
      onError(error);
    },
  });

  const createReport = useMutation({
    mutationFn: (payload: {
      reportType: Parameters<typeof rentalSafetyApi.createReport>[1]['report_type'];
      description: string;
    }) =>
      rentalSafetyApi.createReport(rentalId, {
        report_type: payload.reportType,
        description: payload.description,
      }),
    onSuccess: () => {
      setReportOpen(false);
      invalidate();
      toast.show('신고가 접수됐어요.', 'success');
    },
    onError,
  });

  const showSafety =
    rentalStatus === RENTAL_STATUS.CONFIRMED ||
    rentalStatus === RENTAL_STATUS.IN_USE ||
    rentalStatus === RENTAL_STATUS.RETURN_PENDING;

  if (!showSafety) return null;

  if (safety.isPending) {
    return <Skeleton className="h-24 w-full rounded-card" />;
  }

  if (safety.isError) {
    return (
      <section className="rounded-card border border-ink-200 p-4">
        <p className="text-sm text-ink-600">
          안전 절차 정보를 불러오지 못했어요.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => safety.refetch()}
        >
          다시 시도
        </Button>
      </section>
    );
  }

  const data = safety.data;
  const hasBefore = Boolean(data.before?.image_urls.length);
  const referenceUrl = data.before?.image_urls[0] ?? '';
  const aiResult = afterResult ?? data.ai_result;

  /* ── 제공자: 기준 사진 등록 (CONFIRMED) ── */
  if (
    isSelectedOfferer &&
    rentalStatus === RENTAL_STATUS.CONFIRMED &&
    !hasBefore
  ) {
    return (
      <section className="rounded-card border border-brand-300 bg-brand-50 p-4">
        <h3 className="text-sm font-bold text-brand-800">기준 사진 등록</h3>
        <p className="mt-1 text-sm text-ink-600">
          빌려주는 물품 상태를 사진으로 남겨 주세요. 빌린 사람이 수령 전에
          확인하고 대여를 시작해요.
        </p>
        <div className="mt-4 grid gap-3">
          <PhotoUploadField files={beforeFiles} onChange={setBeforeFiles} />
          <Textarea
            label="상태 메모 (선택)"
            value={beforeDescription}
            onChange={(e) => setBeforeDescription(e.target.value)}
            placeholder="예: 본체·충전기·케이블 포함"
          />
          <Button
            fullWidth
            loading={registerBefore.isPending}
            disabled={beforeFiles.length === 0}
            onClick={() => registerBefore.mutate()}
          >
            기준 사진 등록
          </Button>
        </div>
      </section>
    );
  }

  /* ── 빌린 사람: 기준 사진 확인 후 수령 (CONFIRMED) ── */
  if (
    isRequester &&
    rentalStatus === RENTAL_STATUS.CONFIRMED &&
    hasBefore &&
    !data.condition_accepted
  ) {
    return (
      <section className="rounded-card border border-brand-300 bg-brand-50 p-4">
        <h3 className="text-sm font-bold text-brand-800">수령 전 상태 확인</h3>
        <p className="mt-1 text-sm text-ink-600">
          제공자가 등록한 사진과 실물 상태가 같은지 확인해 주세요.
        </p>
        <div className="mt-4 grid gap-4">
          <PhotoGallery urls={data.before!.image_urls} label="기준 사진" />
          {data.before?.description && (
            <p className="rounded-btn bg-white/70 px-3 py-2 text-sm text-ink-700">
              {data.before.description}
            </p>
          )}
          <Button
            fullWidth
            loading={acceptCondition.isPending}
            onClick={() => acceptCondition.mutate()}
          >
            상태 일치 확인 · 대여 시작
          </Button>
        </div>
      </section>
    );
  }

  /* ── CONFIRMED: 상대방 대기 ── */
  if (rentalStatus === RENTAL_STATUS.CONFIRMED) {
    if (isRequester && !hasBefore) {
      return (
        <section className="rounded-card border border-ink-200 p-4">
          <p className="text-sm text-ink-600">
            제공자가 기준 사진을 등록하면 수령 확인을 진행할 수 있어요.
          </p>
        </section>
      );
    }
    if (isSelectedOfferer && hasBefore && !data.condition_accepted) {
      return (
        <section className="rounded-card border border-ink-200 p-4">
          <PhotoGallery urls={data.before!.image_urls} label="등록한 기준 사진" />
          <p className="mt-3 text-sm text-ink-600">
            빌린 사람이 상태 확인을 하면 대여가 시작돼요.
          </p>
        </section>
      );
    }
  }

  /* ── 빌린 사람: 반납 촬영 (IN_USE) ── */
  if (isRequester && rentalStatus === RENTAL_STATUS.IN_USE && referenceUrl) {
    const needsRetake = aiResult?.needs_retake;

    return (
      <section className="rounded-card border border-brand-300 bg-brand-50 p-4">
        <h3 className="text-sm font-bold text-brand-800">반납 사진 촬영</h3>
        <p className="mt-1 text-sm text-ink-600">
          반납할 때의 상태를 촬영해 주세요. AI가 대여 시작 때 사진과
          비교해요.
        </p>
        <div className="mt-4 grid gap-3">
          {needsRetake && aiResult && <AiResultBadge result={aiResult} />}
          <OverlayPhotoCapture
            referenceUrl={referenceUrl}
            capturedFile={returnFile}
            onCapture={setReturnFile}
          />
          <Textarea
            label="반납 메모 (선택)"
            value={returnDescription}
            onChange={(e) => setReturnDescription(e.target.value)}
            placeholder="예: 충전기 함께 반납"
          />
          <Button
            fullWidth
            loading={registerAfter.isPending}
            disabled={!returnFile}
            onClick={() => registerAfter.mutate()}
          >
            반납 사진 등록
          </Button>
        </div>
      </section>
    );
  }

  /* ── 제공자: 반납 확인 (RETURN_PENDING) ── */
  if (
    isSelectedOfferer &&
    rentalStatus === RENTAL_STATUS.RETURN_PENDING &&
    data.after
  ) {
    return (
      <>
        <section className="rounded-card border border-brand-300 bg-brand-50 p-4">
          <h3 className="text-sm font-bold text-brand-800">반납 확인</h3>
          <p className="mt-1 text-sm text-ink-600">
            AI 비교 결과를 참고해 반납 상태를 확인해 주세요.
          </p>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <PhotoGallery
                urls={data.before?.image_urls ?? []}
                label="대여 시작"
              />
              <PhotoGallery
                urls={data.after.image_urls}
                label="반납"
              />
            </div>

            {aiResult && <AiResultBadge result={aiResult} />}

            {data.reports.length > 0 && (
              <p className="text-sm text-ink-600">
                접수된 신고 {data.reports.length}건 — 확인 후 처리돼요.
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button fullWidth onClick={() => setApproveOpen(true)}>
                정상 반납
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => setReportOpen(true)}
              >
                문제가 있어요
              </Button>
            </div>
          </div>
        </section>

        <ConfirmDialog
          open={approveOpen}
          onClose={() => setApproveOpen(false)}
          onConfirm={() => approveReturn.mutate()}
          loading={approveReturn.isPending}
          title="정상 반납으로 확인할까요?"
          description="반납 물품을 직접 확인하셨나요? 확인하면 대여가 완료돼요."
          confirmLabel="정상 반납"
        />

        <ReportTypeSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          loading={createReport.isPending}
          onSubmit={(payload) => createReport.mutate(payload)}
        />
      </>
    );
  }

  /* ── RETURN_PENDING: 빌린 사람 대기 ── */
  if (isRequester && rentalStatus === RENTAL_STATUS.RETURN_PENDING) {
    return (
      <section className="rounded-card border border-ink-200 p-4">
        <h3 className="text-sm font-bold text-ink-900">반납 확인 대기</h3>
        <p className="mt-1 text-sm text-ink-600">
          제공자가 반납 상태를 확인하고 있어요.
        </p>
        {data.after && (
          <div className="mt-3">
            <PhotoGallery urls={data.after.image_urls} label="등록한 반납 사진" />
          </div>
        )}
        {aiResult && (
          <div className="mt-3">
            <AiResultBadge result={aiResult} />
          </div>
        )}
      </section>
    );
  }

  return null;
}
