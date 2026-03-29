/** Verbose debug logs (set NEXT_PUBLIC_DEBUG_API=true). Shared outside `lib/api` to avoid import cycles. */
export const DEBUG_API = process.env.NEXT_PUBLIC_DEBUG_API === "true";
