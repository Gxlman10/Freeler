import { Dialog } from '@/components/ui/Dialog';
import { LeadForm } from './LeadForm';

type LeadFormModalProps = {
  open: boolean;
  onClose: () => void;
  campaignId?: number;
};

export const LeadFormModal = ({ open, onClose, campaignId }: LeadFormModalProps) => (
  <Dialog
    open={open}
    onOpenChange={(value) => {
      if (!value) onClose();
    }}
    title="Anadir referido"
  >
    <LeadForm campaignId={campaignId} onSubmitted={() => onClose()} />
  </Dialog>
);
