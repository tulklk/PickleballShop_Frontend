"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/useAuth";
import type {
  NewOrderNotification,
  NewSupportMessageNotification,
} from "@/lib/api/types";
import { adminNotificationsHub } from "@/src/services/adminNotificationsHub";

type AdminNotificationContextValue = {
  newOrdersCount: number;
  newSupportCount: number;
  clearOrderNotifications: () => void;
  clearSupportNotifications: () => void;
  clearAllNotifications: () => void;
};

const AdminNotificationContext = createContext<AdminNotificationContextValue | null>(
  null
);

const defaultContextValue: AdminNotificationContextValue = {
  newOrdersCount: 0,
  newSupportCount: 0,
  clearOrderNotifications: () => {},
  clearSupportNotifications: () => {},
  clearAllNotifications: () => {},
};

export function useAdminNotificationCounts() {
  return useContext(AdminNotificationContext) ?? defaultContextValue;
}

export function AdminNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const connectFailedLogged = useRef(false);

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newSupportCount, setNewSupportCount] = useState(0);

  const clearOrderNotifications = useCallback(() => setNewOrdersCount(0), []);
  const clearSupportNotifications = useCallback(() => setNewSupportCount(0), []);
  const clearAllNotifications = useCallback(() => {
    setNewOrdersCount(0);
    setNewSupportCount(0);
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/admin/orders")) {
      setNewOrdersCount(0);
    }
    if (pathname?.startsWith("/admin/chat")) {
      setNewSupportCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isAdmin || !accessToken) {
      void adminNotificationsHub.disconnect();
      connectFailedLogged.current = false;
      setNewOrdersCount(0);
      setNewSupportCount(0);
      return;
    }

    let mounted = true;

    const onNewOrder = (payload: NewOrderNotification) => {
      setNewOrdersCount((c) => c + 1);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Bạn có 1 đơn hàng mới", {
        description:
          payload.customerName?.trim() ||
          payload.customerEmail?.trim() ||
          "Khách",
        action: {
          label: "Xem đơn",
          onClick: () => router.push(`/admin/orders/${payload.orderId}`),
        },
        duration: 8000,
      });
    };

    const onNewSupportMessage = (payload: NewSupportMessageNotification) => {
      setNewSupportCount((c) => c + 1);
      toast.message("Bạn có 1 tin nhắn mới", {
        description: [
          payload.customerName,
          payload.contentPreview || "Khách vừa gửi tin nhắn",
        ]
          .filter(Boolean)
          .join(" · "),
        action: {
          label: "Mở chat",
          onClick: () =>
            router.push(`/admin/chat?customerId=${encodeURIComponent(payload.customerId)}`),
        },
        duration: 8000,
      });
    };

    const onStatus = () => {
      /* optional */
    };

    adminNotificationsHub.onNewOrder(onNewOrder);
    adminNotificationsHub.onNewSupportMessage(onNewSupportMessage);
    adminNotificationsHub.onStatusChange(onStatus);

    void adminNotificationsHub.connect(accessToken).then((ok) => {
      if (!mounted) return;
      if (!ok && !connectFailedLogged.current) {
        connectFailedLogged.current = true;
        console.warn(
          "[AdminNotifications] Hub không kết nối được (kiểm tra quyền Admin / CORS / network)."
        );
      }
    });

    return () => {
      mounted = false;
      adminNotificationsHub.offNewOrder(onNewOrder);
      adminNotificationsHub.offNewSupportMessage(onNewSupportMessage);
      adminNotificationsHub.offStatusChange(onStatus);
      void adminNotificationsHub.disconnect();
    };
  }, [isAdmin, accessToken, queryClient, router]);

  const contextValue = useMemo<AdminNotificationContextValue>(
    () => ({
      newOrdersCount,
      newSupportCount,
      clearOrderNotifications,
      clearSupportNotifications,
      clearAllNotifications,
    }),
    [
      newOrdersCount,
      newSupportCount,
      clearOrderNotifications,
      clearSupportNotifications,
      clearAllNotifications,
    ]
  );

  return (
    <AdminNotificationContext.Provider value={contextValue}>
      {children}
    </AdminNotificationContext.Provider>
  );
}
