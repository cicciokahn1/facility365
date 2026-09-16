'use client';

import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

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
import { PACKAGE_KEYS, packageLabelKey, packagePrice } from '@/lib/packages/packages';
import { useT } from '@/lib/i18n/provider';
import { Customer, IndustryPackage } from '@/lib/types';
import { useSettings } from '@/lib/settings/provider';
import { formatMoney } from '@/lib/utils/format';

export function Facility365RequestDialog({ customer }: { customer: Customer }) {
  const t = useT();
  const { settings } = useSettings();
  const primary = customer.contacts.find((contact) => contact.primary) ?? customer.contacts[0];
  const [open, setOpen] = useState(false);
  const [organization, setOrganization] = useState(customer.name);
  const [contact, setContact] = useState(
    [primary?.firstName, primary?.lastName].filter(Boolean).join(' '),
  );
  const [email, setEmail] = useState(primary?.email || customer.email);
  const [phone, setPhone] = useState(primary?.phone || primary?.mobile || customer.phone);
  const [selectedPackage, setSelectedPackage] = useState<Exclude<IndustryPackage, '' | 'custom'>>(
    'professional',
  );

  const packageOptions = useMemo(
    () => PACKAGE_KEYS.filter((key): key is Exclude<IndustryPackage, '' | 'custom'> => Boolean(key) && key !== 'custom'),
    [],
  );

  const submit = () => {
    if (!organization.trim() || !contact.trim() || !email.trim() || !phone.trim()) {
      toast.error(t('customer.requestRequired'));
      return;
    }
    if (!settings.companyEmail.trim()) {
      toast.error(t('customer.requestEmailMissing'));
      return;
    }
    const price = packagePrice(selectedPackage)?.yearly;
    const packageName = t(packageLabelKey(selectedPackage));
    const subject = `Facility365 Anfrage – ${organization.trim()}`;
    const body = [
      'Facility365 Anfrage',
      '',
      `Organisation: ${organization.trim()}`,
      `Ansprechperson: ${contact.trim()}`,
      `E-Mail: ${email.trim()}`,
      `Telefon: ${phone.trim()}`,
      `Gewünschtes Paket: ${packageName}${price === undefined ? ' (individuell)' : ` (${formatMoney(price)} / Jahr)`}`,
    ].join('\n');
    window.location.href = `mailto:${settings.companyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
  };

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)} data-testid="facility365-request">
        <Send className="size-4" aria-hidden />
        {t('customer.requestFacility365')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('customer.requestFacility365')}</DialogTitle>
            <DialogDescription>{t('customer.requestHint')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label={t('customer.companyName')}>
              <Input value={organization} onChange={(event) => setOrganization(event.target.value)} />
            </Field>
            <Field label={t('supplier.contactPerson')}>
              <Input value={contact} onChange={(event) => setContact(event.target.value)} />
            </Field>
            <Field label={t('common.email')}>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label={t('common.phone')}>
              <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label={t('customer.desiredPackage')}>
              <select
                value={selectedPackage}
                onChange={(event) => setSelectedPackage(event.target.value as typeof selectedPackage)}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              >
                {packageOptions.map((key) => (
                  <option key={key} value={key}>
                    {t(packageLabelKey(key))} ·{' '}
                    {packagePrice(key)?.yearly === undefined
                      ? t('settings.individualPrice')
                      : `${formatMoney(packagePrice(key)?.yearly ?? 0)} / Jahr`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={submit} data-testid="facility365-request-submit">
              <Send className="size-4" aria-hidden />
              {t('customer.sendRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
