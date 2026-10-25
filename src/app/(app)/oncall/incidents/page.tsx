import { Suspense } from "react";

import { OncallIncidents } from "@/components/modules/oncall-incidents";

export default function OncallIncidentsPage() {
  return (
    <Suspense>
      <OncallIncidents />
    </Suspense>
  );
}
