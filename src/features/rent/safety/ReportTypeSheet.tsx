import { useState } from 'react';

import type { ReportType } from '@/entities/rental/safety/types';
import { RETURN_REPORT_TYPES, REPORT_TYPE_LABEL } from '@/shared/config/safety';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Field';
import { Sheet } from '@/shared/ui/Sheet';
import { cn } from '@/shared/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { reportType: ReportType; description: string }) => void;
  loading?: boolean;
}

/** "문제가 있어요" 선택 후 신고 유형을 고른다 */
export function ReportTypeSheet({ open, onClose, onSubmit, loading }: Props) {
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');

  const reset = () => {
    setReportType(null);
    setDescription('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = reportType && description.trim().length >= 5;

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="문제 유형 선택"
      footer={
        <Button
          fullWidth
          loading={loading}
          disabled={!canSubmit}
          onClick={() => {
            if (!reportType) return;
            onSubmit({ reportType, description: description.trim() });
          }}
        >
          신고 접수
        </Button>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm text-ink-600">
          어떤 문제가 있었는지 알려주세요. 신고가 접수되면 확인 절차가 진행돼요.
        </p>

        <div className="grid gap-2">
          {RETURN_REPORT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setReportType(type)}
              className={cn(
                'rounded-btn border px-4 py-3 text-left text-sm font-semibold transition-colors',
                reportType === type
                  ? 'border-brand-400 bg-brand-50 text-brand-800'
                  : 'border-ink-200 text-ink-800 hover:bg-ink-50',
              )}
            >
              {REPORT_TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        {reportType && (
          <Textarea
            label="상세 설명"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="어떤 부분이 문제인지 구체적으로 적어 주세요."
            hint="최소 5자 이상"
          />
        )}
      </div>
    </Sheet>
  );
}
