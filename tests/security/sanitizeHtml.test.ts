// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitizeHtml";

describe("sanitizeHtml (stored/DOM XSS)", () => {
  it("loại bỏ <script>", () => {
    const out = sanitizeHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain("<p>hi</p>");
  });

  it("loại bỏ event handler (onerror/onclick)", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)"><a href="/a" onclick="alert(1)">a</a>');
    expect(out).not.toMatch(/onerror|onclick/i);
  });

  it("chặn javascript: trong href và src", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a><img src="javascript:alert(1)">');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("loại bỏ iframe, svg, form, style, object", () => {
    const out = sanitizeHtml(
      '<iframe src="https://evil.test"></iframe><svg onload="alert(1)"></svg><form action="https://evil.test"><input></form><style>*{display:none}</style><object data="x"></object>'
    );
    expect(out).not.toMatch(/<(iframe|svg|form|style|object|input)/i);
  });

  it("loại bỏ thuộc tính style (chống UI redress)", () => {
    const out = sanitizeHtml('<div style="position:fixed;top:0;left:0;width:100%;height:100%">x</div>');
    expect(out).not.toMatch(/style=/i);
  });

  it("ép rel=noopener noreferrer cho link", () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>');
    expect(out).toMatch(/rel="noopener noreferrer nofollow"/);
  });

  it("giữ lại nội dung hợp lệ (heading, ảnh, danh sách)", () => {
    const out = sanitizeHtml('<h2>Tiêu đề</h2><ul><li>a</li></ul><img src="https://res.cloudinary.com/x/a.png" alt="a">');
    expect(out).toContain("<h2>Tiêu đề</h2>");
    expect(out).toContain("<li>a</li>");
    expect(out).toContain('src="https://res.cloudinary.com/x/a.png"');
  });

  it("trả về chuỗi rỗng cho input rỗng", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
  });
});
