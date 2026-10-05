import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string | null;
}

export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleProfile> {
  console.log(`[google] verifying idToken (len=${idToken.length}) against audience=${process.env.GOOGLE_CLIENT_ID ?? "UNSET"}`);
  const ticket = await Promise.race([
    client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("verifyIdToken timed out after 10s — likely stuck fetching Google's certs")), 10_000),
    ),
  ]);

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("Invalid Google token payload");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  };
}
