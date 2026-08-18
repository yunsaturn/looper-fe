import { useEffect, useRef, useState } from 'react';

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/entities/storage/api';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

interface Props {
  /** 대여 시작 시 등록한 기준 사진 URL */
  referenceUrl: string;
  onCapture: (file: File | null) => void;
  capturedFile: File | null;
}

/**
 * 반납 촬영 — 기준 사진을 30% 투명도로 겹쳐 비슷한 구도로 찍을 수 있게 한다.
 * 카메라(getUserMedia)를 우선 시도하고, 불가하면 파일 선택으로 폴백한다.
 */
export function OverlayPhotoCapture({
  referenceUrl,
  onCapture,
  capturedFile,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'camera' | 'file'>('camera');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'camera' || capturedFile) return undefined;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
        setCameraError(null);
      } catch {
        if (!cancelled) {
          setMode('file');
          setCameraError(
            '카메라를 사용할 수 없어요. 아래에서 사진을 선택해 주세요.',
          );
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [mode, capturedFile]);

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `return-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  const pickFile = (file: File) => {
    setLocalError(null);
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      setLocalError('JPG, PNG, WEBP 이미지만 올릴 수 있어요.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError('이미지 용량은 10MB 이하만 가능해요.');
      return;
    }
    onCapture(file);
  };

  const retake = () => {
    onCapture(null);
    setMode('camera');
    setCameraReady(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (capturedFile) {
    return (
      <div className="grid gap-3">
        <p className="rounded-btn bg-ink-50 px-3 py-2 text-sm text-ink-600">
          반납 사진이 준비되었어요.
        </p>
        <Button type="button" variant="secondary" fullWidth onClick={retake}>
          다시 촬영
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs leading-relaxed text-ink-500">
        대여 시작 때 찍은 사진을 흐리게 겹쳐 두었어요. 같은 구도로 맞춰 촬영하면
        AI 비교 정확도가 높아져요.
      </p>

      {mode === 'camera' && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-ink-200 bg-ink-900">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <img
            src={referenceUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
          />
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
              카메라 준비 중…
            </div>
          )}
        </div>
      )}

      {mode === 'file' && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-dashed border-ink-300 bg-ink-50">
          <img
            src={referenceUrl}
            alt="기준 사진"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              'relative z-10 flex h-full w-full flex-col items-center justify-center gap-1',
              'text-sm text-ink-600',
            )}
          >
            <span className="text-lg">＋</span>
            반납 사진 촬영 또는 선택
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pickFile(file);
        }}
      />

      {mode === 'camera' && cameraReady && (
        <Button type="button" fullWidth onClick={snap}>
          촬영하기
        </Button>
      )}

      {cameraError && <p className="text-xs text-ink-500">{cameraError}</p>}
      {localError && (
        <p className="text-xs text-tone-danger-fg">{localError}</p>
      )}
    </div>
  );
}
