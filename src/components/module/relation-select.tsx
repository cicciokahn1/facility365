"use client";

/** Auswahl eines verknuepften Datensatzes, z. B. Liegenschaft eines Gebaeudes. */
import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollectionItems } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { titleOfEntity } from "@/lib/module-config";
import { BaseEntity, CollectionKey } from "@/lib/types";

const NONE = "__none__";
const CREATE = "__create__";

/** Wert eines Fremdschluessels eines Datensatzes, ohne den Typ zu verlieren. */
const parentValueOf = (entity: BaseEntity, key: string): string => {
  const value = (entity as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

export function RelationSelect({
  collection,
  value,
  onChange,
  placeholder,
  parentKey,
  parentValue,
  id,
  onCreate,
}: {
  collection: CollectionKey;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Feldname im Ziel, ueber den eingeschraenkt wird. */
  parentKey?: string;
  parentValue?: string;
  id?: string;
  /** Fehlt der gewuenschte Eintrag, wird er direkt hier angelegt. */
  onCreate?: () => void;
}) {
  const t = useT();
  const items = useCollectionItems(collection);

  /**
   * Passende Eintraege stehen oben, alle uebrigen bleiben darunter waehlbar.
   * So schraenkt die uebergeordnete Auswahl nur die Reihenfolge ein - kein
   * Gebaeude und kein Raum verschwindet aus der Liste.
   */
  const { matching, others } = useMemo(() => {
    const entries = items
      .map((item) => ({
        id: item.id,
        label: titleOfEntity(collection, item),
        fits:
          parentKey && parentValue
            ? parentValueOf(item, parentKey) === parentValue
            : true,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return {
      matching: entries.filter((entry) => entry.fits),
      others: entries.filter((entry) => !entry.fits),
    };
  }, [items, collection, parentKey, parentValue]);

  return (
    <Select
      value={value || NONE}
      onValueChange={(next) => {
        if (next === CREATE) {
          /** Erst schliesst die Auswahl, danach oeffnet das neue Formular. */
          if (onCreate) window.setTimeout(onCreate, 0);
          return;
        }
        onChange(next === NONE ? "" : next);
      }}
    >
      <SelectTrigger
        id={id}
        className="w-full"
        data-testid={`relation-${collection}`}
      >
        <SelectValue placeholder={placeholder ?? t("common.select")} />
      </SelectTrigger>
      <SelectContent>
        {onCreate ? (
          <SelectItem
            value={CREATE}
            data-testid={`relation-create-${collection}`}
          >
            {t("relation.create")}
          </SelectItem>
        ) : null}
        <SelectItem value={NONE}>{t("common.none")}</SelectItem>
        {matching.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
        {others.length > 0 ? (
          <SelectGroup>
            <SelectLabel>{t("relation.others")}</SelectLabel>
            {others.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  );
}

/** Anzeigename eines verknuepften Datensatzes. */
export function useRelationLabel(
  collection: CollectionKey,
  id: string,
): string {
  const items = useCollectionItems(collection);
  const found = items.find((item) => item.id === id);
  return found ? titleOfEntity(collection, found) : "";
}
