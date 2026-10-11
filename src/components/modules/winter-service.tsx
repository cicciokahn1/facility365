'use client';

/**
 * Winterdienst eines Aussenbereichs.
 *
 * Planung (Einsatzgebiet, Zustaendigkeit, Kontrollrhythmus) und Einsaetze
 * liegen direkt beim Aussenbereich. Streumittel kommen aus dem Lager und
 * werden dort abgebucht, Maengel werden als Auftrag weiterverfolgt.
 */
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, ClipboardList, Snowflake } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { currentActor } from '@/lib/data/actor';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { photoFromFile } from '@/lib/media';
import { titleOfEntity } from '@/lib/module-config';
import { useSettings } from '@/lib/settings/provider';
import type { OutdoorArea, Photo, WinterLog, WinterLogKind } from '@/lib/types';
import { formatDate, today } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

const KINDS: WinterLogKind[] = ['check', 'clearing', 'gritting'];

const nowTime = (): string => new Date().toTimeString().slice(0, 5);

const addDays = (date: string, days: number): string => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const selectClass = 'h-11 w-full rounded-md border bg-background px-3 text-sm';

export function WinterService({ area }: { area: OutdoorArea }) {
  const t = useT();
  const { settings } = useSettings();
  const areas = useCollection('outdoorAreas');
  const stock = useCollection('stock');
  const orders = useCollection('orders');
  const users = useCollectionItems('users');
  const photoInput = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<WinterLogKind>('check');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [weather, setWeather] = useState('');
  const [work, setWork] = useState('');
  const [stockItemId, setStockItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [orderId, setOrderId] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);

  const logs = [...(area.winterLogs ?? [])].sort((a, b) =>
    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
  );
  const areaOrders = orders.items.filter(
    (order) =>
      !order.deletedAt &&
      (order.outdoorAreaId === area.id || (area.propertyId && order.propertyId === area.propertyId)),
  );
  const material = stock.items.find((item) => item.id === stockItemId);

  const setPlan = (values: Partial<OutdoorArea>) => areas.update(area.id, values);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const added = await Promise.all(Array.from(files).map((file) => photoFromFile(file)));
    setPhotos((current) => [...current, ...added]);
  };

  const createOrder = () => {
    const order = orders.create({
      title: `${t('tab.winter')}: ${remarks.split('\n')[0] || area.name}`,
      description: remarks,
      propertyId: area.propertyId,
      buildingId: area.buildingId,
      outdoorAreaId: area.id,
      dueDate: today(),
    });
    setOrderId(order.id);
    toast.success(order.number);
  };

  const save = () => {
    const used = Number(quantity.replace(',', '.')) || 0;
    const log: WinterLog = {
      id: newId('winter'),
      kind,
      date,
      time,
      weather,
      work,
      stockItemId: material?.id ?? '',
      materialName: material?.title ?? '',
      materialQuantity: material ? used : 0,
      materialUnit: material?.unit ?? '',
      photos,
      remarks,
      orderId,
      doneBy: currentActor().name,
    };
    const interval = area.winterIntervalDays ?? 0;
    areas.update(
      area.id,
      {
        winterLogs: [...(area.winterLogs ?? []), log],
        ...(interval > 0 ? { winterNextCheck: addDays(date, interval) } : {}),
      },
      'winter.saved',
    );
    if (material && used > 0) {
      stock.update(material.id, { quantity: Math.max(0, (material.quantity ?? 0) - used) });
    }
    setWeather('');
    setWork('');
    setQuantity('');
    setRemarks('');
    setOrderId('');
    setPhotos([]);
    setTime(nowTime());
    toast.success(t('winter.saved'));
  };

  return (
    <div className="flex flex-col gap-4" data-testid="winter-service">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="size-4 text-primary" aria-hidden />
            {t('winter.plan')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 sm:col-span-2">
            <span className="text-sm">{t('winter.active')}</span>
            <Switch
              checked={area.winterActive === true}
              onCheckedChange={(checked) =>
                setPlan({
                  winterActive: checked,
                  winterNextCheck: checked ? area.winterNextCheck || today() : area.winterNextCheck,
                })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.zone')}
            <Input
              defaultValue={area.winterZone ?? ''}
              onBlur={(event) => setPlan({ winterZone: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.responsible')}
            <select
              className={selectClass}
              value={area.winterUserId ?? ''}
              onChange={(event) => setPlan({ winterUserId: event.target.value })}
            >
              <option value="">–</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {titleOfEntity('users', user)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.interval')}
            <Input
              type="number"
              min={0}
              defaultValue={area.winterIntervalDays ?? 0}
              onBlur={(event) => setPlan({ winterIntervalDays: Number(event.target.value) || 0 })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.nextCheck')}
            <Input
              type="date"
              value={area.winterNextCheck ?? ''}
              onChange={(event) => setPlan({ winterNextCheck: event.target.value })}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('winter.newLog')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((entry) => (
              <Button
                key={entry}
                type="button"
                variant={kind === entry ? 'default' : 'outline'}
                className="h-12 whitespace-normal text-xs sm:text-sm"
                onClick={() => setKind(entry)}
              >
                {t(`winter.kind.${entry}`)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t('common.date')}
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('winter.time')}
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.weather')}
            <Input value={weather} onChange={(event) => setWeather(event.target.value)} placeholder="−3 °C, Schneefall" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.work')}
            <Textarea value={work} onChange={(event) => setWork(event.target.value)} rows={2} />
          </label>
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t('winter.material')}
              <select
                className={selectClass}
                value={stockItemId}
                onChange={(event) => setStockItemId(event.target.value)}
              >
                <option value="">{t('common.none')}</option>
                {stock.items
                  .filter((item) => !item.deletedAt)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.quantity ?? 0} {item.unit})
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('winter.quantity')}
              <Input
                inputMode="decimal"
                value={quantity}
                disabled={!material}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder={material?.unit ?? ''}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            {t('winter.remarks')}
            <Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={2} />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <select
              className={selectClass}
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              aria-label={t('winter.order')}
            >
              <option value="">{t('winter.order')}: –</option>
              {areaOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.number} · {order.title}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" className="h-11" onClick={createOrder}>
              <ClipboardList className="size-4" aria-hidden />
              {t('winter.createOrder')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-11" onClick={() => photoInput.current?.click()}>
              <Camera className="size-4" aria-hidden />
              {t('winter.addPhoto')}
            </Button>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(event) => {
                void addPhotos(event.target.files);
                event.target.value = '';
              }}
            />
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={photo.url} alt="" className="size-12 rounded object-cover" />
            ))}
          </div>
          <Button className="h-12" onClick={save} data-testid="winter-save">
            {t('action.save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('winter.history')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('winter.noLogs')}</p>
          ) : (
            logs.map((log) => {
              const order = orders.items.find((entry) => entry.id === log.orderId);
              return (
                <div key={log.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{t(`winter.kind.${log.kind}`)}</span>
                    <span className="text-muted-foreground">
                      {formatDate(log.date, settings.language)} {log.time}
                    </span>
                  </div>
                  {log.weather ? <p className="text-muted-foreground">{log.weather}</p> : null}
                  {log.work ? <p className="mt-1 whitespace-pre-line">{log.work}</p> : null}
                  {log.materialName ? (
                    <p className="mt-1">
                      {t('winter.material')}: {log.materialName} · {log.materialQuantity} {log.materialUnit}
                    </p>
                  ) : null}
                  {log.remarks ? <p className="mt-1 whitespace-pre-line">{log.remarks}</p> : null}
                  {order ? (
                    <Link className="mt-1 inline-block text-primary underline" href={`/orders/${order.id}`}>
                      {order.number} · {order.title}
                    </Link>
                  ) : null}
                  {log.photos.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {log.photos.map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={photo.id} src={photo.url} alt="" className="size-16 rounded object-cover" />
                      ))}
                    </div>
                  ) : null}
                  {log.doneBy ? <p className="mt-1 text-xs text-muted-foreground">{log.doneBy}</p> : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
