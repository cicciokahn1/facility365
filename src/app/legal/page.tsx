/** Oeffentliche Rechtsseite: AGB und Datenschutzerklaerung. */
import Link from 'next/link';

import { AGB_MD, DPA_MD, PRIVACY_MD } from '@/lib/legal/texts';

/** Schlichte Markdown-zu-HTML-Umwandlung fuer die zwei Rechtstexte. */
const htmlOf = (md: string): string => {
  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return md
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !block.startsWith('>'))
    .map((block) => {
      if (block.startsWith('# '))
        return `<h1 class="text-2xl font-semibold">${escape(block.slice(2))}</h1>`;
      if (block.startsWith('## '))
        return `<h2 class="mt-8 text-lg font-semibold">${escape(block.slice(3))}</h2>`;
      const lines = block.split('\n');
      if (lines.every((line) => line.startsWith('- ')))
        return `<ul class="list-disc space-y-1 pl-6">${lines
          .map((line) => `<li>${escape(line.slice(2))}</li>`)
          .join('')}</ul>`;
      if (lines.every((line) => /^\d+\.\s/.test(line)))
        return `<ol class="list-decimal space-y-1 pl-6">${lines
          .map((line) => `<li>${escape(line.replace(/^\d+\.\s/, ''))}</li>`)
          .join('')}</ol>`;
      return `<p>${escape(block.replace(/\n/g, ' '))}</p>`;
    })
    .join('\n');
};

export default function LegalPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6 leading-relaxed">
      <nav className="text-sm">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Facility365
        </Link>
      </nav>
      <article
        className="flex flex-col gap-3"
        dangerouslySetInnerHTML={{ __html: htmlOf(AGB_MD) }}
      />
      <hr className="my-8" />
      <article
        className="flex flex-col gap-3"
        dangerouslySetInnerHTML={{ __html: htmlOf(PRIVACY_MD) }}
      />
      <hr className="my-8" />
      <article
        className="flex flex-col gap-3"
        dangerouslySetInnerHTML={{ __html: htmlOf(DPA_MD) }}
      />
    </main>
  );
}
