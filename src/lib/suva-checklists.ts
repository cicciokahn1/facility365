/**
 * Vorlagen aus der SUVA-Checkliste als fertige Pruefpaennen.
 *
 * Die Leiterkontrolle enthaelt die 21 Fragen der offiziellen SUVA-
 * Checkliste 67028.d «Tragbare Leitern und Tritte» wortgetreu.
 * Die Spielplatzkontrolle folgt den Kontrollstufen der SN EN 1176-7,
 * welche die SUVA-Praxis fuer Pausen- und Spielplaetze vorsieht.
 * Die Punkte sind Woerterbuch-Schluessel und werden in der App-Sprache
 * angezeigt; eigene Punkte lassen sich ergaenzen oder entfernen.
 */
import { ChecklistItem } from "@/lib/types";
import { newId } from "@/lib/utils/id";

/** SUVA 67028.d – Wochenkontrolle des Spielplatzes (Sichtkontrolle). */
const PLAYGROUND_VISUAL = [
  "suva.pgv.cleanliness",
  "suva.pgv.foreignBodies",
  "suva.pgv.surface",
  "suva.pgv.foundations",
  "suva.pgv.hazards",
];

/** SUVA/EN 1176-7 – Quartalskontrolle (Funktionskontrolle). */
const PLAYGROUND_FUNCTIONAL = [
  "suva.pgf.stability",
  "suva.pgf.wear",
  "suva.pgf.foundations",
  "suva.pgf.surface",
  "suva.pgf.movingParts",
  "suva.pgf.fasteners",
  "suva.pgf.entrapment",
  "suva.pgf.edges",
  "suva.pgf.distances",
  "suva.pgf.access",
];

/** SUVA/EN 1176-7 – Jahreskontrolle (Hauptkontrolle). */
const PLAYGROUND_PERIODIC = [
  "suva.pgp.stability",
  "suva.pgp.wear",
  "suva.pgp.foundations",
  "suva.pgp.corrosion",
  "suva.pgp.surface",
  "suva.pgp.entrapment",
  "suva.pgp.maintenance",
  "suva.pgp.signage",
];

/** SUVA-Checkliste 67028.d «Tragbare Leitern und Tritte», 21 Fragen. */
const LADDER = [
  "suva.ladder.q1",
  "suva.ladder.q2",
  "suva.ladder.q3",
  "suva.ladder.q4",
  "suva.ladder.q5",
  "suva.ladder.q6",
  "suva.ladder.q7",
  "suva.ladder.q8",
  "suva.ladder.q9",
  "suva.ladder.q10",
  "suva.ladder.q11",
  "suva.ladder.q12",
  "suva.ladder.q13",
  "suva.ladder.q14",
  "suva.ladder.q15",
  "suva.ladder.q16",
  "suva.ladder.q17",
  "suva.ladder.q18",
  "suva.ladder.q19",
  "suva.ladder.q20",
  "suva.ladder.q21",
];

const EMERGENCY_LIGHT = [
  "suva.emlight.function",
  "suva.emlight.signage",
  "suva.emlight.battery",
  "suva.emlight.test",
];

const ESCAPE_ROUTE = [
  "suva.escape.free",
  "suva.escape.doors",
  "suva.escape.signage",
  "suva.escape.light",
];

const ELEVATOR = [
  "suva.elev.alarm",
  "suva.elev.doors",
  "suva.elev.light",
  "suva.elev.protocol",
];

const FIRE = ["suva.fire.extinguisher", "suva.fire.access", "suva.fire.tagged"];

const EMERGENCY_EQUIPMENT = [
  "suva.eme.aed",
  "suva.eme.consumables",
  "suva.eme.eyewash",
  "suva.eme.kit",
  "suva.eme.access",
];

const SAFETY = ["suva.safety.ppe", "suva.safety.hazards", "suva.safety.cleanliness"];

const CHECKLISTS: Partial<
  Record<"playgroundchecks" | "inspections", Record<string, string[]>>
> = {
  playgroundchecks: {
    visual: PLAYGROUND_VISUAL,
    functional: PLAYGROUND_FUNCTIONAL,
    periodic: PLAYGROUND_PERIODIC,
  },
  inspections: {
    playground: PLAYGROUND_FUNCTIONAL,
    ladder: LADDER,
    emergencyLight: EMERGENCY_LIGHT,
    escapeRoute: ESCAPE_ROUTE,
    elevator: ELEVATOR,
    fire: FIRE,
    emergencyEquipment: EMERGENCY_EQUIPMENT,
    safety: SAFETY,
  },
};

/** Vorlage je Kontrollart; leer, wenn keine Vorlage existiert. */
export const suvaChecklist = (
  collection: "playgroundchecks" | "inspections",
  type: string,
): ChecklistItem[] => {
  const keys = CHECKLISTS[collection]?.[type] ?? [];
  return keys.map((key) => ({ id: newId("chk"), text: key, done: false }));
};
