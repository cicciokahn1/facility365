'use client';

/** Ansprechpartner eines Kunden. */
import { useState } from 'react';
import { Mail, Phone, Plus, Star, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
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
import { useT } from '@/lib/i18n/provider';
import { Contact } from '@/lib/types';
import { newId } from '@/lib/utils/id';

const emptyContact = (): Contact => ({
  id: '',
  firstName: '',
  lastName: '',
  role: '',
  phone: '',
  mobile: '',
  email: '',
  primary: false,
});

export function ContactEditor({
  contacts,
  onChange,
}: {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<Contact | null>(null);

  const save = () => {
    if (!draft || !draft.lastName.trim()) return;
    if (draft.id) {
      onChange(contacts.map((entry) => (entry.id === draft.id ? draft : entry)));
    } else {
      onChange([...contacts, { ...draft, id: newId('contact') }]);
    }
    setDraft(null);
  };

  const setPrimary = (id: string) =>
    onChange(contacts.map((entry) => ({ ...entry, primary: entry.id === id })));

  return (
    <section className="flex flex-col gap-3" data-testid="contact-editor">
      <div>
        <Button variant="outline" onClick={() => setDraft(emptyContact())} data-testid="contact-add">
          <Plus className="size-4" aria-hidden />
          {t('customer.addContact')}
        </Button>
      </div>

      {contacts.length === 0 ? (
        <EmptyState titleKey="customer.noContacts" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <li key={contact.id} className="rounded-xl border bg-card p-4" data-testid="contact-item">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{contact.role}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('customer.primaryContact')}
                    onClick={() => setPrimary(contact.id)}
                  >
                    <Star
                      className={
                        contact.primary ? 'size-4 fill-warning text-warning' : 'size-4 text-muted-foreground'
                      }
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('action.delete')}
                    onClick={() => onChange(contacts.filter((entry) => entry.id !== contact.id))}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {contact.phone || contact.mobile ? (
                  <a
                    href={`tel:${contact.mobile || contact.phone}`}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Phone className="size-4" aria-hidden />
                    {contact.mobile || contact.phone}
                  </a>
                ) : null}
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 truncate text-muted-foreground"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{contact.email}</span>
                  </a>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => setDraft(contact)}>
                {t('action.edit')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('customer.addContact')}</DialogTitle>
            <DialogDescription className="sr-only">{t('customer.addContact')}</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('customer.firstName')}>
                <Input
                  value={draft.firstName}
                  onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
                />
              </Field>
              <Field label={t('customer.lastName')}>
                <Input
                  data-testid="contact-lastname"
                  value={draft.lastName}
                  onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
                />
              </Field>
              <Field label={t('customer.contactRole')}>
                <Input
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                />
              </Field>
              <Field label={t('common.phone')}>
                <Input
                  type="tel"
                  value={draft.phone}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                />
              </Field>
              <Field label={t('common.mobile')}>
                <Input
                  type="tel"
                  value={draft.mobile}
                  onChange={(event) => setDraft({ ...draft, mobile: event.target.value })}
                />
              </Field>
              <Field label={t('common.email')}>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                />
              </Field>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={save} data-testid="contact-save">
              {t('action.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
