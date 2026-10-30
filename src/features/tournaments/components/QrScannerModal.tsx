import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QrScanner from 'qr-scanner';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';

/** `preview` solo se usa en el muestrario: muestra el modal sin encender la cámara. */
export function QrScannerModal({
  onClose,
  onScan,
  preview = false,
}: {
  onClose: () => void;
  onScan: (value: string) => void;
  preview?: boolean;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>();

  useEffect(() => {
    let scanned = false;
    if (preview || !videoRef.current) return;
    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (scanned) return;
        scanned = true;
        onScan(result.data);
      },
      {
        maxScansPerSecond: 8,
        onDecodeError: () => undefined,
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
      },
    );
    void scanner.start().catch(() => setCameraError(t('app.join.cameraUnavailable')));
    return () => scanner.destroy();
  }, [onScan, preview, t]);

  return (
    <Modal
      title={t('app.join.scanQrTitle')}
      description={t('app.join.scanQrDescription')}
      onClose={onClose}
    >
      {cameraError ? (
        <p role="alert" className="app-inline-error">
          {cameraError}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-border bg-black">
          <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
        </div>
      )}
      {!cameraError && (
        <p className="mt-3 text-center text-sm text-muted-foreground">{t('app.join.scanningQr')}</p>
      )}
      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="app-button app-button--secondary"
          onClick={onClose}
        >
          {t('app.common.cancel')}
        </Button>
      </div>
    </Modal>
  );
}
