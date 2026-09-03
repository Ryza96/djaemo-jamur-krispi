#!/usr/bin/env node
/**
 * Generates a bcrypt hash for the admin password.
 *
 * Run this yourself in your own terminal. Your password is never shown on
 * screen and never stored in shell history. Paste the generated "$2..." hash
 * into ADMIN_PASSWORD in your .env / Vercel env vars. The hash is safe to
 * paste; only the keyed-in plaintext password must stay private.
 *
 * Interactive (recommended - prompts hidden):
 *   node scripts/hash-admin-password.mjs
 *
 * Optional cost factor (default 10):
 *   node scripts/hash-admin-password.mjs 12
 *
 * Non-interactive (piped stdin, e.g. for scripts):
 *   echo -n 'PASSWORD' | node scripts/hash-admin-password.mjs
 */
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

const costArg = process.argv[2];
const rounds = costArg ? Number.parseInt(costArg, 10) : 10;

if (!Number.isInteger(rounds) || rounds < 4 || rounds > 31) {
  console.error("Invalid cost factor. Use an integer between 4 and 31.");
  process.exit(1);
}

async function readSecretFromTty() {
  // Silence the terminal echo so the password is never displayed on screen.
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  try {
    return await new Promise((resolve, reject) => {
      let value = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        for (const ch of chunk) {
          if (ch === "\r" || ch === "\n") {
            process.stdin.pause();
            resolve(value);
            return;
          }
          value += ch;
        }
      });
      process.stdin.on("end", () => resolve(value));
      process.stdin.on("error", reject);
    });
  } finally {
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
  }
}

async function main() {
  let input;

  if (process.stdin.isTTY) {
    process.stdout.write("Enter admin password (hidden): ");
    input = await readSecretFromTty();
    process.stdout.write("\n");
  } else {
    // Piped stdin: read all available data (e.g. `echo -n 'x' | node ...`).
    input = readFileSync(0, "utf8").replace(/[\r\n]+$/, "");
  }

  if (!input) {
    console.error("No password provided.");
    process.exit(1);
  }

  if (input.length < 8) {
    console.error("Password is very short. Consider a longer password before using this hash.");
  }

  if (input.startsWith("$2")) {
    console.warn(
      "Note: input starts with '$2' (a bcrypt prefix). If you pasted an existing hash by " +
        "mistake, the generated hash will be wrong - regenerate with your plaintext password.",
    );
  }

  const hash = bcrypt.hashSync(input, rounds);
  console.log(`\n[bcrypt rounds=${rounds}] hash (paste into ADMIN_PASSWORD):`);
  console.log(hash);
  console.log("");

  const verify = bcrypt.compareSync(input, hash);
  console.log(verify ? "Self-check: OK (hash verifies)." : "Self-check: FAILED - regenerate.");
}

main().catch((err) => {
  console.error("Failed to generate hash:", err);
  process.exit(1);
});
