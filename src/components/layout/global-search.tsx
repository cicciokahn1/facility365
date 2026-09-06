'use client';

/** Globale Suche ueber alle Module (Tastenkuerzel Strg/Cmd + K). */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';

import { useT } from '@/lib/i18n/provider';

/** Die Suchdaten werden erst geladen, wenn die Suche wirklich geoeffnet wird. */
const SearchDialog = dynamic(
  () => import('@/components/layout/search-dialog').then((module) => module.SearchDialog),
  { ssr: false },
);

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        data-testid="global-search-trigger"
        onClick={() => setOpen(true)}
        aria-label={t('action.search')}
        className="flex items-center justify-center gap-2 rounded-lg text-sm text-muted-foreground max-lg:size-9 lg:h-10 lg:w-full lg:max-w-sm lg:justify-start lg:border lg:bg-card lg:px-3"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden truncate lg:inline">{t('list.searchPlaceholder')}</span>
      </button>
      {open ? (
        <SearchDialog open={open} onOpenChange={setOpen} onSelect={(path) => router.push(path)} />
      ) : null}
    </>
  );
}
