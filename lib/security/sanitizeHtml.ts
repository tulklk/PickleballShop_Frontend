import DOMPurify from "dompurify";

/**
 * Allowlist cho nội dung HTML do admin soạn (tin tức, mô tả sản phẩm).
 * Không cho phép: script, style, iframe, form, svg/math, object/embed, event handler, thuộc tính style.
 */
const ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "code", "div", "em", "figcaption", "figure",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre",
  "s", "span", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th",
  "thead", "tr", "u", "ul",
];
const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "width", "height", "target", "rel",
  "colspan", "rowspan", "loading",
];

let hooksInstalled = false;

function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      // Tránh reverse tabnabbing / rò referrer khi mở link ngoài.
      node.setAttribute("rel", "noopener noreferrer nofollow");
      if (node.getAttribute("target")) node.setAttribute("target", "_blank");
    }
    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
    }
  });
}

/**
 * Làm sạch HTML trước khi render bằng innerHTML / dangerouslySetInnerHTML.
 * Fail-closed: nếu không có DOM (SSR) thì trả về chuỗi rỗng thay vì trả HTML chưa lọc.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  if (typeof window === "undefined" || !DOMPurify.isSupported) return "";
  installHooks();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "form", "svg", "math", "object", "embed"],
    // Chỉ cho phép http(s), mailto, tel và đường dẫn tương đối.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
