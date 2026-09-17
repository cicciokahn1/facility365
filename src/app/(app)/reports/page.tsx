'use client';

import { useSearchParams } from 'next/navigation';

import { ModuleList } from '@/components/module/module-list';
import { QuickWorkTime } from '@/components/modules/quick-work-time';

export default function ReportPage() {
  const searchParams = useSearchParams();
  if (searchParams.get('workTime') === '1') return <QuickWorkTime />;
  return <ModuleList collection="reports" />;
}
