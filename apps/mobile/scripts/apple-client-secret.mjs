// Generate the Apple "Sign in with Apple" client secret (JWT) for Supabase web OAuth.
// Usage:
//   node scripts/apple-client-secret.mjs \
//     --p8 ./AuthKey_XXXXXXXXXX.p8 \
//     --key-id XXXXXXXXXX \
//     --service-id app.seen.com.web
//
// Team ID defaults to Seen's (HZAYG4Q47N); override with --team-id if needed.
// Paste the printed token into Supabase → Auth → Apple → "Secret Key (for OAuth)".
// Apple caps exp at 6 months, so regenerate before it expires.

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const teamId = args["team-id"] ?? "HZAYG4Q47N";
const keyId = args["key-id"];
const serviceId = args["service-id"];
const p8Path = args.p8;

if (!keyId || !serviceId || !p8Path) {
  console.error("Missing args. Need --p8, --key-id, --service-id (--team-id optional).");
  process.exit(1);
}

const privateKey = readFileSync(p8Path, "utf8");
const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const now = Math.floor(Date.now() / 1000);
const sixMonths = 60 * 60 * 24 * 180; // Apple max

const header = { alg: "ES256", kid: keyId };
const payload = {
  iss: teamId,
  iat: now,
  exp: now + sixMonths,
  aud: "https://appleid.apple.com",
  sub: serviceId,
};

const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
const signature = createSign("SHA256")
  .update(signingInput)
  .sign({ key: privateKey, dsaEncoding: "ieee-p1363" })
  .toString("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

console.log(`${signingInput}.${signature}`);
