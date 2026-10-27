/**
 * Rate limiter fixed-window trong bộ nhớ, dùng cho các route handler của Next.
 *
 * Giới hạn: trên Vercel (serverless) mỗi instance có bộ nhớ riêng nên đây chỉ là lớp
 * giảm lạm dụng "best-effort". Với bảo vệ chặt chẽ cần Vercel Firewall / Upstash / WAF.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    // Vẫn quá lớn (bị spam key) => dọn toàn bộ để tránh phình bộ nhớ.
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Chỉ dùng cho test. */
export function __resetRateLimitForTests() {
  buckets.clear();
}

/** IP client theo header do nền tảng (Vercel) gán. */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (headers.get("x-real-ip") || "unknown").slice(0, 64);
}
