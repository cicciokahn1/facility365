/**
 * Server-Push auslösen.
 *
 * Der schreibende Client meldet das Ereignis; der Server stellt die
 * Mitteilung zu, auch wenn die App der Empfaengerin geschlossen ist.
 * Fehler werden still verschluckt - Push ist Zusatz, nie Voraussetzung.
 */
import { supabase } from '@/lib/supabase/client';

export interface RemotePush {
  /** Kennung beim Anmeldedienst (AppUser.externalId). */
  userId: string;
  title: string;
  body: string;
  href: string;
  event: string;
  tag: string;
}

export const sendRemotePush = async (payload: RemotePush): Promise<void> => {
  try {
    const client = await supabase();
    if (!client || !payload.userId) return;
    const token = (await client.auth.getSession()).data.session?.access_token;
    if (!token) return;
    await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    /* Push ist optional - nie den Arbeitsablauf blockieren. */
  }
};
