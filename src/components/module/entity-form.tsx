'use client';

/**
 * Formular eines Moduls.
 *
 * Der Aufbau folgt der Feldbeschreibung des Moduls; alle Module sehen dadurch
 * gleich aus. Auf dem Telefon oeffnet sich das Formular als Vollbild.
 */
import { useState } from 'react';

import { RelationSelect } from '@/components/module/relation-select';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { FieldDef, FormValues, asNumber, asString, isAddressValue } from '@/lib/schema';
import { cn } from '@/lib/utils';

export interface EntityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldDef[];
  initialValues: FormValues;
  onSubmit: (values: FormValues) => void;
}

const addressOf = (value: unknown) =>
  isAddressValue(value) ? value : { street: '', zip: '', city: '', country: 'Schweiz' };

/**
 * Der Inhalt wird nur bei geoeffnetem Dialog eingehaengt; die Eingaben starten
 * dadurch bei jedem Oeffnen frisch, ohne Zuruecksetzen ueber einen Effekt.
 */
export function EntityForm({ open, onOpenChange, ...rest }: EntityFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <FormBody onOpenChange={onOpenChange} {...rest} /> : null}
    </Dialog>
  );
}

function FormBody({
  onOpenChange,
  title,
  fields,
  initialValues,
  onSubmit,
}: Omit<EntityFormProps, 'open'>) {
  const t = useT();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [touched, setTouched] = useState(false);

  const visibleFields = fields.filter((field) => !field.visibleWhen || field.visibleWhen(values));

  const missing = visibleFields
    .filter((field) => field.required && asString(values[field.name]).trim() === '')
    .map((field) => field.name);

  const setValue = (name: string, value: unknown) =>
    setValues((current) => ({ ...current, [name]: value }));

  const submit = () => {
    setTouched(true);
    if (missing.length > 0) return;
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <DialogContent
      data-testid="entity-form"
      className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:w-full"
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleFields.map((field) => {
          const labelKey = field.labelKeyOf ? field.labelKeyOf(values) : field.labelKey;
          const invalid = touched && missing.includes(field.name);
          const fieldId = `field-${field.name}`;
          return (
            <div
              key={field.name}
              className={cn('flex flex-col gap-1.5', field.span === 2 && 'sm:col-span-2')}
            >
              <Label htmlFor={fieldId}>
                {t(labelKey)}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </Label>
              <FieldControl
                field={field}
                id={fieldId}
                values={values}
                onChange={(value) => setValue(field.name, value)}
              />
              {invalid ? (
                <p className="text-xs text-destructive">{t('common.required')}</p>
              ) : field.hintKey ? (
                <p className="text-xs text-muted-foreground">{t(field.hintKey)}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="form-cancel">
          {t('action.cancel')}
        </Button>
        <Button onClick={submit} data-testid="form-save">
          {t('action.save')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FieldControl({
  field,
  id,
  values,
  onChange,
}: {
  field: FieldDef;
  id: string;
  values: FormValues;
  onChange: (value: unknown) => void;
}) {
  const t = useT();
  const raw = values[field.name];

  switch (field.kind) {
    case 'textarea':
      return (
        <Textarea
          id={id}
          rows={3}
          value={asString(raw)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'select':
      return (
        <Select value={asString(raw)} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={t('common.select')} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'relation':
      return (
        <RelationSelect
          id={id}
          collection={field.collection}
          value={asString(raw)}
          onChange={onChange}
          parentKey={field.parentKey}
          parentValue={field.parentValueField ? asString(values[field.parentValueField]) : undefined}
        />
      );
    case 'switch':
      return (
        <div className="flex h-10 items-center">
          <Switch id={id} checked={raw === true} onCheckedChange={onChange} />
        </div>
      );
    case 'address': {
      const address = addressOf(raw);
      return (
        <div className="grid grid-cols-6 gap-2">
          <Input
            id={id}
            className="col-span-6"
            placeholder={t('common.street')}
            value={address.street}
            onChange={(event) => onChange({ ...address, street: event.target.value })}
          />
          <Input
            className="col-span-2"
            placeholder={t('common.zip')}
            inputMode="numeric"
            value={address.zip}
            onChange={(event) => onChange({ ...address, zip: event.target.value })}
          />
          <Input
            className="col-span-4"
            placeholder={t('common.city')}
            value={address.city}
            onChange={(event) => onChange({ ...address, city: event.target.value })}
          />
        </div>
      );
    }
    case 'number':
    case 'money':
      return (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={field.kind === 'money' ? '0.05' : 'any'}
          value={raw === undefined || raw === null ? '' : String(raw)}
          onChange={(event) => onChange(asNumber(event.target.value))}
        />
      );
    case 'date':
      return (
        <Input
          id={id}
          type="date"
          value={asString(raw)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'email':
    case 'tel':
    case 'text':
    default:
      return (
        <Input
          id={id}
          type={field.kind === 'email' ? 'email' : field.kind === 'tel' ? 'tel' : 'text'}
          value={asString(raw)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}
