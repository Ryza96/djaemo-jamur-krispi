import "server-only";
import { AdminLoginAttemptRepository } from "@/lib/repositories";

export const LOGIN_RATE_LIMIT_MAX = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Resolves the client identifier used for rate limiting.
 *
 * Primary: first IP in `x-forwarded-for` (standard on Vercel; the
 * header is replaced at the edge with the real client IP). Fallbacks:
 * `x-real-ip`, then "unknown" (e.g. local dev without proxies).
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

/**
 * Returns true when the identifier has reached the failure limit
 * inside the current window. Fail-open: if the attempts table is not
 * reachable yet (e.g. migration pending), login is NOT blocked.
 */
export async function isLoginRateLimited(identifier: string): Promise<boolean> {
  try {
    const sinceIso = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS).toISOString();
    const count = await AdminLoginAttemptRepository.countRecent(identifier, sinceIso);
    return count >= LOGIN_RATE_LIMIT_MAX;
  } catch (err) {
    console.warn("[admin-login-rate-limit] count failed (fail-open):", err);
    return false;
  }
}

export async function recordFailedLogin(
  identifier: string,
  username: string | undefined,
): Promise<void> {
  try {
    await AdminLoginAttemptRepository.record(identifier, username ?? null);
    await AdminLoginAttemptRepository.deleteExpired(
      new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS).toISOString(),
    );
  } catch (err) {
    console.warn("[admin-login-rate-limit] record failed (fail-open):", err);
  }
}

export async function clearFailedLogins(identifier: string): Promise<void> {
  try {
    await AdminLoginAttemptRepository.deleteByIdentifier(identifier);
  } catch (err) {
    console.warn("[admin-login-rate-limit] reset failed:", err);
  }
}