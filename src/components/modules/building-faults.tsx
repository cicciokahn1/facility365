'use client';

/**
 * Stoerungshandbuch eines Gebaeudes.
 *
 * Stoerungen mit Symptomen, Ursachen, sicheren Pruefschritten,
 * Sofortmassnahmen und Eskalation; Suche und Kategoriefilter oben,
 * wiederverwendbare Vorlagen (eingebaut oder aus anderen Gebaeuden)
 * und ein direkter Auftragsstart je Stoerung.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Hammer, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { Building, BuildingFault, Priority } from '@/lib/types';
import { newId } from '@/lib/utils/id';

const CATEGORIES = [
  'heating',
  'electric',
  'water',
  'lift',
  'fireSafety',
  'ventilation',
  'roof',
  'security',
  'other',
] as const;

const categoryKey = (category: string) =>
  `fault.cat.${CATEGORIES.includes(category as never) ? category : 'other'}` as TranslationKey;

/** Eingebaute Vorlagen haeufiger Stoerungen zum Wiederverwenden. */
const TEMPLATES: { title: string; category: string; symptoms: string; causes: string; checkSteps: string; immediateMeasures: string; escalation: string; critical: boolean }[] = [
  {
    title: 'Heizung ausgefallen',
    category: 'heating',
    symptoms: 'Radiatoren kalt, Kessel arbeitslos, Störmeldung am Display.',
    causes: 'Auslöser: Brennerausfall, Luft in der Anlage, defekte Pumpe oder Thermostat, Stromausfall.',
    checkSteps: 'Kesselanzeige/Fehlercode ablesen, Stromversorgung und Hauptschalter prüfen, Thermostat prüfen, Wasserdruck kontrollieren.',
    immediateMeasures: 'Heizung neu starten gemäss Herstellerangabe, Druck nachfüllen (nur wenn bekannt), Bewohner informieren.',
    escalation: 'Bei weiterem Ausfall oder Fehlercode: Heizungsfirma anrufen. Bei Gasgeruch: 118 / Gasnotruf und lüften.',
    critical: true,
  },
  {
    title: 'Wasserrohrbruch',
    category: 'water',
    symptoms: 'Wasser tritt aus, nasse Wand/Boden, Druckverlust.',
    causes: 'Frosteinbruch, defekte Verbindung, Überspannung, Korrosion.',
    checkSteps: 'Hauptabsperrventil finden und schliessen, Strom im betroffenen Bereich ausschalten, Fotos vom Schaden.',
    immediateMeasures: 'Wasser abstellen, Eimer/Lappen stellen, Bewohner warnen, Bereich absichern.',
    escalation: 'Sanitärfirma sofort anrufen. Bei grossem Wasseraustritt: Pompier (118) verständigen.',
    critical: true,
  },
  {
    title: 'Aufzug steckt fest',
    category: 'lift',
    symptoms: 'Kabine bleibt stehen, Türen öffnen nicht, Personen eingeschlossen.',
    causes: 'Stromausfall, Türkontakt defekt, Überlast, Steuerungsfehler.',
    checkSteps: 'Über die Gegensprechanlage Kontakt aufnehmen, beruhigen. Niemals Türen aufbrechen oder Personen befreien.',
    immediateMeasures: 'Liftfirma über die Notrufnummer in der Kabine verständigen. Bei Gesundheitsnot: 144.',
    escalation: 'Nur die Liftfirma öffnet die Kabine. Wiederholte Ausfälle: Serviceticket aufgeben.',
    critical: true,
  },
  {
    title: 'Sicherung fällt heraus',
    category: 'electric',
    symptoms: 'Stromausfall in einem Bereich, Sicherung/FI kippt immer wieder.',
    causes: 'Überlast, defektes Gerät, Kurzschluss, feuchte Stelle.',
    checkSteps: 'Zuletzt verwendete Geräte abstecken, Sicherung einmal einschalten. Fällt sie wieder: nicht weiter versuchen.',
    immediateMeasures: 'Betroffenen Bereich kennzeichnen, Bewohner informieren, keine Reparaturen an der Anlage.',
    escalation: 'Elektroinstallateur anrufen. Bei Geruch/Rauch: sofort 118 und Bereich räumen.',
    critical: true,
  },
  {
    title: 'Keller unter Wasser',
    category: 'water',
    symptoms: 'Wasser im Keller oder in Schächten nach Regen.',
    causes: 'Rückstau, defekte Hebeanlage, undichte Wand, verstopfte Drainage.',
    checkSteps: 'Strom im Keller ausschalten, Hebeanlage prüfen (nur Sichtkontrolle), Fotos.',
    immediateMeasures: 'Hebeanlage einschalten falls möglich, Wasserzugang sperren, Wertsachen trocken legen.',
    escalation: 'Sanitärfirma / Kanalnotdienst. Bei Rückstau aus der Kanalisation: Gemeinde/Kanalunterhalt.',
    critical: false,
  },
];

