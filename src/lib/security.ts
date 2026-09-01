export function normalizeText(value: string | null | undefined, maxLength = 200): string | null {
  if (value == null) return null;

  const trimmed = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=\s*['"`]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!trimmed) return null;

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength).trim() : trimmed;
}

export function sanitizeText(value: string | null | undefined, maxLength = 200): string | null {
  return normalizeText(value, maxLength);
}

export function sanitizeEmail(value: string | null | undefined): string | null {
  const normalized = normalizeText(value, 254)?.toLowerCase();
  if (!normalized) return null;

  const email = normalized.trim();
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,63}$/i;

  return emailRegex.test(email) ? email : null;
}

export function sanitizeSlug(value: string | null | undefined): string | null {
  const normalized = normalizeText(value, 60)?.toLowerCase();
  if (!normalized) return null;

  const slug = normalized.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 ? slug : null;
}

export function sanitizePhone(value: string | null | undefined): string | null {
  const normalized = normalizeText(value, 30);
  if (!normalized) return null;

  const digits = normalized.replace(/[^+\d\s()-]/g, '').replace(/\s+/g, ' ').trim();
  return /^\+?[\d()\s-]{8,20}$/.test(digits) ? digits : null;
}

export function sanitizePassword(value: string | null | undefined, minLength = 8, maxLength = 128): string | null {
  const normalized = normalizeText(value, maxLength);
  if (!normalized) return null;

  return normalized.length >= minLength ? normalized : null;
}

export function sanitizeUrl(value: string | null | undefined): string | null {
  const normalized = normalizeText(value, 2048);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeHexColor(value: string | null | undefined): string | null {
  const normalized = normalizeText(value, 20)?.trim();
  if (!normalized) return null;

  return /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(normalized) ? normalized : null;
}

export function sanitizeAlphaNumeric(value: string | null | undefined, maxLength = 64): string | null {
  const sanitized = normalizeText(value, maxLength);
  if (!sanitized) return null;

  return /^[A-Za-z0-9 _-]+$/.test(sanitized) ? sanitized : null;
}

export function sanitizeNumber(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;

  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed)) return null;

  const clamped = Math.min(Math.max(parsed, min), max);
  return clamped;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxAttempts) {
    return false;
  }

  current.count += 1;
  return true;
}
