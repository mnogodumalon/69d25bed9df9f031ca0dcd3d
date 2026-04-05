import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichBestellungen } from '@/lib/enrich';
import type { EnrichedBestellungen } from '@/types/enriched';
import type { Speisekarte, Bestellungen } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconShoppingCart,
  IconGrillFork, IconUsers, IconCoin, IconNotes
} from '@tabler/icons-react';
import { SpeisekarteDialog } from '@/components/dialogs/SpeisekarteDialog';
import { BestellungenDialog } from '@/components/dialogs/BestellungenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';

const APPGROUP_ID = '69d25bed9df9f031ca0dcd3d';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    speisekarte, bestellungen,
    speisekarteMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedBestellungen = enrichBestellungen(bestellungen, { speisekarteMap });

  // All hooks before early returns
  const [speisekarteDialogOpen, setSpeisekarteDialogOpen] = useState(false);
  const [bestellungDialogOpen, setBestellungDialogOpen] = useState(false);
  const [editGericht, setEditGericht] = useState<Speisekarte | null>(null);
  const [editBestellung, setEditBestellung] = useState<EnrichedBestellungen | null>(null);
  const [deleteGericht, setDeleteGericht] = useState<Speisekarte | null>(null);
  const [deleteBestellung, setDeleteBestellung] = useState<EnrichedBestellungen | null>(null);
  const [selectedGerichtId, setSelectedGerichtId] = useState<string | null>(null);

  const bezahltStats = useMemo(() => {
    const bezahlt = bestellungen.filter(b => b.fields.bezahlt?.key === 'ja').length;
    const offen = bestellungen.filter(b => b.fields.bezahlt?.key !== 'ja').length;
    return { bezahlt, offen };
  }, [bestellungen]);

  const gesamtumsatz = useMemo(() => {
    let sum = 0;
    for (const b of bestellungen) {
      const id = b.fields.gericht ? speisekarteMap.get(b.fields.gericht.split('/').pop() ?? '') : null;
      if (id?.fields.preis) sum += id.fields.preis;
    }
    return sum;
  }, [bestellungen, speisekarteMap]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleGerichtSave = async (fields: Speisekarte['fields']) => {
    if (editGericht) {
      await LivingAppsService.updateSpeisekarteEntry(editGericht.record_id, fields);
    } else {
      await LivingAppsService.createSpeisekarteEntry(fields);
    }
    fetchAll();
    setEditGericht(null);
    setSpeisekarteDialogOpen(false);
  };

  const handleGerichtDelete = async () => {
    if (!deleteGericht) return;
    await LivingAppsService.deleteSpeisekarteEntry(deleteGericht.record_id);
    fetchAll();
    setDeleteGericht(null);
  };

  const handleBestellungSave = async (fields: Bestellungen['fields']) => {
    if (editBestellung) {
      await LivingAppsService.updateBestellungenEntry(editBestellung.record_id, fields);
    } else {
      await LivingAppsService.createBestellungenEntry(fields);
    }
    fetchAll();
    setEditBestellung(null);
    setBestellungDialogOpen(false);
  };

  const handleBestellungDelete = async () => {
    if (!deleteBestellung) return;
    await LivingAppsService.deleteBestellungenEntry(deleteBestellung.record_id);
    fetchAll();
    setDeleteBestellung(null);
  };

  const openNewBestellung = (gerichtId?: string) => {
    setEditBestellung(null);
    setSelectedGerichtId(gerichtId ?? null);
    setBestellungDialogOpen(true);
  };

  const bestellungDefaultValues = selectedGerichtId
    ? { gericht: createRecordUrl(APP_IDS.SPEISEKARTE, selectedGerichtId) }
    : editBestellung?.fields;

  return (
    <div className="space-y-6">
      {/* KPI Statistiken */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gerichte"
          value={String(speisekarte.length)}
          description="auf der Speisekarte"
          icon={<IconGrillFork size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Bestellungen"
          value={String(bestellungen.length)}
          description="insgesamt"
          icon={<IconShoppingCart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen"
          value={String(bezahltStats.offen)}
          description="noch nicht bezahlt"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Umsatz"
          value={formatCurrency(gesamtumsatz)}
          description="Gesamtumsatz"
          icon={<IconCoin size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Hauptbereich: Speisekarte + Bestellungen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speisekarte */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <IconGrillFork size={16} className="text-primary shrink-0" />
              <h2 className="font-semibold text-foreground">Speisekarte</h2>
              <span className="text-xs text-muted-foreground">({speisekarte.length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditGericht(null); setSpeisekarteDialogOpen(true); }}
            >
              <IconPlus size={14} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Gericht</span>
            </Button>
          </div>

          {speisekarte.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <IconGrillFork size={40} stroke={1.5} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Noch keine Gerichte eingetragen.</p>
              <Button size="sm" variant="outline" onClick={() => { setEditGericht(null); setSpeisekarteDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1" /> Erstes Gericht
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {speisekarte.map(gericht => (
                <div key={gericht.record_id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm truncate">{gericht.fields.bezeichnung ?? '—'}</span>
                      {gericht.fields.preis != null && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {formatCurrency(gericht.fields.preis)}
                        </Badge>
                      )}
                    </div>
                    {gericht.fields.beschreibung && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{gericht.fields.beschreibung}</p>
                    )}
                    {gericht.fields.besondere_angaben && (
                      <p className="text-xs text-amber-600 mt-0.5 truncate">{gericht.fields.besondere_angaben}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Bestellen"
                      onClick={() => openNewBestellung(gericht.record_id)}
                    >
                      <IconShoppingCart size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Bearbeiten"
                      onClick={() => { setEditGericht(gericht); setSpeisekarteDialogOpen(true); }}
                    >
                      <IconPencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title="Löschen"
                      onClick={() => setDeleteGericht(gericht)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bestellungen */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <IconShoppingCart size={16} className="text-primary shrink-0" />
              <h2 className="font-semibold text-foreground">Bestellungen</h2>
              <span className="text-xs text-muted-foreground">({bestellungen.length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => openNewBestellung()}
            >
              <IconPlus size={14} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Bestellung</span>
            </Button>
          </div>

          {enrichedBestellungen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <IconShoppingCart size={40} stroke={1.5} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Noch keine Bestellungen vorhanden.</p>
              <Button size="sm" variant="outline" onClick={() => openNewBestellung()}>
                <IconPlus size={14} className="mr-1" /> Erste Bestellung
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {enrichedBestellungen.map(bestellung => (
                <div key={bestellung.record_id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm truncate">
                        {bestellung.fields.name_bestellender ?? '—'}
                      </span>
                      <BezahltBadge bezahlt={bestellung.fields.bezahlt?.key} />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {bestellung.gerichtName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {bestellung.gerichtName}
                        </span>
                      )}
                      {bestellung.fields.vorspeise && (
                        <span className="text-xs text-muted-foreground">
                          · Vorspeise: {bestellung.fields.vorspeise.label}
                        </span>
                      )}
                    </div>
                    {bestellung.fields.bezahlung && (
                      <span className="text-xs text-muted-foreground">
                        {bestellung.fields.bezahlung.label}
                      </span>
                    )}
                    {bestellung.fields.besondere_hinweise && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <IconNotes size={11} className="text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-600 line-clamp-1">{bestellung.fields.besondere_hinweise}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Bearbeiten"
                      onClick={() => { setEditBestellung(bestellung); setSelectedGerichtId(null); setBestellungDialogOpen(true); }}
                    >
                      <IconPencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title="Löschen"
                      onClick={() => setDeleteBestellung(bestellung)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SpeisekarteDialog
        open={speisekarteDialogOpen}
        onClose={() => { setSpeisekarteDialogOpen(false); setEditGericht(null); }}
        onSubmit={handleGerichtSave}
        defaultValues={editGericht?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Speisekarte']}
      />

      <BestellungenDialog
        open={bestellungDialogOpen}
        onClose={() => { setBestellungDialogOpen(false); setEditBestellung(null); setSelectedGerichtId(null); }}
        onSubmit={handleBestellungSave}
        defaultValues={bestellungDefaultValues}
        speisekarteList={speisekarte}
        enablePhotoScan={AI_PHOTO_SCAN['Bestellungen']}
      />

      <ConfirmDialog
        open={!!deleteGericht}
        title="Gericht löschen"
        description={`„${deleteGericht?.fields.bezeichnung ?? 'Gericht'}" wirklich aus der Speisekarte entfernen?`}
        onConfirm={handleGerichtDelete}
        onClose={() => setDeleteGericht(null)}
      />

      <ConfirmDialog
        open={!!deleteBestellung}
        title="Bestellung löschen"
        description={`Bestellung von „${deleteBestellung?.fields.name_bestellender ?? 'Gast'}" wirklich löschen?`}
        onConfirm={handleBestellungDelete}
        onClose={() => setDeleteBestellung(null)}
      />
    </div>
  );
}

function BezahltBadge({ bezahlt }: { bezahlt?: string }) {
  if (bezahlt === 'ja') {
    return <Badge className="text-xs bg-green-500/15 text-green-700 border-green-200 shrink-0">Bezahlt</Badge>;
  }
  if (bezahlt === 'nein') {
    return <Badge variant="destructive" className="text-xs shrink-0 bg-red-500/15 text-red-700 border-red-200">Offen</Badge>;
  }
  return <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">Unbekannt</Badge>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
