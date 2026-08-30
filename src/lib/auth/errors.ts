/**
 * Verstaendliche Meldungen fuer die Anmeldung.
 *
 * Technische Angaben aus der Anmeldung (Dienstnamen, Schluessel, Statuscodes)
 * gehoeren nicht in die Oberflaeche. Bekannte Faelle bekommen einen klaren
 * Satz, alles Uebrige eine allgemeine Meldung.
 */
export type AuthMessage =
  | 'auth.errorCredentials'
  | 'auth.errorNotVerified'
  | 'auth.errorExists'
  | 'auth.errorWeakPassword'
  | 'auth.errorRate'
  | 'auth.errorNetwork'
  | 'auth.errorGeneric';

export const authMessage = (raw: unknown): AuthMessage => {
  const text = (raw instanceof Error ? raw.message : String(raw ?? '')).toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'auth.errorCredentials';
  }
  if (text.includes('email not confirmed') || text.includes('not confirmed')) {
    return 'auth.errorNotVerified';
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'auth.errorExists';
  }
  if (text.includes('password') && (text.includes('weak') || text.includes('at least'))) {
    return 'auth.errorWeakPassword';
  }
  if (text.includes('rate limit') || text.includes('too many')) return 'auth.errorRate';
  if (text.includes('fetch') || text.includes('network') || text.includes('timeout')) {
    return 'auth.errorNetwork';
  }
  return 'auth.errorGeneric';
};

/** Mindestanforderung an ein Kennwort; gilt in der Oberflaeche und im Konto. */
export const passwordProblem = (value: string): 'auth.errorWeakPassword' | null => {
  const long = value.length >= 10;
  const mixed = /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
  return long && mixed ? null : 'auth.errorWeakPassword';
};
