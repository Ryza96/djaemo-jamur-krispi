import "server-only";
import { ContactSubmissionRepository } from "@/lib/repositories";

export const CONTACT_RATE_LIMIT_MAX = 5;
export const CONTACT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Returns true when the identifier has reached the submission limit
 * inside the current window. Fail-open: if the submissions table is not
 * reachable yet (e.g. migration pending), the form is NOT blocked.
 */
export async function isContactRateLimited(identifier: string): Promise<boolean> {
  try {
    const sinceIso = new Date(Date.now() - CONTACT_RATE_LIMIT_WINDOW_MS).toISOString();
    const count = await ContactSubmissionRepository.countRecent(identifier, sinceIso);
    return count >= CONTACT_RATE_LIMIT_MAX;
  } catch (err) {
    console.warn("[contact-rate-limit] count failed (fail-open):", err);
    return false;
  }
}

/**
 * Records a submission attempt (regardless of validation outcome) and
 * prunes expired rows. Fail-open: a recording error must not break the
 * legitimate contact flow.
 */
export async function recordContactAttempt(identifier: string): Promise<void> {
  try {
    await ContactSubmissionRepository.record(identifier);
    await ContactSubmissionRepository.deleteExpired(
      new Date(Date.now() - CONTACT_RATE_LIMIT_WINDOW_MS).toISOString(),
    );
  } catch (err) {
    console.warn("[contact-rate-limit] record failed (fail-open):", err);
  }
}
