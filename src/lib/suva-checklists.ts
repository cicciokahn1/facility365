/**
 * SUVA-Checklisten als fertige Vorlagen.
 *
 * Pro Kontrollart liegen die ueblichen Pruefpunkte bereits vor; die Punkte
 * sind Woerterbuch-Schluessel und werden in der App-Sprache angezeigt.
 * Eigene Punkte lassen sich wie gewohnt ergaenzen oder entfernen.
 */
import { ChecklistItem } from "@/lib/types";
import { newId } from "@/lib/utils/id";

const PLAYGROUND_VISUAL = [
  "suva.pg.fallzone",
  "suva.pg.edges",
  "suva.pg.corrosion",
  "suva.pg.obstacles",
  "suva.pg.anchoring",
];

const PLAYGROUND_FUNCTIONAL = [
  "suva.pg.fallzone",
  "suva.pg.entrapment",
  "suva.pg.edges",
  "suva.pg.anchoring",
  "suva.pg.corrosion",
  "suva.pg.distances",
  "suva.pg.obstacles",
];

const PLAYGROUND_PERIODIC = [
  "suva.pg.fallzone",
  "suva.pg.entrapment",
  "suva.pg.edges",
  "suva.pg.anchoring",
  "suva.pg.corrosion",
  "suva.pg.foundations",
  "suva.pg.distances",
  "suva.pg.obstacles",
  "suva.pg.signage",
];

const INSPECTION_CHECKLISTS: Record<string, string[]> = {
  playground: PLAYGROUND_FUNCTIONAL,
  ladder: [
    "suva.ladder.rungs",
    "suva.ladder.stiles",
    "suva.ladder.paint",
    "suva.ladder.joints",
    "suva.ladder.feet",
    "suva.ladder.spreader",
    "suva.ladder.marking",
    "suva.ladder.clean",
  ],
  emergencyLight: [
    "suva.emlight.function",
    "suva.emlight.signage",
    "suva.emlight.battery",
    "suva.emlight.test",
  ],
  escapeRoute: [
    "suva.escape.free",
    "suva.escape.doors",
    "suva.escape.signage",
    "suva.escape.light",
  ],
  elevator: [
    "suva.elev.alarm",
    "suva.elev.doors",
    "suva.elev.light",
    "suva.elev.protocol",
  ],
  fire: ["suva.fire.extinguisher", "suva.fire.access", "suva.fire.tagged"],
  emergencyEquipment: [
    "suva.eme.aed",
    "suva.eme.consumables",
    "suva.eme.eyewash",
    "suva.eme.kit",
    "suva.eme.access",
  ],
  safety: ["suva.safety.ppe", "suva.safety.hazards", "suva.safety.cleanliness"],
};

const PLAYGROUND_CHECKLISTS: Record<string, string[]> = {
  visual: PLAYGROUND_VISUAL,
  functional: PLAYGROUND_FUNCTIONAL,
  periodic: PLAYGROUND_PERIODIC,
};

const CHECKLISTS: Partial<
  Record<"playgroundchecks" | "inspections", Record<string, string[]>>
> = {
  playgroundchecks: PLAYGROUND_CHECKLISTS,
  inspections: INSPECTION_CHECKLISTS,
};

/** Vorlage je Kontrollart; leer, wenn keine Vorlage existiert. */
export const suvaChecklist = (
  collection: "playgroundchecks" | "inspections",
  type: string,
): ChecklistItem[] => {
  const keys = CHECKLISTS[collection]?.[type] ?? [];
  return keys.map((key) => ({ id: newId("chk"), text: key, done: false }));
};
