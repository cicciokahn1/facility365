"use client";

import { CirclePlay } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCollection } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { useCurrentUser } from "@/lib/settings/provider";
import type { EntityOf } from "@/lib/types";
import { isDone, type CompletableKey } from "@/lib/workflow/complete";

export type ProgressableKey =
  | "orders"
  | "damages"
  | "cleaningtasks"
  | "tickets";

const progressable = new Set<ProgressableKey>([
  "orders",
  "damages",
  "cleaningtasks",
  "tickets",
]);

export const isProgressable = (
  collection: CompletableKey,
): collection is ProgressableKey => progressable.has(collection as ProgressableKey);

export function InProgressButton({
  collection,
  id,
  status,
  compact = false,
  className,
}: {
  collection: ProgressableKey;
  id: string;
  status: string;
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const user = useCurrentUser();
  const { update } = useCollection(collection);

  if (status === "inProgress" || isDone(collection, status)) return null;

  return (
    <Button
      size={compact ? "sm" : "lg"}
      variant="outline"
      className={className}
      onClick={() => {
        const values: Partial<EntityOf<ProgressableKey>> = {
          status: "inProgress",
        };
        update(
          id,
          values,
          "history.started",
          user,
        );
        toast.success(t("status.inProgress"));
      }}
      data-testid="mark-in-progress"
    >
      <CirclePlay className="size-4" aria-hidden />
      {t("status.inProgress")}
    </Button>
  );
}
