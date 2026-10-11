/** Doppelte Lieferanten erkennen: gleicher Name, gleiche E-Mail oder Telefonnummer. */
import type { Supplier } from '@/lib/types';

const normName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\b(ag|gmbh|sa|sàrl|sarl|kg|co)\b/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');

const normPhone = (value: string): string => value.replace(/\D+/g, '').replace(/^(0041|41)/, '0');

export const duplicateSuppliers = (
  suppliers: Supplier[],
  candidate: Partial<Pick<Supplier, 'name' | 'email' | 'phone' | 'mobile'>>,
  ownId = '',
): Supplier[] => {
  const name = normName(candidate.name ?? '');
  const email = (candidate.email ?? '').trim().toLowerCase();
  const phones = [candidate.phone ?? '', candidate.mobile ?? '']
    .map(normPhone)
    .filter((phone) => phone.length >= 9);
  return suppliers.filter((supplier) => {
    if (supplier.id === ownId || supplier.deletedAt) return false;
    if (name && normName(supplier.name) === name) return true;
    if (email && supplier.email.trim().toLowerCase() === email) return true;
    return [supplier.phone, supplier.mobile]
      .map(normPhone)
      .some((phone) => phone.length >= 9 && phones.includes(phone));
  });
};
