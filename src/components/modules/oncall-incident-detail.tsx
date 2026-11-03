"use client";

/**
 * Detailansicht einer Notfallmeldung / eines Pikett-Einsatzes.
 *
 * Zusaetzlich zur Standard-Detailansicht gibt es den Button
 * «Einsatz erledigen»: nur sichtbar, solange der Einsatz offen ist und der
 * Benutzer schreiben darf. Ein Klick setzt den Status auf «done» und den
 * Abschlusszeitpunkt – ueber die normale Collection-Speicherung
 * (Supabase, RLS-wirksam). Abschlussnotiz, Massnahmen und Material lassen
 * sich jederzeit ueber «Bearbeiten» nachtragen.
 */
import { CheckCircle2 } from "lucide-react";

import { EntityDetail } from "@/components/module/entity-detail";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/auth/scope";
import { useT } from "@/lib/i18n/provider";
import { OncallIncident } from "@/lib/types";

const CLOSED: readonly string[] = ["done", "aborted"];

function OncallDoneButton({
  entity,
  update,
}: {
  entity: OncallIncident;
  update: (values: Partial<OncallIncident>, action?: string) => void;
}) {
  const t = useT();

  if (CLOSED.includes(entity.status)) return null;

  return (
    <Button
      size="lg"
      onClick={() =>
        update(
          {
            status: "done",
            workEndedAt: entity.workEndedAt || new Date().toISOString(),
          },
          "close",
        )
      }
      data-testid="complete-callout"
    >
      <CheckCircle2 className="size-4" aria-hidden />
      {t("oncall.complete.action")}
    </Button>
  );
}

export function OncallIncidentDetail({ id }: { id: string }) {
  const access = useAccess();
  const mayWrite = access.canWrite("oncallincidents");
  return (
    <EntityDetail
      collection="oncallincidents"
      id={id}
      headerExtra={(entity, update) =>
        mayWrite && !entity.deletedAt ? (
          <OncallDoneButton entity={entity} update={update} />
        ) : null
      }
    />
  );
}
