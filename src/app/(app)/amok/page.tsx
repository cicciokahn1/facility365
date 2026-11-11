import { ModuleList } from "@/components/module/module-list";

/**
 * Amok-Alarm & Evakuierung: eigene Sicht auf die Kontrollen.
 * Speichert im Inspektionen-Bestand mit Art "amok" - keine eigene Tabelle,
 * dadurch bleiben Export, Historie und Papierkorb dieselben wie bei Kontrollen.
 */
export default function AmokPage() {
  return (
    <ModuleList
      collection="inspections"
      moduleKey="amok"
      only={{ field: "type", value: "amok" }}
      defaults={{ type: "amok" }}
    />
  );
}
