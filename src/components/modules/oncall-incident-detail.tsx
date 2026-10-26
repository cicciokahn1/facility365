"use client";

/**
 * Detailansicht einer Notfallmeldung / eines Pikett-Einsatzes.
 *
 * Zusaetzlich zur Standard-Detailansicht gibt es den Button
 * «Einsatz erledigen»: nur sichtbar, solange der Einsatz offen ist und der
 * Benutzer schreiben darf. Der Dialog verlangt eine Abschlussnotiz, nimmt
 * Massnahmen und optionales Material auf und setzt den Status auf «done» –
 * ueber die normale Collection-Speicherung (Supabase, RLS-wirksam).
 */
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { EntityDetail } from "@/components/module/entity-detail";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [open, setOpen] = useState(false);
  const [closingNote, setClosingNote] = useState(entity.closingNote);
  const [measures, setMeasures] = useState(entity.measures);
  const [materialUsed, setMaterialUsed] = useState(entity.materialUsed);
  const [error, setError] = useState("");

  if (CLOSED.includes(entity.status)) return null;

  const confirm = () => {
    if (!closingNote.trim()) {
      setError(t("oncall.complete.closingNoteRequired"));
      return;
    }
    update(
      {
        status: "done",
        closingNote: closingNote.trim(),
        measures: measures.trim(),
        materialUsed: materialUsed.trim(),
        workEndedAt: entity.workEndedAt || new Date().toISOString(),
      },
      "close",
    );
    setOpen(false);
  };

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)} data-testid="complete-callout">
        <CheckCircle2 className="size-4" aria-hidden />
        {t("oncall.complete.action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("oncall.complete.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("oncall.closingNote")} *</Label>
              <Textarea
                rows={3}
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("oncall.measures")}</Label>
              <Textarea
                rows={3}
                value={measures}
                onChange={(e) => setMeasures(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("oncall.materialUsed")}</Label>
              <Textarea
                rows={2}
                value={materialUsed}
                onChange={(e) => setMaterialUsed(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={confirm} className="w-full">
              {t("oncall.complete.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