export function FaultManager({ building, onChange }: { building: Building; onChange: (faults: BuildingFault[]) => void }) {
  const t = useT();
  const router = useRouter();
  const buildings = useCollection('buildings');
  const suppliers = useCollection('suppliers');
  const assets = useCollection('assets');
  const documents = useCollection('documents');
  const orders = useCollection('orders');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<BuildingFault | null>(null);

  const faults = building.faults ?? [];
  const buildingAssets = assets.items.filter((item) => item.buildingId === building.id);
  const otherFaults = buildings.items.filter((entry) => entry.id !== building.id).flatMap((entry) =>
    (entry.faults ?? []).map((fault) => ({ fault, buildingName: entry.name })),
  );

  const visible = faults.filter(
    (fault) =>
      (category === 'all' || fault.category === category) &&
      (!query || `${fault.title} ${fault.symptoms} ${fault.causes}`.toLowerCase().includes(query.toLowerCase())),
  );

  const empty: BuildingFault = {
    id: '',
    title: '',
    category: 'heating',
    symptoms: '',
    causes: '',
    checkSteps: '',
    immediateMeasures: '',
    escalation: '',
    supplierId: '',
    assetId: '',
    documentIds: [],
    critical: false,
    orderId: '',
  };

  const openNew = () => {
    setDraft({ ...empty, id: newId('flt') });
    setEditOpen(true);
  };

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const next = faults.some((entry) => entry.id === draft.id)
      ? faults.map((entry) => (entry.id === draft.id ? draft : entry))
      : [...faults, draft];
    onChange(next);
    setEditOpen(false);
  };

  const fromTemplate = (id: string) => {
    const template =
      TEMPLATES.find((entry) => `tpl:${entry.title}` === id) ??
      otherFaults.find((entry) => `copy:${entry.fault.id}` === id)?.fault;
    if (!template || !draft) return;
    setDraft({
      ...draft,
      title: template.title,
      category: template.category,
      symptoms: template.symptoms,
      causes: template.causes,
      checkSteps: template.checkSteps,
      immediateMeasures: template.immediateMeasures,
      escalation: template.escalation,
      critical: template.critical,
    });
  };

  const toOrder = (fault: BuildingFault) => {
    if (fault.orderId) {
      router.push(`/orders/${fault.orderId}`);
      return;
    }
    const order = orders.create({
      title: fault.title,
      description: [fault.symptoms, fault.causes, fault.immediateMeasures].filter(Boolean).join('\n\n'),
      propertyId: building.propertyId,
      buildingId: building.id,
      assetId: fault.assetId,
      supplierId: fault.supplierId,
      priority: fault.critical ? ('high' as Priority) : ('medium' as Priority),
      sourceCollection: 'buildings',
      sourceId: building.id,
    });
    onChange(faults.map((entry) => (entry.id === fault.id ? { ...entry, orderId: order.id } : entry)));
    toast.success(t('fault.createOrder'));
    router.push(`/orders/${order.id}`);
  };

  const field = (key: TranslationKey, name: keyof BuildingFault, textarea = true) => (
    <div className="flex flex-col gap-1.5">
      <Label>{t(key)}</Label>
      {textarea ? (
        <Textarea
          rows={3}
          value={String(draft?.[name] ?? '')}
          onChange={(event) => draft && setDraft({ ...draft, [name]: event.target.value })}
        />
      ) : (
        <Input
          value={String(draft?.[name] ?? '')}
          onChange={(event) => draft && setDraft({ ...draft, [name]: event.target.value })}
        />
      )}
    </div>
  );

  return (
    <section className="flex flex-col gap-4" data-testid="fault-manager">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('fault.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('fault.all')}</SelectItem>
            {CATEGORIES.map((entry) => (
              <SelectItem key={entry} value={entry}>{t(categoryKey(entry))}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          {t('fault.add')}
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">{t('fault.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((fault) => (
            <Card key={fault.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{fault.title}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t(categoryKey(fault.category))}</span>
                    {fault.critical ? (
                      <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        <TriangleAlert className="size-3" />
                        {t('fault.critical')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button size="icon" variant="ghost" aria-label={t('action.edit')}
                  onClick={() => { setDraft({ ...fault }); setEditOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label={t('action.delete')}
                  onClick={() => onChange(faults.filter((entry) => entry.id !== fault.id))}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              {fault.symptoms ? <p className="text-sm"><strong>{t('fault.symptoms')}:</strong> {fault.symptoms}</p> : null}
              {fault.checkSteps ? <p className="text-sm"><strong>{t('fault.checkSteps')}:</strong> {fault.checkSteps}</p> : null}
              {fault.immediateMeasures ? <p className="text-sm"><strong>{t('fault.immediate')}:</strong> {fault.immediateMeasures}</p> : null}
              {fault.escalation ? <p className="text-sm text-amber-700"><strong>{t('fault.escalation')}:</strong> {fault.escalation}</p> : null}
              {fault.documentIds.length ? (
                <div className="flex flex-wrap gap-2">
                  {fault.documentIds.map((docId) => {
                    const doc = documents.items.find((entry) => entry.id === docId);
                    return doc ? (
                      <a key={docId} href={`/documents/${docId}`} className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                        <FileText className="size-3" />{doc.title}
                      </a>
                    ) : null;
                  })}
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button size="sm" variant={fault.orderId ? 'outline' : 'default'} onClick={() => toOrder(fault)}>
                  <Hammer className="size-4" />
                  {fault.orderId ? t('fault.openOrder') : t('fault.createOrder')}
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>{draft?.title ? t('fault.edit') : t('fault.add')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {(TEMPLATES.length + otherFaults.length) > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Label>{t('fault.template')}</Label>
                <Select onValueChange={fromTemplate}>
                  <SelectTrigger><SelectValue placeholder={t('fault.template')} /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((entry) => (
                      <SelectItem key={entry.title} value={`tpl:${entry.title}`}>{entry.title}</SelectItem>
                    ))}
                    {otherFaults.map(({ fault, buildingName }) => (
                      <SelectItem key={fault.id} value={`copy:${fault.id}`}>{`${fault.title} · ${buildingName}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.title')}</Label>
                <Input
                  value={draft?.title ?? ''}
                  onChange={(event) => draft && setDraft({ ...draft, title: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('fault.category')}</Label>
                <Select
                  value={draft?.category ?? 'heating'}
                  onValueChange={(value) => draft && setDraft({ ...draft, category: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((entry) => (
                      <SelectItem key={entry} value={entry}>{t(categoryKey(entry))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {field('fault.symptoms', 'symptoms')}
            {field('fault.causes', 'causes')}
            {field('fault.checkSteps', 'checkSteps')}
            {field('fault.immediate', 'immediateMeasures')}
            {field('fault.escalation', 'escalation')}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>{t('fault.supplier')}</Label>
                <Select
                  value={draft?.supplierId || 'none'}
                  onValueChange={(value) => draft && setDraft({ ...draft, supplierId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">–</SelectItem>
                    {suppliers.items.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('fault.asset')}</Label>
                <Select
                  value={draft?.assetId || 'none'}
                  onValueChange={(value) => draft && setDraft({ ...draft, assetId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">–</SelectItem>
                    {buildingAssets.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {documents.items.length ? (
              <div className="flex flex-col gap-2">
                <Label>{t('fault.documents')}</Label>
                <div className="flex flex-col gap-2 rounded-xl border p-3">
                  {documents.items.slice(0, 20).map((doc) => (
                    <label key={doc.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={draft?.documentIds.includes(doc.id) ?? false}
                        onCheckedChange={(checked) =>
                          draft &&
                          setDraft({
                            ...draft,
                            documentIds: checked === true
                              ? [...draft.documentIds, doc.id]
                              : draft.documentIds.filter((id) => id !== doc.id),
                          })
                        }
                      />
                      {doc.title}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <Switch
                checked={draft?.critical ?? false}
                onCheckedChange={(checked) => draft && setDraft({ ...draft, critical: checked })}
              />
              <span>
                {t('fault.critical')}
                <br />
                <span className="text-xs text-muted-foreground">{t('fault.safetyNote')}</span>
              </span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t('action.cancel')}</Button>
            <Button onClick={save} disabled={!draft?.title.trim()}>{t('action.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
