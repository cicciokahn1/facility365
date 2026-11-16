'use client';

/**
 * Notfallblatt einer Liegenschaft zum Aushaengen.
 *
 * Druckt eine A4-Seite mit Logo, Notfall-Telefonliste (Hauswart,
 * Pikett, Standortleitung) und kurzen «Was tun bei…»-Anleitungen.
 * Ohne QR-Code – gedacht fuer Schalter, Keller und Allgemeinflaechen.
 */
import { PhoneCall } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logoOf } from '@/lib/branding/logo';
import { useT } from '@/lib/i18n/provider';
import { useCollectionItems } from '@/lib/data/store';
import { useSettings } from '@/lib/settings/provider';
import { Property } from '@/lib/types';

const CONTACT_ROLES = new Set(['caretaker', 'sitemanager', 'orgadmin']);

export function EmergencySheetButton({ property }: { property: Property }) {
  const t = useT();
  const { settings } = useSettings();
  const users = useCollectionItems('users');

  const contacts = users
    .filter((u) => u.status !== 'inactive' && (CONTACT_ROLES.has(u.role) || u.id === property.oncallUserId))
    .map((u) => ({
      name: u.name,
      role: u.id === property.oncallUserId ? `${t(`role.${u.role}`)} · ${t('emergency.oncall')}` : t(`role.${u.role}`),
      phone: u.phone || u.email,
    }))
    .filter((u) => u.name && u.phone);

  const guides = [
    ['emergency.water', 'emergency.waterText'],
    ['emergency.power', 'emergency.powerText'],
    ['emergency.heating', 'emergency.heatingText'],
    ['emergency.lift', 'emergency.liftText'],
    ['emergency.fire', 'emergency.fireText'],
  ] as const;

  const print = () => {
    const w = window.open('', '_blank', 'width=800,height=1100');
    if (!w) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const address = [property.address?.street, [property.address?.zip, property.address?.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');
    const rows = contacts.length
      ? contacts
          .map(
            (c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td class="tel">${esc(c.phone)}</td></tr>`,
          )
          .join('')
      : `<tr><td colspan="3" class="muted">${esc(t('emergency.noContacts'))}</td></tr>`;
    const items = guides
      .map(([title, text]) => `<div class="case"><h3>${esc(t(title))}</h3><p>${esc(t(text))}</p></div>`)
      .join('');
    w.document.write(`<html><head><title>${esc(t('emergency.sheet'))} – ${esc(property.name)}</title><style>
      @page{margin:18mm}
      body{font-family:system-ui,sans-serif;color:#111;max-width:170mm;margin:auto}
      .head{display:flex;align-items:center;gap:6mm;border-bottom:3px solid #b91c1c;padding-bottom:5mm}
      .head img{max-width:45mm;max-height:16mm;object-fit:contain}
      h1{color:#b91c1c;font-size:24pt;margin:0}
      .sub{margin:2px 0 0;color:#444;font-size:10pt}
      h2{font-size:12pt;text-transform:uppercase;letter-spacing:.06em;color:#333;margin:8mm 0 3mm}
      table{width:100%;border-collapse:collapse}
      td{border:1px solid #ccc;padding:3mm;font-size:11pt}
      td.tel{font-weight:700;white-space:nowrap}
      .case{border:1px solid #ccc;border-radius:3mm;padding:3mm 4mm;margin-bottom:3mm;break-inside:avoid}
      .case h3{margin:0 0 1.5mm;font-size:11.5pt}
      .case p{margin:0;font-size:10.5pt;color:#333;line-height:1.45}
      .muted{color:#777}
      .foot{margin-top:8mm;font-size:9pt;color:#777;display:flex;justify-content:space-between}
      </style></head><body>
      <div class="head">
        <img src="${logoOf(settings.companyLogo)}" alt="" />
        <div><h1>${esc(t('emergency.sheet'))}</h1>
        <p class="sub"><strong>${esc(property.name)}</strong>${address ? ` · ${esc(address)}` : ''}</p></div>
      </div>
      <h2>${esc(t('emergency.phones'))}</h2>
      <table><tbody>${rows}</tbody></table>
      <h2>${esc(t('emergency.what'))}</h2>
      ${items}
      <div class="foot"><span>${esc(settings.companyName)}</span><span>${esc(t('emergency.printed'))} ${new Date().toLocaleDateString('de-CH')}</span></div>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Button variant="outline" size="sm" onClick={print} data-testid="emergency-sheet">
      <PhoneCall className="size-4" aria-hidden />
      {t('emergency.print')}
    </Button>
  );
}
