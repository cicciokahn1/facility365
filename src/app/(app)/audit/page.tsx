import { Suspense } from 'react';

import { AuditView } from '@/components/modules/audit-view';

export default function AuditPage() {
  return (
    <Suspense>
      <AuditView mode="audit" />
    </Suspense>
  );
}
