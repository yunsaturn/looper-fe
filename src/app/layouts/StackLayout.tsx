import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { cn } from '@/shared/lib/cn';
import { LAYOUT } from '@/shared/config/navigation';
import { ChevronLeftIcon } from '@/shared/ui/icons';
import { RouteErrorBoundary } from '@/app/ErrorBoundary';

/**
 * 상세·등록처럼 흐름 안으로 들어가는 화면용 레이아웃.
 * 하단 탭 대신 뒤로가기 헤더를 둔다.
 */
export function StackLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-white">
      <StackHeader />
      <main
        className={cn(
          'mx-auto w-full px-4 py-5 pb-safe md:px-6 md:py-8',
          LAYOUT.contentMaxWidth,
        )}
      >
        <RouteErrorBoundary pathname={pathname}>
          <Outlet />
        </RouteErrorBoundary>
      </main>
    </div>
  );
}

function StackHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div
        className={cn(
          'mx-auto flex h-14 w-full items-center gap-2 px-2 md:h-16 md:px-4',
          LAYOUT.contentMaxWidth,
        )}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
          className="rounded-full p-2 text-ink-600 hover:bg-ink-50"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

/** 스택 화면의 제목 블록. 화면마다 같은 위치·크기로 나오게 한다. */
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink-900 md:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
