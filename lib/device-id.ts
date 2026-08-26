const DEVICE_ID_KEY = "djaemo_device_id";

function generateId(): string {
  return crypto.randomUUID();
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = generateId();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
