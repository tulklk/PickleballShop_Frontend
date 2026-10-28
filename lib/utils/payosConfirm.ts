import type { PayosConfirmResponse } from "@/lib/api/types";
import type { PaymentHint } from "@/lib/utils/paymentStatus";

export type PayosOutcome =
  | { kind: "success" }
  | { kind: "cancelled"; message?: string }
  | { kind: "notPaid"; message?: string }
  | { kind: "forbidden" }
  | { kind: "notFound" }
  | { kind: "rateLimited"; retryAfterSeconds?: number }
  | { kind: "error"; message?: string };

export type PayosConfirmFn = (data: {
  orderCode: number;
  orderId?: string;
}) => Promise<PayosConfirmResponse>;

type Options = {
  confirm: PayosConfirmFn;
  orderCode: number;
  orderId?: string;
  /** Gợi ý từ URL — KHÔNG dùng để quyết định thành công, chỉ để biết có nên chờ webhook hay không. */
  hint: PaymentHint;
  maxAttempts?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  isCancelled?: () => boolean;
};

/** orderCode hợp lệ: số nguyên dương trong giới hạn an toàn. */
export function parseOrderCode(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,16}$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Xác nhận thanh toán PayOS bằng API backend (nguồn sự thật), có thử lại giới hạn vì webhook PayOS
 * có thể đến trễ. Không bao giờ lặp vô hạn: tối đa `maxAttempts` lần cách nhau `delayMs`.
 *  - success:true            -> "success"
 *  - success:false           -> chờ & thử lại (trừ khi URL báo hủy/lỗi), cuối cùng "notPaid"/"cancelled"
 *  - 403 / 404               -> dừng ngay
 *  - 429                     -> chờ theo Retry-After (tối đa 10s) rồi thử lại trong số lần cho phép
 *  - lỗi khác (5xx, mạng)    -> thử lại, cuối cùng "error"
 */
export async function confirmPayosWithRetry(opts: Options): Promise<PayosOutcome> {
  const {
    confirm,
    orderCode,
    orderId,
    hint,
    maxAttempts = 6,
    delayMs = 2000,
    sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    isCancelled = () => false,
  } = opts;

  let last: PayosOutcome = { kind: "error" };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (isCancelled()) return last;
    let waitMs = delayMs;

    try {
      const res = await confirm({ orderCode, orderId });
      if (res?.success === true) return { kind: "success" };

      const message = res?.message || undefined;
      if (hint === "cancelled") return { kind: "cancelled", message };
      last = { kind: "notPaid", message };
      // URL báo lỗi: không cần chờ webhook.
      if (hint === "failed") return last;
    } catch (error) {
      const e = error as { status?: number; retryAfterSeconds?: number; data?: { message?: string } };
      if (e?.status === 403) return { kind: "forbidden" };
      if (e?.status === 404) return { kind: "notFound" };
      if (e?.status === 429) {
        last = { kind: "rateLimited", retryAfterSeconds: e.retryAfterSeconds };
        waitMs = Math.min(10_000, Math.max(delayMs, (e.retryAfterSeconds ?? 0) * 1000));
      } else {
        last = { kind: "error", message: e?.data?.message };
      }
    }

    if (attempt < maxAttempts) await sleep(waitMs);
  }

  return last;
}
