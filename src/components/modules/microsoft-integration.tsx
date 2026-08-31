'use client';

/**
 * Microsoft 365: Verbindung, Outlook-Nachrichten und Terminabgleich.
 *
 * Die Seite ist zugleich die Rueckkehradresse der Anmeldung bei Microsoft.
 * Ohne hinterlegte Verzeichnis- und Anwendungskennung bleibt alles so, wie es
 * ohne Microsoft 365 war - die bestehende Anmeldung von Facility365 wird nicht
 * angetastet.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarSync, Inbox, Link2, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAccess } from '@/lib/auth/scope';
import { useCollectionItems } from '@/lib/data/store';
import {
  GraphConfig,
  GraphSession,
  completeMicrosoftSignIn,
  graphConfigured,
  rememberAccount,
  sessionSnapshot,
  signOutMicrosoft,
  startMicrosoftSignIn,
  subscribeSession,
} from '@/lib/integrations/microsoft/auth';
import { GraphEvent, GraphMessage, graphAccount, listMessages } from '@/lib/integrations/microsoft/graph';
import { SyncResult, useMicrosoftSync } from '@/lib/integrations/microsoft/sync';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Order, Priority } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

const NONE = 'none';
const SYNC_DAYS = 90;

/** Fehler von Microsoft werden nie im Klartext gezeigt. */
const errorKey = (error: unknown): 'ms.errorSignedOut' | 'ms.errorDenied' | 'ms.errorRequest' => {
  const message = error instanceof Error ? error.message : '';
  if (message === 'signedOut') return 'ms.errorSignedOut';
  if (message === 'denied') return 'ms.errorDenied';
  return 'ms.errorRequest';
};

