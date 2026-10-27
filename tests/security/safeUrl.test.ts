import { describe, expect, it } from "vitest";
import {
  resolvePostLoginPath,
  safeHttpUrl,
  safeInternalPath,
} from "@/lib/security/safeUrl";
import { safeCloudinaryUrl } from "@/lib/security/imageHosts";

describe("safeHttpUrl", () => {
  it("cho phép http(s)", () => {
    expect(safeHttpUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHttpUrl("http://example.com/")).toBe("http://example.com/");
  });
  it.each(["javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "//evil.com", "/relative", "", null, undefined])(
    "từ chối %s",
    (v) => {
      expect(safeHttpUrl(v as string)).toBeNull();
    }
  );
});

describe("safeInternalPath (open redirect)", () => {
  it("cho phép đường dẫn nội bộ", () => {
    expect(safeInternalPath("/account/orders?x=1")).toBe("/account/orders?x=1");
  });
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/ok\r\nSet-Cookie: a=b",
    "/\tfoo",
  ])("từ chối %j", (v) => {
    expect(safeInternalPath(v, "/")).toBe("/");
  });
  it("dùng fallback khi rỗng", () => {
    expect(safeInternalPath(null, "/home")).toBe("/home");
  });
});

describe("resolvePostLoginPath", () => {
  it("dùng redirect nội bộ", () => {
    expect(resolvePostLoginPath("?redirect=%2Fcart", "/")).toBe("/cart");
  });
  it("bỏ qua redirect ra ngoài", () => {
    expect(resolvePostLoginPath("?redirect=https%3A%2F%2Fevil.com", "/")).toBe("/");
    expect(resolvePostLoginPath("?redirect=%2F%2Fevil.com", "/admin")).toBe("/admin");
  });
});

describe("safeCloudinaryUrl", () => {
  it("chỉ chấp nhận host res.cloudinary.com thật sự", () => {
    expect(safeCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/a.png")).not.toBeNull();
    expect(safeCloudinaryUrl("https://evil.com/?cloudinary.com")).toBeNull();
    expect(safeCloudinaryUrl("https://res.cloudinary.com.evil.com/a.png")).toBeNull();
    expect(safeCloudinaryUrl("http://res.cloudinary.com/a.png")).toBeNull();
    expect(safeCloudinaryUrl("data:image/png;base64,AAAA")).toBeNull();
  });
});
