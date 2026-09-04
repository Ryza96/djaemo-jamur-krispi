/**
 * Admin Auth — Permanent Regression Test Suite
 *
 * Tests:
 *   1. Backward compatibility: old Node crypto.createHmac tokens → new Web Crypto verifier
 *   2. New token creation + verification roundtrip
 *   3. Expired token rejection
 *   4. Tampered signature rejection
 *   5. Wrong secret rejection
 *   6. Null / undefined / empty token rejection
 *   7. Malformed token rejection
 *   8. Wrong role rejection
 *
 * Run: npx tsx scripts/verify-admin-auth.ts
 *
 * This file is PERMANENT — do not delete after running.
 * It serves as a regression gate before any deploy touching admin auth.
 */

import crypto from "crypto";
import { verifyAdminToken } from "../lib/services/admin-auth.service";

// ─── Old implementation (copied from git history ec99b83) ────────────
// This is the EXACT code that was running in production before refactor.
// We use it to generate tokens that existing admin sessions would have.

function oldCreateAdminToken(secret: string): string {
  const payload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 86400,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  return `${data}.${sig}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${label}`);
  } else {
    failCount++;
    const msg = detail ? `${label} — ${detail}` : label;
    failures.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

function group(name: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${"─".repeat(60)}`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const TEST_SECRET = "backward-compat-test-secret-1234!!";
  process.env.ADMIN_AUTH_SECRET = TEST_SECRET;

  // ═══════════════════════════════════════════════════════════════════
  // TASK 1: Backward Compatibility — Old Token → New Verifier
  // ═══════════════════════════════════════════════════════════════════

  group("TASK 1: BACKWARD COMPATIBILITY — Old Node crypto → New Web Crypto");

  console.log("\n  Generating token with OLD implementation (crypto.createHmac)...");
  const oldToken = oldCreateAdminToken(TEST_SECRET);
  console.log(`  Token: ${oldToken.substring(0, 40)}...`);

  console.log("\n  Verifying with NEW implementation (verifyAdminToken)...");
  const oldTokenValid = await verifyAdminToken(oldToken);

  assert(
    oldTokenValid === true,
    "Old token (Node crypto.createHmac) is VALID in new verifier",
    oldTokenValid ? "" : "BREAKING CHANGE — all logged-in admins will be logged out on deploy!",
  );

  if (!oldTokenValid) {
    console.log("\n  ⚠️  BREAKING CHANGE DETECTED");
    console.log("  Old tokens are NOT accepted by the new implementation.");
    console.log("  Impact: All currently logged-in admins will be logged out on deploy.");
    console.log("  Options:");
    console.log("    a) Accept the impact (admins must re-login once; session is short-lived)");
    console.log("    b) Add temporary fallback in verifyAdminToken (remove after 24h)");
  }

  // Also verify the old verifier can't be imported anymore (it's been replaced)
  // but we can at least verify the old signing produces the same bytes
  // as the new signing would produce.
  console.log("\n  Cross-check: old signing == new signing for same input...");

  // Sign with new implementation (inline, same as admin-auth.service.ts)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(TEST_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Extract the data portion from the old token
  const [oldData] = oldToken.split(".");

  // Sign the same data with Web Crypto
  const newSigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(oldData));
  const newSigBytes = new Uint8Array(newSigBuffer);

  // Decode old signature from the token
  const oldSigB64 = oldToken.split(".")[1];
  const oldSigBytes = Uint8Array.from(atob(oldSigB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

  // Compare byte-by-byte
  let sigDiff = 0;
  const minLen = Math.min(newSigBytes.length, oldSigBytes.length);
  for (let i = 0; i < minLen; i++) {
    sigDiff |= newSigBytes[i] ^ oldSigBytes[i];
  }
  sigDiff |= newSigBytes.length ^ oldSigBytes.length;

  assert(
    sigDiff === 0,
    "HMAC-SHA256 output is identical between Node crypto and Web Crypto",
    `new=${newSigBytes.length}bytes, old=${oldSigBytes.length}bytes, diff=${sigDiff}`,
  );

  // ═══════════════════════════════════════════════════════════════════
  // TASK 2: General Regression Tests (new implementation)
  // ═══════════════════════════════════════════════════════════════════

  group("NEW TOKEN: Valid roundtrip");

  // Generate token using new implementation (inline)
  const payload = {
    role: "admin" as const,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const data = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const newToken = `${data}.${sigB64}`;

  const newTokenValid = await verifyAdminToken(newToken);
  assert(newTokenValid === true, "New token is valid");

  group("EXPIRED TOKEN");
  const expiredPayload = {
    role: "admin" as const,
    exp: Math.floor(Date.now() / 1000) - 3600,
  };
  const expiredData = btoa(JSON.stringify(expiredPayload))
    .replace(/\+/g, "-").replace(/_/g, "/").replace(/=+$/, "");
  const expiredSig = await crypto.subtle.sign("HMAC", key, encoder.encode(expiredData));
  const expiredSigB64 = btoa(String.fromCharCode(...new Uint8Array(expiredSig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const expiredToken = `${expiredData}.${expiredSigB64}`;

  assert(!(await verifyAdminToken(expiredToken)), "Expired token is rejected");

  group("TAMPERED SIGNATURE");
  const tampered = newToken.split(".")[0] + ".AAAA" + newToken.split(".")[1].slice(4);
  assert(!(await verifyAdminToken(tampered)), "Tampered signature is rejected");

  group("WRONG SECRET");
  const wrongSecret = "wrong-secret-1234567890abcdef";
  process.env.ADMIN_AUTH_SECRET = wrongSecret;
  const wrongKey = await crypto.subtle.importKey(
    "raw", encoder.encode(wrongSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const wrongSig = await crypto.subtle.sign("HMAC", wrongKey, encoder.encode(data));
  const wrongSigB64 = btoa(String.fromCharCode(...new Uint8Array(wrongSig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const wrongSecretToken = `${data}.${wrongSigB64}`;
  process.env.ADMIN_AUTH_SECRET = TEST_SECRET; // restore BEFORE verification
  assert(!(await verifyAdminToken(wrongSecretToken)), "Token signed with wrong secret is rejected");

  group("NULL / UNDEFINED / EMPTY");
  assert(!(await verifyAdminToken(null)), "null is rejected");
  assert(!(await verifyAdminToken(undefined)), "undefined is rejected");
  assert(!(await verifyAdminToken("")), "empty string is rejected");

  group("MALFORMED TOKENS");
  assert(!(await verifyAdminToken("no-dot")), "'no-dot' is rejected");
  assert(!(await verifyAdminToken("a.b.c")), "'a.b.c' (3 parts) is rejected");

  group("WRONG ROLE");
  const userPayload = {
    role: "user" as const,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const userData = btoa(JSON.stringify(userPayload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const userSig = await crypto.subtle.sign("HMAC", key, encoder.encode(userData));
  const userSigB64 = btoa(String.fromCharCode(...new Uint8Array(userSig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const userToken = `${userData}.${userSigB64}`;
  assert(!(await verifyAdminToken(userToken)), "Token with role='user' is rejected");

  // ─── Summary ──────────────────────────────────────────────────────

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  RESULTS`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  ✅ Pass: ${passCount}`);
  console.log(`  ❌ Fail: ${failCount}`);

  if (failCount > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) {
      console.log(`    - ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`\n  ✅ ALL TESTS PASSED`);
  }
}

main().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
