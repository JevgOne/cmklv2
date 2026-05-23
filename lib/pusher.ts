import Pusher from "pusher";

// Graceful: export null if env vars are missing (dev without Pusher)
function createPusherInstance(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
}

export const pusher = createPusherInstance();

// Channel naming convention:
// private-user-{userId}     — osobní notifikace
// private-workflow-{id}     — live updates na požadavku
// private-role-{role}       — broadcast pro celé oddělení
