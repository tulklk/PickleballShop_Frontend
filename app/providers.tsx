"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import { useMemo, useState } from "react";
import { AdminNotificationsProvider } from "@/components/admin/AdminNotificationsProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes - data được coi là fresh trong 10 phút
            gcTime: 30 * 60 * 1000, // 30 minutes - cache được giữ trong 30 phút (cacheTime renamed to gcTime)
            refetchOnWindowFocus: false, // Không refetch khi focus lại window
            refetchOnMount: false, // Không refetch khi mount lại nếu data còn fresh
            refetchOnReconnect: false, // Không refetch khi reconnect internet
            retry: (failureCount, error) => {
              // Không retry nếu là lỗi 4xx (client error) hoặc 5xx (server error) từ backend
              if (error && typeof error === "object" && "status" in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false; // Không retry cho client errors
                }
                if (status >= 500 && failureCount >= 1) {
                  return false; // Chỉ retry 1 lần cho server errors
                }
              }
              return failureCount < 1; // Retry tối đa 1 lần
            },
          },
        },
      })
  );

  const googleClientId = useMemo(
    () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    []
  );

  if (!googleClientId) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "❌ Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID. Google login will not work."
      );
      console.error(
        "Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file"
      );
    }
    // Render without GoogleOAuthProvider if clientId is missing
    return (
      <QueryClientProvider client={queryClient}>
        <AdminNotificationsProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
          </ThemeProvider>
        </AdminNotificationsProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AdminNotificationsProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
          </ThemeProvider>
        </AdminNotificationsProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

