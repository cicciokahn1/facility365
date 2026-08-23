/**
 * Handelnde Person der laufenden Sitzung.
 *
 * Die Datenschicht darf die Benutzerverwaltung nicht laden - sonst laegen die
 * beiden Schichten im Kreis. Deshalb hinterlegt die Oberflaeche die angemeldete
 * Person hier, und die Aktivitaetshistorie liest sie beim Schreiben.
 */
export interface Actor {
  id: string;
  name: string;
}

let actor: Actor = { id: '', name: '' };

export const setActor = (next: Actor): void => {
  actor = next;
};

export const currentActor = (): Actor => actor;
