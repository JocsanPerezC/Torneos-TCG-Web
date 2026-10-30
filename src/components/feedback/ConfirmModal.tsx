import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import i18n from '../../i18n';
import { primary } from '@/components/ui/classes';

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  destructive = false,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="app-button app-button--secondary"
          onClick={onClose}
        >
          {i18n.t('app.common.cancel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={destructive ? 'app-button app-button--danger' : primary}
          onClick={onConfirm}
        >
          {confirmLabel ?? i18n.t('app.common.save')}
        </Button>
      </div>
    </Modal>
  );
}
