import { Suspense } from 'react';

import { AuditView } from '@/components/modules/audit-view';

export default function WalkthroughPage() {
  return (
    <Suspense>
      <AuditView mode="walkthrough" />
    </Suspense>
  );
}
