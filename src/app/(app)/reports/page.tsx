import { ModuleList } from '@/components/module/module-list';

/**
 * Rapporte sind Dokumente, keine offenen Aufgaben: standardmaessig alle
 * zeigen, der Filter «Offen» bleibt fuer Entwuerfe verfuegbar.
 */
export default function ReportPage() {
  return <ModuleList collection="reports" initialStatus="all" />;
}
