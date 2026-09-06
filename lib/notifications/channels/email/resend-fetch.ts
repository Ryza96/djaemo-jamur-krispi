const RESEND_API_URL = "https://api.resend.com/emails";

const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [500, 1000];
const RATE_LIMIT_RETRY_DELAYS_MS = [2000, 4000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectMessages(error: unknown, maxDepth = 4): string[] {
  const messages: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < maxDepth && current != null; depth++) {
    if (current instanceof Error) {
      messages.push(`${current.name}: ${current.message}`);
      current = current.cause;
    } else {
      messages.push(String(current));
      break;
    }
  }

  return messages;
}

function describeError(error: unknown): string {
  return collectMessages(error).join(" | ") || String(error);
}

function isRetryableNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  return /socket|econnreset|und_err|fetch failed|other side closed|network|timeout|timed out|aborted/i.test(
    describeError(error),
  );
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function describeBody(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  const record = body as Record<string, unknown>;
  if (typeof record.message === "string") {
    return record.message;
  }
  if (typeof record.error === "string") {
    return record.error;
  }
  return "";
}

function delayFor(attempt: number, status: number): number {
  const delays = status === 429 ? RATE_LIMIT_RETRY_DELAYS_MS : RETRY_DELAYS_MS;
  return delays[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
}

export async function sendResendEmail(payload: object, apiKey: string): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!isRetryableStatus(response.status)) {
        return response;
      }

      const body: unknown = await response.json().catch(() => null);
      const detail = describeBody(body);
      const kind = response.status === 429 ? "rate limited" : "server error";

      if (attempt < MAX_ATTEMPTS) {
        const delay = delayFor(attempt, response.status);
        console.warn(
          `[Resend] Attempt ${attempt}/${MAX_ATTEMPTS} failed with HTTP ${response.status} (${kind}${detail ? `: ${detail}` : ""}). Retrying in ${delay}ms...`,
        );
        await sleep(delay);
        continue;
      }

      throw new Error(
        `Sending email via Resend failed after ${MAX_ATTEMPTS} attempts. Last response: HTTP ${response.status}${detail ? ` (${detail})` : ""}`,
      );
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < MAX_ATTEMPTS) {
        const delay = delayFor(attempt, 0);
        console.error(
          `[Resend] Attempt ${attempt}/${MAX_ATTEMPTS} failed with network error: ${describeError(error)}. Retrying in ${delay}ms...`,
        );
        await sleep(delay);
        continue;
      }

      if (isRetryableNetworkError(error)) {
        throw new Error(
          `Sending email via Resend failed after ${MAX_ATTEMPTS} attempts: ${describeError(error)}`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(`Sending email via Resend failed after ${MAX_ATTEMPTS} attempts`);
}