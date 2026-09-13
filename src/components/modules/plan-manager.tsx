'use client';

/** Gebaeude- und Liegenschaftsplaene: hochladen, ansehen, neue Fassung ablegen. */
import { useRef, useState } from 'react';
import { FileStack, Map, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { PlanViewer, currentVersionOf } from '@/components/modules/plan-viewer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/provider';
import { PLAN_ACCEPT, fileToDataUrl, isAllowedPlan } from '@/lib/media';
import { PLAN_TYPE_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { BuildingFloor, Plan, PlanType, PlanVersion } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

interface Draft {
  title: string;
  type: PlanType;
  floorId: string;
  file: File | null;
}

const emptyDraft = (): Draft => ({ title: '', type: 'floorPlan', floorId: '', file: null });

export function PlanManager({
  plans,
  floors = [],
  onChange,
}: {
  plans: Plan[];
  floors?: BuildingFloor[];
  onChange: (plans: Plan[]) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [viewer, setViewer] = useState<string>('');
  const [versionFor, setVersionFor] = useState<string>('');
  const versionInputRef = useRef<HTMLInputElement>(null);

  const makeVersion = async (file: File, version: number): Promise<PlanVersion> => ({
    id: newId('planv'),
    version,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    url: await fileToDataUrl(file),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: settings.profileName || settings.companyName,
    note: '',
  });

  const savePlan = async () => {
    if (!draft?.file || !draft.title.trim()) return;
    if (!isAllowedPlan(draft.file)) {
      toast.error(t('plan.wrongType'));
      return;
    }
    const version = await makeVersion(draft.file, 1);
    onChange([
      ...plans,
      {
        id: newId('plan'),
        title: draft.title.trim(),
        type: draft.type,
        floorId: draft.floorId,
        versions: [version],
        currentVersionId: version.id,
        markers: [],
        layers: [{ id: newId('layer'), name: 'Standard', visible: true }],
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft(null);
    toast.success(t('toast.saved'));
  };

  const addVersion = async (files: FileList | null) => {
    const file = files?.[0];
    const plan = plans.find((entry) => entry.id === versionFor);
    if (!file || !plan) return;
    if (!isAllowedPlan(file)) {
      toast.error(t('plan.wrongType'));
      return;
    }
    const version = await makeVersion(file, plan.versions.length + 1);
    onChange(
      plans.map((entry) =>
        entry.id === plan.id
          ? { ...entry, versions: [...entry.versions, version], currentVersionId: version.id }
          : entry,
      ),
    );
    setVersionFor('');
    toast.success(t('plan.versionAdded'));
  };

  const openPlan = plans.find((plan) => plan.id === viewer);

  return (
    <section className="flex flex-col gap-3" data-testid="plan-manager">
      <div>
        <Button variant="outline" onClick={() => setDraft(emptyDraft())} data-testid="plan-add">
          <Plus className="size-4" aria-hidden />
          {t('plan.new')}
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Map} titleKey="plan.empty" textKey="plan.allowed" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const version = currentVersionOf(plan);
            const typeLabel = PLAN_TYPE_OPTIONS.find((option) => option.value === plan.type);
            const floor = floors.find((entry) => entry.id === plan.floorId);
            return (
              <li key={plan.id} className="flex flex-col rounded-xl border bg-card p-4" data-testid="plan-item">
                <p className="truncate font-medium">{plan.title}</p>
                <p className="text-sm text-muted-foreground">
                  {typeLabel ? t(typeLabel.labelKey) : ''}
                  {floor ? ` · ${floor.name}` : ''}
                </p>
                {version ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('plan.version')} {version.version} · {formatBytes(version.size)} ·{' '}
                    {formatDate(version.uploadedAt, settings.language)}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setViewer(plan.id)} data-testid="plan-open">
                    {t('action.preview')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setVersionFor(plan.id);
                      versionInputRef.current?.click();
                    }}
                  >
                    <FileStack className="size-4" aria-hidden />
                    {t('plan.newVersion')}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('action.delete')}
                    onClick={() => onChange(plans.filter((entry) => entry.id !== plan.id))}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={versionInputRef}
        type="file"
        accept={PLAN_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void addVersion(event.target.files);
          event.target.value = '';
        }}
      />

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('plan.new')}</DialogTitle>
            <DialogDescription>{t('plan.allowed')}</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.title')}</Label>
                <Input
                  data-testid="plan-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('plan.type')}</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) => setDraft({ ...draft, type: value as PlanType })}
                >
                  <SelectTrigger className="w-full" data-testid="plan-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {floors.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <Label>{t('common.floor')}</Label>
                  <Select
                    value={draft.floorId || 'none'}
                    onValueChange={(value) =>
                      setDraft({ ...draft, floorId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none')}</SelectItem>
                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <Label>{t('common.file')}</Label>
                <Input
                  type="file"
                  accept={PLAN_ACCEPT}
                  data-testid="plan-file"
                  onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] ?? null })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={() => void savePlan()} data-testid="plan-save">
              <Upload className="size-4" aria-hidden />
              {t('action.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {openPlan ? (
        <PlanViewer
          plan={openPlan}
          open={viewer !== ''}
          onOpenChange={(open) => !open && setViewer('')}
          onChange={(updated) =>
            onChange(plans.map((entry) => (entry.id === updated.id ? updated : entry)))
          }
        />
      ) : null}
    </section>
  );
}