export function MicrosoftIntegration() {
  const t = useT();
  const router = useRouter();
  const access = useAccess();
  const { settings, save } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const users = useCollectionItems('users');

  const config = useMemo<GraphConfig>(
    () => ({
      tenantId: settings.microsoftTenantId ?? '',
      clientId: settings.microsoftClientId ?? '',
    }),
    [settings.microsoftClientId, settings.microsoftTenantId],
  );
  const configured = graphConfigured(config);
  const canWrite = access.canWrite('microsoft');

  const [tenantId, setTenantId] = useState(config.tenantId);
  const [clientId, setClientId] = useState(config.clientId);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [result, setResult] = useState<SyncResult | null>(null);

  const sync = useMicrosoftSync(config);

  /** Stand der Anmeldung und Umleitungsadresse kommen aus dem Browser. */
  const raw = useSyncExternalStore(subscribeSession, sessionSnapshot, () => null);
  const session = useMemo(() => (raw ? (JSON.parse(raw) as GraphSession) : null), [raw]);
  const connected = Boolean(session);
  const account = session?.account ?? '';
  const redirect = useSyncExternalStore(
    subscribeSession,
    () => `${window.location.origin}/microsoft`,
    () => '',
  );

  /** Rueckkehr von der Anmeldemaske: Code einloesen und Adresse bereinigen. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || !graphConfigured(config)) return;
    void completeMicrosoftSignIn(config, code)
      .then(async () => {
        const me = await graphAccount(config);
        rememberAccount(me.displayName || me.mail);
        toast.success(t('ms.connected'));
      })
      .catch(() => toast.error(t('ms.errorRequest')))
      .finally(() => router.replace('/microsoft'));
  }, [config, router, t]);

  const saveConfig = () => {
    save({ ...settings, microsoftTenantId: tenantId.trim(), microsoftClientId: clientId.trim() });
    toast.success(t('toast.saved'));
  };

  const connect = async () => {
    try {
      await startMicrosoftSignIn(config);
    } catch {
      toast.error(t('ms.errorRequest'));
    }
  };

  const disconnect = () => {
    signOutMicrosoft();
    setMessages([]);
    setResult(null);
  };

  const loadMessages = useCallback(async () => {
    setBusy(true);
    try {
      const folder = settings.microsoftMailFolder || 'inbox';
      setMessages(await listMessages(config, folder, 25));
    } catch (error) {
      toast.error(t(errorKey(error)));
    } finally {
      setBusy(false);
    }
  }, [config, settings.microsoftMailFolder, t]);

  const runSync = useCallback(async () => {
    setBusy(true);
    try {
      const outcome = await sync.syncCalendar(SYNC_DAYS);
      setResult(outcome);
      toast.success(
        `${t('ms.syncDone')}: ${outcome.pushed} / ${outcome.updatedInOutlook} / ${outcome.pulled}`,
      );
    } catch (error) {
      toast.error(t(errorKey(error)));
    } finally {
      setBusy(false);
    }
  }, [sync, t]);

  /**
   * Automatischer Abgleich beim Oeffnen, wenn er eingeschaltet ist.
   *
   * Der Abgleich startet nach dem ersten Zeichnen, damit die Seite sofort
   * sichtbar ist; er laeuft nur beim Verbinden, nicht bei jeder Aenderung im
   * Datenbestand.
   */
  useEffect(() => {
    if (!connected || !settings.microsoftSyncCalendar) return undefined;
    const timer = window.setTimeout(() => void runSync(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, settings.microsoftSyncCalendar]);

  const openOrder = (order: Order) => router.push(`/orders/${order.id}`);

  const takeEvent = (event: GraphEvent) => {
    const created = sync.orderFromEvent(event);
    toast.success(`${t('ms.orderCreated')} ${created.number}`);
    setResult((current) =>
      current ? { ...current, open: current.open.filter((item) => item.id !== event.id) } : current,
    );
  };

  if (!access.canRead('microsoft')) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" aria-hidden />
            {t('ms.connection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('ms.intro')}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ms-tenant">{t('ms.tenantId')}</Label>
              <Input
                id="ms-tenant"
                value={tenantId}
                disabled={!canWrite}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ms-client">{t('ms.clientId')}</Label>
              <Input
                id="ms-client"
                value={clientId}
                disabled={!canWrite}
                onChange={(event) => setClientId(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ms-folder">{t('ms.mailFolder')}</Label>
              <Select
                value={settings.microsoftMailFolder || 'inbox'}
                disabled={!canWrite}
                onValueChange={(value) => save({ ...settings, microsoftMailFolder: value })}
              >
                <SelectTrigger id="ms-folder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbox">{t('ms.folderInbox')}</SelectItem>
                  <SelectItem value="archive">{t('ms.folderArchive')}</SelectItem>
                  <SelectItem value="sentitems">{t('ms.folderSent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <Switch
                id="ms-auto"
                checked={settings.microsoftSyncCalendar ?? false}
                disabled={!canWrite}
                onCheckedChange={(checked) =>
                  save({ ...settings, microsoftSyncCalendar: checked })
                }
              />
              <Label htmlFor="ms-auto">{t('ms.autoSync')}</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('ms.redirectHint')} <code>{redirect}</code>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {canWrite ? (
              <Button variant="outline" onClick={saveConfig}>
                {t('action.save')}
              </Button>
            ) : null}
            {connected ? (
              <Button variant="outline" onClick={disconnect}>
                <LogOut className="size-4" aria-hidden />
                {t('ms.disconnect')}
              </Button>
            ) : (
              <Button onClick={connect} disabled={!configured || !canWrite}>
                {t('ms.connect')}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {connected ? `${t('ms.connected')}${account ? ` · ${account}` : ''}` : t('ms.notConnected')}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="size-4 text-primary" aria-hidden />
            {t('ms.mails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={loadMessages} disabled={!connected || busy}>
              <RefreshCw className="size-4" aria-hidden />
              {t('ms.loadMails')}
            </Button>
            <span className="text-sm text-muted-foreground">{t('ms.mailsHint')}</span>
          </div>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('ms.noMails')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {messages.map((message) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  properties={properties.map((item) => ({ id: item.id, name: item.name }))}
                  buildings={buildings.map((item) => ({
                    id: item.id,
                    name: item.name,
                    propertyId: item.propertyId,
                  }))}
                  rooms={rooms.map((item) => ({
                    id: item.id,
                    name: item.name,
                    buildingId: item.buildingId,
                  }))}
                  users={users.map((item) => ({ id: item.id, name: item.name }))}
                  disabled={!canWrite}
                  onCreate={async (values) => {
                    try {
                      const created = await sync.orderFromMessage(message, values);
                      toast.success(`${t('ms.orderCreated')} ${created.number}`);
                      setMessages((current) =>
                        current.filter((item) => item.id !== message.id),
                      );
                      openOrder(created);
                    } catch (error) {
                      toast.error(t(errorKey(error)));
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarSync className="size-4 text-primary" aria-hidden />
            {t('ms.calendar')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('ms.calendarHint')}</p>
          <div>
            <Button onClick={runSync} disabled={!connected || busy || !canWrite}>
              <CalendarSync className="size-4" aria-hidden />
              {t('ms.syncNow')}
            </Button>
          </div>
          {result ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <Figure label={t('ms.pushed')} value={result.pushed} />
              <Figure label={t('ms.updatedOutlook')} value={result.updatedInOutlook} />
              <Figure label={t('ms.pulled')} value={result.pulled} />
            </div>
          ) : null}
          {result && result.open.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t('ms.openEvents')}</p>
              <ul className="flex flex-col gap-2">
                {result.open.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{event.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[formatDate(event.date, settings.language), event.time, event.location]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canWrite}
                      onClick={() => takeEvent(event)}
                    >
                      {t('ms.takeEvent')}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

interface Choice {
  id: string;
  name: string;
}

interface MessageRowProps {
  message: GraphMessage;
  properties: Choice[];
  buildings: (Choice & { propertyId: string })[];
  rooms: (Choice & { buildingId: string })[];
  users: Choice[];
  disabled: boolean;
  onCreate: (values: Partial<Order>) => void;
}

/** Eine Nachricht mit den Feldern, die der Auftrag zusaetzlich braucht. */
function MessageRow({
  message,
  properties,
  buildings,
  rooms,
  users,
  disabled,
  onCreate,
}: MessageRowProps) {
  const t = useT();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(message.subject);
  const [propertyId, setPropertyId] = useState(NONE);
  const [buildingId, setBuildingId] = useState(NONE);
  const [roomId, setRoomId] = useState(NONE);
  const [userId, setUserId] = useState(NONE);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [workStart, setWorkStart] = useState('');

  const buildingChoices =
    propertyId === NONE ? buildings : buildings.filter((item) => item.propertyId === propertyId);
  const roomChoices =
    buildingId === NONE ? rooms : rooms.filter((item) => item.buildingId === buildingId);

  const create = () => {
    const responsible = users.find((item) => item.id === userId);
    onCreate({
      title,
      propertyId: propertyId === NONE ? '' : propertyId,
      buildingId: buildingId === NONE ? '' : buildingId,
      roomId: roomId === NONE ? '' : roomId,
      assigneeUserId: responsible?.id ?? '',
      assignee: responsible?.name ?? '',
      priority,
      dueDate,
      workStart,
    });
  };

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{message.subject || t('ms.noSubject')}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[message.fromName || message.fromAddress, formatDate(message.receivedAt.slice(0, 10), settings.language)]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{message.preview}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>
          {t('ms.toOrder')}
        </Button>
      </div>
      {!open ? null : (
        <div className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label>{t('common.title')}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('module.properties.singular')}</Label>
            <Select
              value={propertyId}
              onValueChange={(value) => {
                setPropertyId(value);
                setBuildingId(NONE);
                setRoomId(NONE);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                {properties.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('module.buildings.singular')}</Label>
            <Select
              value={buildingId}
              onValueChange={(value) => {
                setBuildingId(value);
                setRoomId(NONE);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                {buildingChoices.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('module.rooms.singular')}</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                {roomChoices.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('user.assignee')}</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                {users.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.dueDate')}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('ms.time')}</Label>
            <Input
              type="time"
              value={workStart}
              onChange={(event) => setWorkStart(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('common.priority')}</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('priority.low')}</SelectItem>
                <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                <SelectItem value="high">{t('priority.high')}</SelectItem>
                <SelectItem value="critical">{t('priority.critical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button onClick={create} disabled={disabled}>
              {t('ms.createOrder')}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
