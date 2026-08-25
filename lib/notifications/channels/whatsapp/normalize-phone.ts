const INDONESIA_MOBILE_PATTERN = /^62(8[1-9][0-9]{6,12})$/;

export function normalizeWaTarget(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let normalized: string;
  if (digits.startsWith("62")) {
    normalized = digits;
  } else if (digits.startsWith("0")) {
    normalized = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    normalized = `62${digits}`;
  } else {
    return null;
  }

  return INDONESIA_MOBILE_PATTERN.test(normalized) ? normalized : null;
}
