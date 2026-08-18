import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { userApi } from '@/entities/user/api';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatDate } from '@/shared/lib/format';
import { useAuthStore } from '@/shared/store/authStore';
import { ErrorState, Skeleton } from '@/shared/ui/feedback';
import { PageTitle } from '@/app/layouts/StackLayout';

import { ProfileStats, ProfileSummary } from './ProfileSummary';

/**
 * 상대방 프로필.
 *
 * 거래를 결정하기 전에 상대가 어떤 사람인지 가늠할 수 있어야 한다.
 * 다만 판단 재료는 **행동의 결과**(신뢰도·완료 건수)까지다.
 * 이메일·학과·거래 내역 같은 신원 정보는 서버가 아예 내려주지 않는다.
 * 같은 캠퍼스 사용자가 아니면 서버가 404 를 준다.
 */
export function PublicProfilePage() {
  const { userId = '' } = useParams();
  const myUserId = useAuthStore((s) => s.userId);

  const profile = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => userApi.publicProfile(userId),
    enabled: Boolean(userId),
  });

  if (profile.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (profile.isError) {
    return (
      <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
    );
  }

  const data = profile.data;

  return (
    <div className="grid gap-4">
      <PageTitle title="프로필" />

      <ProfileSummary
        nickname={data.nickname}
        trustScore={data.trust_score}
        affiliation={`${data.school_name} · ${data.campus_name}`}
        meta={[
          data.department,
          data.student_year ? `${data.student_year}학년` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        bio={data.bio}
        imageUrl={data.profile_image_url}
        verified={data.email_verified}
        joinedAt={data.joined_at}
      />

      {data.last_completed_at && (
        <p className="-mt-1 text-xs text-ink-500">
          마지막 활동 {formatDate(data.last_completed_at)}
        </p>
      )}

      <ProfileStats
        items={[
          { label: '거래 완료', value: data.trade_completed_count, unit: '건' },
          {
            label: '나눔',
            value: data.sharing_completed_count,
            unit: '건',
          },
          {
            label: '대여 완료',
            value: data.rental_completed_count,
            unit: '건',
          },
        ]}
      />

      <p className="rounded-card bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
        신뢰도는 거래·반납을 성실히 마쳤는지를 규칙에 따라 계산한 점수예요.
        확정한 예약을 취소하거나 반납이 늦으면 내려가요.
        {data.id === myUserId && ' 지금 보고 계신 건 내 공개 프로필이에요.'}
      </p>
    </div>
  );
}
