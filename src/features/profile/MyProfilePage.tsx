import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { impactApi } from '@/entities/impact/api';
import { userApi } from '@/entities/user/api';
import { ApiError } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/queryKeys';
import { useLogout } from '@/shared/hooks/useLogout';
import { ROUTES } from '@/shared/config/navigation';
import { formatCarbon } from '@/shared/lib/carbon';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Field';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/useToast';

import { ProfileStats, ProfileSummary } from './ProfileSummary';
import { WithdrawSheet } from './WithdrawSheet';

/**
 * 마이 프로필.
 *
 * 이메일·학교처럼 계정에 묶인 정보는 이 화면에만 있고, 상대방 프로필에는
 * 내려오지 않는다(기획서 R6). 서버도 공개 프로필 응답에서 이 필드들을
 * 빼고 주므로 화면에서 가릴 필요가 없다.
 *
 * 수정 가능한 항목은 서버가 허용하는 세 가지(닉네임·학과·주 이용 건물)뿐이다.
 * 학교와 캠퍼스는 가입할 때 이메일 도메인으로 정해지므로 바꿀 수 없다.
 */
export function MyProfilePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const logout = useLogout();

  const [editing, setEditing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const me = useQuery({ queryKey: queryKeys.me, queryFn: userApi.me });
  const impact = useQuery({
    queryKey: queryKeys.impact.me(),
    queryFn: () => impactApi.me(),
  });

  if (me.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (me.isError) {
    return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  }

  const profile = me.data;

  return (
    <div className="grid gap-4">
      <ProfileSummary
        nickname={profile.nickname}
        trustScore={profile.trust_score}
        affiliation={`${profile.school.name} · ${profile.campus.name}`}
        meta={[profile.department, profile.main_building]
          .filter(Boolean)
          .join(' · ')}
        action={
          !editing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
            >
              수정
            </Button>
          )
        }
      />

      {editing && (
        <ProfileEditForm
          initial={profile}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            toast.show('프로필을 수정했어요.', 'success');
            // 서버가 바뀐 필드만 돌려주므로 전체를 다시 받아온다 (R5)
            void queryClient.invalidateQueries({ queryKey: queryKeys.me });
          }}
        />
      )}

      <ProfileStats
        items={[
          {
            label: '거래 완료',
            value: profile.trade_completed_count,
            unit: '건',
          },
          {
            label: '대여 완료',
            value: profile.rental_completed_count,
            unit: '건',
          },
        ]}
      />

      <section className="rounded-card border border-ink-200 p-4">
        <h2 className="text-sm font-bold text-ink-900">계정</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row label="이메일" value={profile.email} />
          <Row label="학교" value={profile.school.name} />
          <Row label="캠퍼스" value={profile.campus.name} />
          <Row label="학과" value={profile.department ?? '입력하지 않음'} />
          <Row
            label="주 이용 건물"
            value={profile.main_building ?? '입력하지 않음'}
          />
        </dl>
      </section>

      <nav className="grid gap-2">
        <LinkCard
          to={ROUTES.MY_ACTIVITIES}
          title="내 활동"
          description="올린 글과 신청·지원한 내역을 한곳에서 확인해요."
        />
        <LinkCard
          to={ROUTES.IMPACT}
          title="나의 환경 기록"
          description={
            impact.data
              ? `누적 ${formatCarbon(impact.data.estimated_carbon_saved_kg_co2e)} 절감 (추정)`
              : '절약 금액과 예상 탄소 절감량을 확인해요.'
          }
        />
      </nav>

      <div className="grid gap-1">
        <Button
          variant="ghost"
          fullWidth
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          로그아웃
        </Button>
        <button
          type="button"
          onClick={() => setWithdrawOpen(true)}
          className="justify-self-center px-3 py-2 text-xs text-ink-400 underline hover:text-ink-600"
        >
          회원 탈퇴
        </button>
      </div>

      <WithdrawSheet
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onWithdrawn={() => {
          setWithdrawOpen(false);
          toast.show(
            '탈퇴가 완료됐어요. 그동안 함께해 주셔서 고마워요.',
            'success',
          );
          // 탈퇴 후에도 로그아웃과 똑같이 토큰·캐시를 비우고 나가야 한다
          logout.mutate();
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="truncate text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}

function LinkCard({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-card border border-ink-200 p-4 transition-colors hover:border-brand-300"
    >
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-xs text-ink-500">{description}</p>
    </Link>
  );
}

function ProfileEditForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: {
    nickname: string;
    department: string | null;
    main_building: string | null;
  };
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState(initial.nickname);
  const [department, setDepartment] = useState(initial.department ?? '');
  const [mainBuilding, setMainBuilding] = useState(initial.main_building ?? '');

  const save = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        nickname,
        // 서버는 보낸 필드만 반영한다. 빈 문자열은 지우려는 의도로 보고 그대로 보낸다
        department,
        main_building: mainBuilding,
      }),
    onSuccess: onSaved,
  });

  const error = save.error instanceof ApiError ? save.error : null;

  return (
    <form
      className="grid gap-3 rounded-card border border-brand-200 bg-brand-50/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Input
        label="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        minLength={2}
        maxLength={30}
        required
        error={error?.fieldError('nickname')}
      />
      <Input
        label="학과"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        maxLength={100}
        placeholder="예: 환경공학과"
        error={error?.fieldError('department')}
      />
      <Input
        label="주 이용 건물"
        value={mainBuilding}
        onChange={(e) => setMainBuilding(e.target.value)}
        maxLength={100}
        placeholder="예: 학생회관"
        hint="자주 가는 건물을 적어두면 픽업존을 고르기 쉬워요."
        error={error?.fieldError('main_building')}
      />

      {error && !error.fieldErrors.length && (
        <p className="rounded-btn bg-tone-danger-bg px-3 py-2.5 text-sm text-tone-danger-fg">
          {error.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" fullWidth loading={save.isPending}>
          저장
        </Button>
      </div>
    </form>
  );
}
