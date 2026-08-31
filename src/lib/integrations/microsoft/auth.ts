'use client';

/**
 * Anmeldung an Microsoft 365 (Entra ID).
 *
 * Die Anmeldung laeuft als Autorisierungscode mit PKCE direkt im Browser -
 * ohne zusaetzliche Bibliothek und ohne Geheimnis in der Anwendung. Die
 * bestehende Anmeldung von Facility365 bleibt davon unberuehrt: dieser Zugang
 * dient allein dem Datenaustausch mit Outlook.
 */

export interface GraphConfig {
  tenantId: string;
  clientId: string;
}

export interface GraphSession {
  accessToken: string;
  refreshToken: string;
  /** Ablauf als Zeitstempel in Millisekunden. */
  expiresAt: number;
  account: string;
}

/** Rechte, die der Abgleich braucht; die Freigabe erteilt die Administration im Entra ID. */
export const GRAPH_SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'User.Read',
  'Mail.ReadWrite',
  'Calendars.ReadWrite',
];

const SESSION_KEY = 'facility365.microsoft.session';
const VERIFIER_KEY = 'facility365.microsoft.verifier';

export const REDIRECT_PATH = '/microsoft';

export const graphConfigured = (config: GraphConfig): boolean =>
  Boolean(config.tenantId.trim() && config.clientId.trim());

const authority = (config: GraphConfig): string =>
  `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId.trim())}/oauth2/v2.0`;

export const redirectUri = (): string =>
  typeof window === 'undefined' ? '' : `${window.location.origin}${REDIRECT_PATH}`;

const base64Url = (bytes: Uint8Array): string => {
  let text = '';
  bytes.forEach((byte) => {
    text += String.fromCharCode(byte);
  });
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomVerifier = (): string => {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
};

const challengeOf = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
};

/** Beobachter der Anmeldung, damit die Oberflaeche ohne Umweg folgt. */
const listeners = new Set<() => void>();

export const subscribeSession = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (typeof window !== 'undefined') window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', listener);
  };
};

/** Roher Stand der Anmeldung; unveraendert derselbe Text, solange nichts geschieht. */
export const sessionSnapshot = (): string | null =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(SESSION_KEY);

export const readSession = (): GraphSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as GraphSession) : null;
  } catch {
    return null;
  }
};

const writeSession = (session: GraphSession | null) => {
  if (typeof window === 'undefined') return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener());
};

/** Meldet ab; die Daten in Facility365 und in Outlook bleiben erhalten. */
export const signOutMicrosoft = () => writeSession(null);

/** Leitet zur Anmeldemaske von Microsoft weiter. */
export const startMicrosoftSignIn = async (config: GraphConfig) => {
  const verifier = randomVerifier();
  window.sessionStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: config.clientId.trim(),
    response_type: 'code',
    redirect_uri: redirectUri(),
    response_mode: 'query',
    scope: GRAPH_SCOPES.join(' '),
    code_challenge: await challengeOf(verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  window.location.assign(`${authority(config)}/authorize?${params.toString()}`);
};

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error_description?: string;
}

const requestToken = async (config: GraphConfig, body: URLSearchParams): Promise<GraphSession> => {
  const response = await fetch(`${authority(config)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description?.split('\n')[0] ?? 'Microsoft 365');
  }
  const previous = readSession();
  const session: GraphSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? previous?.refreshToken ?? '',
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    account: previous?.account ?? '',
  };
  writeSession(session);
  return session;
};

/** Schliesst die Anmeldung nach der Rueckkehr von Microsoft ab. */
export const completeMicrosoftSignIn = async (
  config: GraphConfig,
  code: string,
): Promise<GraphSession> => {
  const verifier = window.sessionStorage.getItem(VERIFIER_KEY) ?? '';
  window.sessionStorage.removeItem(VERIFIER_KEY);
  return requestToken(
    config,
    new URLSearchParams({
      client_id: config.clientId.trim(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
      scope: GRAPH_SCOPES.join(' '),
    }),
  );
};

/** Gueltiges Zugriffsmerkmal; erneuert sich selbst, solange die Anmeldung gilt. */
export const accessToken = async (config: GraphConfig): Promise<string> => {
  const session = readSession();
  if (!session) throw new Error('signedOut');
  if (session.expiresAt - 60_000 > Date.now()) return session.accessToken;
  if (!session.refreshToken) throw new Error('signedOut');
  const renewed = await requestToken(
    config,
    new URLSearchParams({
      client_id: config.clientId.trim(),
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      scope: GRAPH_SCOPES.join(' '),
    }),
  );
  return renewed.accessToken;
};

/** Haelt den angemeldeten Namen fest, damit er in der Oberflaeche steht. */
export const rememberAccount = (account: string) => {
  const session = readSession();
  if (!session || session.account === account) return;
  writeSession({ ...session, account });
};
