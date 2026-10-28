import { z } from "zod";

/** Quy tắc mật khẩu dùng chung (đăng ký, đổi mật khẩu, đặt lại). Backend vẫn là nơi quyết định cuối cùng. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Một số mật khẩu quá phổ biến (so sánh không phân biệt hoa thường). Danh sách đầy đủ do backend giữ. */
const COMMON_PASSWORDS = new Set([
  "admin@123",
  "admin123",
  "admin1234",
  "password1",
  "password123",
  "password@123",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop1",
  "abc12345",
  "abcd1234",
  "iloveyou1",
  "welcome1",
  "welcome123",
  "letmein123",
  "pickleball1",
  "pickleball123",
  "11111111",
  "00000000",
]);

export function isCommonPassword(value: string): boolean {
  return COMMON_PASSWORDS.has(value.trim().toLowerCase());
}

/** Trả về thông báo lỗi đầu tiên hoặc null nếu hợp lệ. */
export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN) return `Mật khẩu phải có ít nhất ${PASSWORD_MIN} ký tự`;
  if (value.length > PASSWORD_MAX) return `Mật khẩu tối đa ${PASSWORD_MAX} ký tự`;
  if (!/[A-Za-z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ cái";
  if (!/\d/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ số";
  if (isCommonPassword(value)) return "Mật khẩu quá phổ biến, vui lòng chọn mật khẩu khác";
  return null;
}

export const passwordSchema = z.string().superRefine((value, ctx) => {
  const message = validatePassword(value);
  if (message) ctx.addIssue({ code: "custom", message });
});
