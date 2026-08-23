import { ModuleList } from '@/components/module/module-list';
import { DocumentExpiry } from '@/components/modules/document-expiry';

export default function DocumentPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocumentExpiry />
      <ModuleList collection="documents" />
    </div>
  );
}
