import type { Bestellungen, Speisekarte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface BestellungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bestellungen | null;
  onEdit: (record: Bestellungen) => void;
  speisekarteList: Speisekarte[];
}

export function BestellungenViewDialog({ open, onClose, record, onEdit, speisekarteList }: BestellungenViewDialogProps) {
  function getSpeisekarteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return speisekarteList.find(r => r.record_id === id)?.fields.bezeichnung ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bestellungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name Bestellender</Label>
            <p className="text-sm">{record.fields.name_bestellender ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gericht</Label>
            <p className="text-sm">{getSpeisekarteDisplayName(record.fields.gericht)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorspeise</Label>
            <Badge variant="secondary">{record.fields.vorspeise?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besondere Hinweise</Label>
            <p className="text-sm">{record.fields.besondere_hinweise ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezahlung</Label>
            <Badge variant="secondary">{record.fields.bezahlung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezahlt</Label>
            <Badge variant="secondary">{record.fields.bezahlt?.label ?? '—'}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}