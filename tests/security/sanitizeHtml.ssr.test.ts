import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitizeHtml";

describe("sanitizeHtml không có DOM (SSR)", () => {
  it("fail-closed: không bao giờ trả HTML chưa lọc", () => {
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).toBe("");
  });
});
