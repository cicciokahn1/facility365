"use client";

/** Geaenderte Felder eines Vorgangs: Bezeichnung, alter und neuer Wert. */
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { table as keys } from "@/lib/i18n/generated/de";
import { useT } from "@/lib/i18n/provider";
import { FieldChange } from "@/lib/types";

const isKnownKey = (value: string): value is TranslationKey => value in keys;

/** Uebersetzt Auswahlwerte, laesst freie Texte unveraendert. */
export const changeText = (
  t: ReturnType<typeof useT>,
  value: string,
): string =>
  value === "" ? t("history.emptyValue") : isKnownKey(value) ? t(value) : value;

export function ChangeList({ changes }: { changes: FieldChange[] }) {
  const t = useT();
  if (changes.length === 0) return null;

  return (
    <ul
      className="mt-1 space-y-0.5 text-xs text-muted-foreground"
      data-testid="change-list"
    >
      {changes.map((change) => (
        <li key={change.labelKey}>
          <span className="font-medium">
            {isKnownKey(change.labelKey) ? t(change.labelKey) : change.labelKey}
          </span>
          : <span className="line-through">{changeText(t, change.from)}</span>{" "}
          <span aria-hidden>→</span> <span>{changeText(t, change.to)}</span>
        </li>
      ))}
    </ul>
  );
}
