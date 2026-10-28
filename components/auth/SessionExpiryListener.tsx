"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/client";

/**
 * Khi refresh token không còn hiệu lực (đổi/reset mật khẩu, tài khoản bị khóa, đổi quyền, hết hạn...),
 * client phát SESSION_EXPIRED_EVENT. Ở đây: xóa cache cá nhân và chuyển về trang đăng nhập nếu
 * đang ở khu vực cần đăng nhập (/account, /admin).
 */
export function SessionExpiryListener() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onExpired = () => {
      queryClient.clear();
      queryClient.setQueryData(["user"], null);
      queryClient.setQueryData(["session"], { user: null, isAuthenticated: false });

      const needsAuth = pathname.startsWith("/account") || pathname.startsWith("/admin");
      if (needsAuth) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [queryClient, router, pathname]);

  return null;
}
