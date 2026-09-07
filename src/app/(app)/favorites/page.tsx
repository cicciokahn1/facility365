"use client";

/**
 * Meine Favoriten.
 *
 * Zeigt gemerkte und zuletzt geoeffnete Datensaetze. Gespeichert sind nur
 * Verweise; angezeigt wird immer der aktuelle Datensatz aus seinem Modul.
 */
import { useMemo } from "react";
import Link from "next/link";

import { FavoriteButton } from "@/components/common/favorite-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/lib/auth/scope";
import { useAllCollections } from "@/lib/data/store";
import { EntityRef } from "@/lib/favorites/store";
import { useMarks } from "@/lib/favorites/use-marks";
import { useT } from "@/lib/i18n/provider";
import { titleOfEntity } from "@/lib/module-config";
import { moduleByCollection } from "@/lib/modules";
import { BaseEntity, CollectionKey } from "@/lib/types";

interface Resolved {
  collection: CollectionKey;
  entity: BaseEntity;
}

export default function FavoritesPage() {
  const t = useT();
  const marks = useMarks();
  const access = useAccess();
  const store = useAllCollections();

  /** Verweise auf geloeschte oder gesperrte Datensaetze werden uebergangen. */
  const resolve = useMemo(
    () =>
      (refs: EntityRef[]): Resolved[] =>
        refs.flatMap((ref) => {
          if (!access.canRead(ref.collection)) return [];
          const entity = store[ref.collection].find(
            (item) => item.id === ref.id,
          );
          return entity ? [{ collection: ref.collection, entity }] : [];
        }),
    [access, store],
  );

  const favorites = useMemo(
    () => resolve(marks.favorites),
    [marks.favorites, resolve],
  );
  const recents = useMemo(
    () => resolve(marks.recents),
    [marks.recents, resolve],
  );

  const list = (entries: Resolved[], emptyText: string, prefix: string) =>
    entries.length === 0 ? (
      <p
        className="text-sm text-muted-foreground"
        data-testid={`${prefix}-empty`}
      >
        {emptyText}
      </p>
    ) : (
      <ul className="flex flex-col gap-2">
        {entries.map(({ collection, entity }) => {
          const moduleDef = moduleByCollection(collection);
          return (
            <li
              key={`${collection}-${entity.id}`}
              data-testid={`${prefix}-${entity.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <Link
                href={`${moduleDef.path}/${entity.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium">
                  {titleOfEntity(collection, entity) || entity.number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(moduleDef.singularKey)} · {entity.number}
                </p>
              </Link>
              <FavoriteButton
                collection={collection}
                id={entity.id}
                variant="ghost"
              />
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("favorites.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("favorites.intro")}
          </p>
          {list(favorites, t("favorites.empty"), "favorite")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("favorites.recent")}</CardTitle>
        </CardHeader>
        <CardContent>
          {list(recents, t("favorites.recentEmpty"), "recent")}
        </CardContent>
      </Card>
    </div>
  );
}
