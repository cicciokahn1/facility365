/**
 * Feldvergleich fuer die Historie.
 *
 * Beim Speichern wird der alte mit dem neuen Stand verglichen. Festgehalten
 * wird nur, was sich tatsaechlich geaendert hat - als Text, damit die Historie
 * auch dann lesbar bleibt, wenn ein verknuepfter Datensatz spaeter wegfaellt.
 */
import { fieldValue } from "@/lib/entity-values";
import { configOf, titleOfEntity } from "@/lib/module-config";
import { FieldDef, asString, isAddressValue } from "@/lib/schema";
import { BaseEntity, CollectionKey, FieldChange } from "@/lib/types";

/** Mehr Feldaenderungen je Vorgang sind fuer die Historie nicht aussagekraeftig. */
const MAX_CHANGES = 12;

type Lookup = Partial<Record<CollectionKey, BaseEntity[]>>;

/** Wert eines Feldes als Text; Auswahlwerte als Uebersetzungsschluessel. */
const displayValue = (
  field: FieldDef,
  value: unknown,
  store: Lookup,
): string => {
  if (value === undefined || value === null || value === "") return "";
  if (field.kind === "switch")
    return value === true ? "common.yes" : "common.no";
  if (field.kind === "select") {
    const option = field.options.find((entry) => entry.value === value);
    return option ? option.labelKey : asString(value);
  }
  if (field.kind === "relation") {
    const target = (store[field.collection] ?? []).find(
      (item) => item.id === value,
    );
    return target
      ? titleOfEntity(field.collection, target) || target.number
      : "";
  }
  if (field.kind === "address") {
    if (!isAddressValue(value)) return "";
    return [
      value.street,
      [value.zip, value.city].filter(Boolean).join(" "),
      value.country,
    ]
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "number") return String(value);
  return asString(value);
};

/** Geaenderte Felder zwischen zwei Staenden desselben Datensatzes. */
export const describeChanges = (
  collection: CollectionKey,
  before: BaseEntity,
  after: BaseEntity,
  store: Lookup,
): FieldChange[] => {
  const changes: FieldChange[] = [];
  for (const field of configOf(collection).fields) {
    if (changes.length >= MAX_CHANGES) break;
    const from = displayValue(field, fieldValue(before, field.name), store);
    const to = displayValue(field, fieldValue(after, field.name), store);
    if (from === to) continue;
    changes.push({ labelKey: field.labelKey, from, to });
  }
  return changes;
};
