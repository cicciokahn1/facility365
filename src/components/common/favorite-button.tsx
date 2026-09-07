"use client";

/** Stern zum Merken eines Datensatzes; speichert nur einen Verweis. */
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMarks } from "@/lib/favorites/use-marks";
import { useT } from "@/lib/i18n/provider";
import { CollectionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  collection,
  id,
  variant = "outline",
}: {
  collection: CollectionKey;
  id: string;
  /** In Listen genuegt der reine Stern ohne Rahmen. */
  variant?: "outline" | "ghost";
}) {
  const t = useT();
  const marks = useMarks();
  const active = marks.isFavorite(collection, id);
  const label = active ? t("favorites.remove") : t("favorites.add");

  return (
    <Button
      variant={variant}
      size="icon"
      type="button"
      aria-pressed={active}
      title={label}
      data-testid="favorite-toggle"
      onClick={(event) => {
        /** In Karten liegt der Stern auf einem Verweis; er darf ihn nicht oeffnen. */
        event.preventDefault();
        event.stopPropagation();
        marks.toggle(collection, id);
      }}
    >
      <Star
        className={cn(
          "size-4",
          active ? "fill-primary text-primary" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
