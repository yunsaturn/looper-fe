import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { userApi } from '@/entities/user/api';
import { WITHDRAWAL_CONFIRMATION } from '@/entities/user/types';
import { ApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Field';
import { Sheet } from '@/shared/ui/Sheet';

/**
 * 회원 탈퇴.
 *
 * 되돌릴 수 없는 동작이라 두 단계로 확인받는다 — 비밀번호 재입력과
 * 'DELETE' 문구 입력. 문구는 서버가 정규식으로 강제하는 값이므로
 * 화면에서 임의로 바꿀 수 없다.
 *
 * 확정·진행 중인 거래나 대여가 있으면 서버가 409 로 막는다. 상대방이
 * 기다리는 약속을 남긴 채 사라지는 걸 막기 위한 규칙이라, 화면에서는
 * 그 사유를 그대로 전달한다.
 */
export function WithdrawSheet({
  open,
  onClose,
  onWithdrawn,
}: {
  open: boolean;
  onClose: () => void;
  /** 탈퇴가 끝난 뒤 세션 정리를 호출자에게 맡긴다 */
  onWithdrawn: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const withdraw = useMutation({
    mutationFn: () =>
      userApi.withdraw({
        password,
        confirmation: WITHDRAWAL_CONFIRMATION,
      }),
    onSuccess: onWithdrawn,
  });

  const error = withdraw.error instanceof ApiError ? withdraw.error : null;
  const canSubmit =
    password.length > 0 && confirmation === WITHDRAWAL_CONFIRMATION;

  return (
    <Sheet open={open} onClose={onClose} title="회원 탈퇴">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          withdraw.mutate();
        }}
      >
        <div className="rounded-btn bg-tone-danger-bg px-3 py-3 text-sm leading-relaxed text-tone-danger-fg">
          <p className="font-semibold">탈퇴하면 되돌릴 수 없어요.</p>
          <ul className="mt-2 grid gap-1 text-xs">
            <li>· 계정이 비활성화되고 개인정보는 익명 처리돼요.</li>
            <li>· 작성한 글과 신청 내역은 더 이상 볼 수 없어요.</li>
            <li>· 이미 완료한 거래의 캠퍼스 임팩트는 익명 상태로 남아요.</li>
          </ul>
        </div>

        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          hint="본인 확인을 위해 다시 입력해주세요."
          error={error?.fieldError('password')}
        />

        <Input
          label={`확인을 위해 ${WITHDRAWAL_CONFIRMATION} 를 입력해주세요`}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={WITHDRAWAL_CONFIRMATION}
          autoComplete="off"
          required
          error={error?.fieldError('confirmation')}
        />

        {error && !error.fieldErrors.length && (
          <div className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
            <p>{error.message}</p>
            {/* 서버가 막은 이유가 상태 때문이면 무엇이 걸렸는지 알려준다 */}
            {error.currentStatus && (
              <p className="mt-1 text-xs">
                진행 중인 거래·대여를 먼저 마무리하거나 취소해주세요.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant="danger"
            fullWidth
            loading={withdraw.isPending}
            disabled={!canSubmit}
          >
            탈퇴하기
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
