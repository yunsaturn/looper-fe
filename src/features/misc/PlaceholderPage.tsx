import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/config/navigation';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/feedback';
import { PageTitle } from '@/app/layouts/StackLayout';

/**
 * 아직 구현하지 않은 화면의 자리표시자.
 *
 * 라우트는 처음에 전부 선언해 두고 컴포넌트만 채워 나가는 방식이라,
 * 미구현 화면도 링크가 깨지지 않고 "여기는 다음 차례" 라는 것이 보인다.
 */
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const navigate = useNavigate();

  return (
    <>
      <PageTitle title={title} />
      <EmptyState
        title="아직 준비 중인 화면이에요"
        description={description ?? '다음 작업 차례입니다.'}
        action={
          <Button size="sm" onClick={() => navigate(ROUTES.HOME)}>
            홈으로
          </Button>
        }
      />
    </>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="text-xl font-bold text-ink-900">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-sm text-ink-500">
        주소가 바뀌었거나 삭제된 페이지일 수 있어요.
      </p>
      <Button onClick={() => navigate(ROUTES.HOME, { replace: true })}>
        홈으로 가기
      </Button>
    </div>
  );
}
