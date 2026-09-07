"use client";

/** Zugriff auf Favoriten und zuletzt verwendete Eintraege des Benutzers. */
import { useCallback, useMemo, useSyncExternalStore } from "react";

import { useAuth } from "@/lib/auth/provider";
import {
  EMPTY_MARKS,
  EntityRef,
  isFavorite,
  markVisited,
  marksOf,
  subscribeMarks,
  toggleFavorite,
} from "@/lib/favorites/store";
import { CollectionKey } from "@/lib/types";

export interface MarksApi {
  favorites: EntityRef[];
  recents: EntityRef[];
  isFavorite: (collection: CollectionKey, id: string) => boolean;
  toggle: (collection: CollectionKey, id: string) => boolean;
  visit: (collection: CollectionKey, id: string) => void;
}

export function useMarks(): MarksApi {
  const auth = useAuth();
  /** Eigene Merkliste je Konto; ohne Anmeldung gilt das Geraet. */
  const scope = auth.enabled ? (auth.user?.id ?? "") : "local";

  const marks = useSyncExternalStore(
    subscribeMarks,
    () => marksOf(scope),
    () => EMPTY_MARKS,
  );

  const toggle = useCallback(
    (collection: CollectionKey, id: string) =>
      toggleFavorite(scope, collection, id),
    [scope],
  );
  const visit = useCallback(
    (collection: CollectionKey, id: string) =>
      markVisited(scope, collection, id),
    [scope],
  );
  const check = useCallback(
    (collection: CollectionKey, id: string) =>
      isFavorite(scope, collection, id),
    [scope],
  );

  return useMemo(
    () => ({
      favorites: marks.favorites,
      recents: marks.recents,
      isFavorite: check,
      toggle,
      visit,
    }),
    [check, marks.favorites, marks.recents, toggle, visit],
  );
}
